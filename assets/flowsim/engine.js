/* FLOW simulator: deterministic monthly accounting, no network or financial actions.
 * Rates are decimals. Annual price return EXCLUDES cash distributions.
 * See tests/fixtures/flowsim-reference.json for independent Python parity evidence.
 */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.FlowSim = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const clone = c => JSON.parse(JSON.stringify(c));
  const isObject = v => v !== null && typeof v === 'object' && !Array.isArray(v);
  function number(v, name, lo, hi) {
    if (typeof v !== 'number' || !Number.isFinite(v)) throw new Error(name + ': finite numeric value required');
    if ((lo !== undefined && v < lo) || (hi !== undefined && v > hi)) throw new Error(name + ': outside supported bounds');
    return v;
  }
  function at(v, m, name, lo, hi) { return number(Array.isArray(v) ? v[m - 1] : v, name, lo, hi); }
  const ratio = (a, b) => b > 0 ? a / b : null;
  const maxDefined = values => { const a = values.filter(v => v !== null); return a.length ? Math.max(...a) : null; };
  function dateParts(s) {
    if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) throw new Error('start_date: YYYY-MM-DD required');
    const [y, m, d] = s.split('-').map(Number), t = new Date(Date.UTC(y, m - 1, d));
    if (y < 100 || y > 9999 || t.getUTCFullYear() !== y || t.getUTCMonth() !== m - 1 || t.getUTCDate() !== d) throw new Error('start_date: invalid date');
    return [y, m, d];
  }
  function validate(c) {
    if (!isObject(c)) throw new Error('Configuration must be an object');
    for (const k of ['run_type','months','initial_assets','initial_debt','monthly_take_home','expenses','annual_income_growth','annual_inflation','annual_distribution_yield','annual_price_return','annual_apr','rate_convention','interest_timing','allocation','costs','evidence']) {
      if (!(k in c)) throw new Error('Missing required input: ' + k + '; unknown is not zero');
    }
    if (!['scenario','forecast','historical_reconstruction'].includes(c.run_type)) throw new Error('Invalid run_type');
    if (!Number.isInteger(c.months) || c.months < 1 || c.months > 1200) throw new Error('months: integer 1..1200');
    for (const k of ['initial_assets','initial_debt','monthly_take_home']) number(c[k], k, 0);
    for (const k of ['annual_income_growth','annual_inflation']) number(c[k], k, -0.999999);
    if (!['nominal_monthly','actual_365','actual_360'].includes(c.rate_convention)) throw new Error('Unsupported rate_convention');
    if (!['opening_debt','opening_plus_current_routing'].includes(c.interest_timing)) throw new Error('Unsupported interest_timing');
    if (c.rate_convention !== 'nominal_monthly') dateParts(c.start_date);
    for (const k of ['annual_distribution_yield','annual_price_return','annual_apr']) {
      if (Array.isArray(c[k]) && c[k].length !== c.months) throw new Error(k + ': monthly path must match months');
      for (let m = 1; m <= c.months; m++) at(c[k], m, k, k === 'annual_price_return' ? -12 : 0);
    }
    if (!['cash','capitalize'].includes(('interest_payment_policy' in c ? c.interest_payment_policy : 'cash'))) throw new Error('Unsupported interest_payment_policy');
    if(('initial_cash' in c && c.initial_cash!==0)||('reserve_floor' in (c.allocation||{}) && c.allocation.reserve_floor!==0)||('shortfall_policy' in c && c.shortfall_policy!=='stop'))throw new Error('Legacy reserve or asset-sale funding is no longer supported; remove these settings and review household shortfalls.');
    if (!Array.isArray(c.expenses) || !c.expenses.length) throw new Error('Supply all household expense categories');
    for (const e of c.expenses) {
      if (!isObject(e) || typeof e.name !== 'string' || !e.name.trim()) throw new Error('Expense name required');
      number(e.monthly_amount, e.name, 0);
      if (Array.isArray(e.routed_fraction) && e.routed_fraction.length !== c.months) throw new Error('routed_fraction: monthly path must match months');
      for (let m = 1; m <= c.months; m++) at(e.routed_fraction, m, 'routed_fraction', 0, 1);
    }
    if (!isObject(c.allocation) || !isObject(c.costs)) throw new Error('allocation and costs must be objects');
    for (const k of ['household_invest_fraction','distribution_reinvest_fraction','remaining_cash_debt_paydown_fraction']) number(c.allocation[k], k, 0, 1);

    if(c.allocation.remaining_cash_invest_fraction!==1)throw new Error('FLOW reinvests all remaining monthly funds; separate cash balances are not modeled');
    for (const k of ['tax_treatment','fee_treatment']) if (!['excluded','modeled_cash_estimate'].includes(c.costs[k])) throw new Error('Explicit ' + k + ' required');
    for (const k of ['monthly_fees','monthly_taxes']) number(c.costs[k], k, 0);
    if (c.costs.tax_treatment === 'excluded' && c.costs.monthly_taxes !== 0) throw new Error('Excluded taxes must have zero modeled amount');
    if (c.costs.fee_treatment === 'excluded' && c.costs.monthly_fees !== 0) throw new Error('Excluded fees must have zero modeled amount');
    if (!isObject(c.evidence)) throw new Error('evidence must identify facts, assumptions, dates and gaps');
    if ('shocks' in c && !Array.isArray(c.shocks)) throw new Error('shocks must be an array');
    for (const s of c.shocks || []) {
      if (!isObject(s) || !Number.isInteger(s.month) || s.month < 1 || s.month > c.months) throw new Error('shock month out of range');
      for (const k of ['asset_multiplier','distribution_multiplier','income_multiplier']) if (k in s) number(s[k], k, 0);
      if ('accessible_cash_fraction' in s)throw new Error('Legacy cash-access shocks are no longer supported');
      if ('apr_override' in s) number(s.apr_override, 'apr_override', 0);
    }
    if ('scenario_constraints' in c && !isObject(c.scenario_constraints)) throw new Error('scenario_constraints must be an object');
    for (const [k, v] of Object.entries(c.scenario_constraints || {})) {
      if (!['max_dta','min_interest_coverage'].includes(k)) throw new Error('Unsupported scenario constraint ' + k);
      number(v, k, 0);
    }
    if (c.adaptive_policy) {
      const p=c.adaptive_policy;
      if(!isObject(p))throw new Error('Adaptive policy must be an object');
      if(!['gradual','maximum','target'].includes(p.mode??'gradual'))throw new Error('Invalid adaptive mode');
      if(p.mode==='target'){number(p.target_dta,'target_dta',0,1);if(p.target_dta>c.scenario_constraints?.max_dta)throw new Error('Target DTA must not exceed the hard DTA guardrail');}
      if('reserve_known' in p || 'reserve_months' in p)throw new Error('Legacy adaptive reserve gate retired: explicitly remove reserve_known and reserve_months for the FLOW-only model; review the changed policy before rerunning.');
      number(p.monthly_increase,'monthly_increase',0);
      for(const k of ['asset_haircut','payout_cut'])number(p[k],k,0,1);
      number(p.apr_add,'apr_add',0);
      number(c.scenario_constraints?.max_dta,'adaptive max_dta',0,1);
      number(c.scenario_constraints?.min_interest_coverage,'adaptive min_interest_coverage',0);
      if(c.rate_convention!=='nominal_monthly'||c.interest_timing!=='opening_plus_current_routing')throw new Error('Adaptive routing requires nominal monthly opening-plus-routing interest');
    }
    return c;
  }
  function adaptiveRoute(c,s) {
    const p=c.adaptive_policy,collateral=s.assets*(1-p.asset_haircut),payout=s.distributions*(1-p.asset_haircut)*(1-p.payout_cut),rate=s.apr+p.apr_add;
    const ceiling=Math.min(s.expenses,s.ceiling);
    function check(candidate){
      const interest=(s.debt+candidate)*rate/12,peak=s.debt+candidate+(c.interest_payment_policy==='capitalize'?interest:0),dta=ratio(peak,collateral),coverage=ratio(payout,interest),reasons=[];
      if(dta===null)reasons.push('dta_undefined');else if(dta>c.scenario_constraints.max_dta+1e-12)reasons.push('peak_dta');
      if(coverage===null)reasons.push('coverage_undefined');else if(coverage+1e-12<c.scenario_constraints.min_interest_coverage)reasons.push('interest_coverage');
      const actualInterest=(s.debt+candidate)*s.apr/12,free=s.income-s.expenses+candidate-(c.interest_payment_policy==='capitalize'?0:actualInterest)-c.costs.monthly_fees-c.costs.monthly_taxes;
      if(free+s.distributions < -1e-8)reasons.push('cash_funding');
      const actualPeak=s.debt+candidate+(c.interest_payment_policy==='capitalize'?actualInterest:0),targetDta=ratio(actualPeak,s.assets);
      if(p.mode==='target'){if(targetDta===null)reasons.push('target_undefined');else if(targetDta>p.target_dta+1e-12)reasons.push('target_dta');}
      return {candidate,dta,coverage,targetDta,reasons};
    }
    // Every current screen is an affine half-line in borrowing x (coverage
    // has a positive denominator). Their intersection is one interval, not
    // a monotone pass/fail predicate: funding can impose a LOWER bound.
    // Solve upper bounds, then validate candidates with the original checks.
    // No coarse scan, binary search, or candidate-count truncation.
    if(![ceiling,s.assets,s.debt,s.income,s.expenses,s.distributions,c.costs.monthly_fees,c.costs.monthly_taxes,rate].every(v=>Number.isFinite(v)&&Math.abs(v)<=1e12))throw new Error('Automatic precision supports finite monthly amounts and rates up to 1 trillion; no search result returned outside this range');
    const cap=c.interest_payment_policy==='capitalize';
    let upper=ceiling;
    upper=Math.min(upper,collateral*(c.scenario_constraints.max_dta+1e-12)/(1+(cap?rate/12:0))-s.debt);
    const coverageLimit=c.scenario_constraints.min_interest_coverage-1e-12;
    if(coverageLimit>0&&rate>0)upper=Math.min(upper,payout*12/(rate*coverageLimit)-s.debt);
    if(p.mode==='target')upper=Math.min(upper,s.assets*(p.target_dta+1e-12)/(1+(cap?s.apr/12:0))-s.debt);
    const slope=1-(cap?0:s.apr/12),base=s.income-s.expenses-(cap?0:s.debt*s.apr/12)-c.costs.monthly_fees-c.costs.monthly_taxes+s.distributions;
    if(slope<0)upper=Math.min(upper,(base+1e-8)/-slope);
    // Whole-dollar candidates plus the expense/ramp ceiling rounded DOWN to
    // cents. Checking adjacent integers handles floating-point boundary noise.
    const exactCeiling=Math.floor(ceiling*100)/100;
    const top=Math.min(Math.floor(ceiling),Math.max(0,Math.floor(upper)));
    const candidates=[exactCeiling,top+1,top,top-1,0].filter(x=>x>=0&&x<=ceiling);
    candidates.sort((a,b)=>b-a);
    let selected=null;
    for(const x of [...new Set(candidates)]){const r=check(x);if(!r.reasons.length){selected=r;break;}}
    const screen=selected??check(0),amount=selected?.candidate??0;
    const next=Math.min(exactCeiling,Math.floor(amount)+1),rejected=check(next);
    return {amount,ceiling,screen,reasons:selected?(next>amount?rejected.reasons:[(p.mode??'gradual')==='gradual'?'monthly_ceiling_or_grid':'bills_or_grid']):screen.reasons};
  }

  function dayFraction(c, m) {
    if (c.rate_convention === 'nominal_monthly') return 1 / 12;
    const [year, month] = dateParts(c.start_date);
    const days = new Date(Date.UTC(year, month + m - 1, 0)).getUTCDate();
    return days / (c.rate_convention === 'actual_365' ? 365 : 360);
  }
  function simulate(config, payCash = false, fixedRouting = false) {
    validate(config); // Validate before JSON copying so NaN/Infinity cannot silently become null.
    const c = cleanConfig(config); let A = c.initial_assets, D = c.initial_debt;
    const rows = []; let inflation = 1, income = c.monthly_take_home, status = 'completed', failure = null;
    let dm = 1, im = 1, aprOverride = null, previousRouted=0;
    for (let m = 1; m <= c.months; m++) {
      const openingA = A, openingD = D, openingE = A - D;
      if (m > 1) { inflation *= 1 + c.annual_inflation / 12; income *= 1 + c.annual_income_growth / 12; }
      let shockReturn = 0;
      for (const s of c.shocks || []) if (s.month === m) {
        const old = A; A *= s.asset_multiplier ?? 1; shockReturn += A - old;
        dm = s.distribution_multiplier ?? dm; im = s.income_multiplier ?? im;
        aprOverride = s.apr_override ?? aprOverride;
      }
      const admissionAssets=A;
      const postShockDta = ratio(D, A), priceGain = A * at(c.annual_price_return, m, 'annual_price_return') / 12;
      const dist = A * at(c.annual_distribution_yield, m, 'annual_distribution_yield') / 12 * dm;
      A += priceGain;
      if (A < -1e-8) throw new Error('Price path creates negative asset value');
      const expenses = c.expenses.reduce((s, e) => s + e.monthly_amount * inflation, 0);
      let routed = payCash ? 0 : c.expenses.reduce((s, e) => s + e.monthly_amount * inflation * at(e.routed_fraction, m, 'routed_fraction'), 0);
      const actualIncome = income * im, apr = aprOverride ?? at(c.annual_apr, m, 'annual_apr');
      let admission=null;
      if(c.adaptive_policy&&!payCash&&!fixedRouting){admission=adaptiveRoute(c,{assets:admissionAssets,debt:D,expenses,distributions:dist,apr,income:actualIncome,ceiling:(c.adaptive_policy.mode??'gradual')==='gradual'?(m===1?routed:previousRouted+c.adaptive_policy.monthly_increase):expenses});routed=admission.amount;}
      const interest = (D + (c.interest_timing === 'opening_plus_current_routing' ? routed : 0)) * apr * dayFraction(c, m);
      const fees = c.costs.monthly_fees, taxes = c.costs.monthly_taxes, surplus = actualIncome - expenses;
      const capitalized = c.interest_payment_policy === 'capitalize' ? interest : 0, interestPaid = interest - capitalized;
      const free = surplus + routed - interestPaid - fees - taxes;
      D += routed + capitalized; let C = free + dist;
      const peakFinancingDebt=D;
      let invested=0,repaid=0,paycheckInvested=0;
      const fundingShortfall=Math.max(0,-C);
      const reason=C < -1e-8?'unfunded_cash_gap':A+C-D < -1e-8?'negative_net_equity':null;
      if(reason){status='failed';failure={month:m,reason,cash_gap:fundingShortfall,failed_checks:[...(fundingShortfall>1e-8?['unfunded_cash_gap']:[]),...(A+C-D < -1e-8?['negative_net_equity']:[])]};}
      else {
        let available=Math.max(0,C);
        const target=Math.max(0,free)*c.allocation.household_invest_fraction+dist*c.allocation.distribution_reinvest_fraction;
        invested=Math.min(available,target);A+=invested;available-=invested;
        paycheckInvested=Math.min(invested,Math.max(0,free)*c.allocation.household_invest_fraction);
        repaid=Math.min(D,available*c.allocation.remaining_cash_debt_paydown_fraction);D-=repaid;available-=repaid;
        A+=available;invested+=available;C=0;
      }
      const peakDta=ratio(peakFinancingDebt,admissionAssets), observedMaxDta=maxDefined([ratio(openingD,openingA),postShockDta,ratio(D,A)]), periodMaxDta = maxDefined([observedMaxDta,peakDta]), E = A - D;
      const economic = shockReturn + priceGain + dist, residual = E - openingE - (surplus + economic - interest - fees - taxes) + (reason?C:0);
      if (![A,D,C,E,interest,economic,residual].every(Number.isFinite)) throw new Error('Scenario exceeds finite numeric range in month ' + m);
      if (Math.abs(residual) > Math.max(1e-7, Math.abs(E) * 1e-11)) throw new Error('Accounting identity failed month ' + m + ': ' + residual);
      const dta = ratio(D,A), coverage = ratio(dist,interest), violations = [], unknown = [];
      const metrics = {max_dta:periodMaxDta,min_interest_coverage:coverage};
      for (const [k, limit] of Object.entries(c.scenario_constraints || {})) {
        const v = metrics[k]; if (v === null) unknown.push(k);
        else if (k.startsWith('max') ? v > limit : v < limit) violations.push(k);
      }
      rows.push({month:m,opening_assets:openingA,opening_debt:openingD,income:actualIncome,expenses,routed_expenses:routed,unrouted_expenses:expenses-routed,external_surplus:surplus,household_cash_after_financing:free,distributions:dist,price_gain:priceGain,shock_return:shockReturn,economic_return:economic,interest,interest_paid:interestPaid,capitalized_interest:capitalized,apr,fees,taxes,invested,principal_repaid:repaid,assets:A,total_assets:A,debt:D,net_equity:E,real_net_equity:E/inflation,dta,post_shock_dta:postShockDta,period_max_dta:periodMaxDta,observed_max_dta:observedMaxDta,peak_financing_debt:peakFinancingDebt,peak_financing_dta:peakDta,portfolio_interest_coverage:coverage,portfolio_cash_after_interest:dist-interest,distribution_expense_coverage:ratio(dist,expenses),funding_shortfall:fundingShortfall,accounting_residual:residual,scenario_constraint_violations:violations,scenario_constraints_undefined:unknown,status});
      if(c.adaptive_policy)Object.assign(rows[rows.length-1],{financed_share:ratio(routed,expenses),paycheck_target_invested:paycheckInvested,peak_financing_debt:peakFinancingDebt,peak_financing_dta:ratio(peakFinancingDebt,admissionAssets),routing_ceiling:admission?.ceiling??0,routing_policy:c.adaptive_policy.mode??'gradual',target_dta:c.adaptive_policy.mode==='target'?c.adaptive_policy.target_dta:null,target_peak_dta:admission?.screen.targetDta??null,admission_passed:admission?admission.screen.reasons.length===0:null,admission_failures:admission?.screen.reasons??[],screen_dta:admission?.screen.dta??null,screen_interest_coverage:admission?.screen.coverage??null,routing_decision:payCash?'pay_cash':fixedRouting?'fixed':routed>previousRouted?'increased':routed<previousRouted?'decreased':'unchanged',routing_reasons:admission?.reasons??[payCash?'pay_cash':'fixed']});
      previousRouted=routed;
      if (failure) break;
    }
    const annual = [], keys = ['income','expenses','routed_expenses','unrouted_expenses','external_surplus','distributions','economic_return','interest','interest_paid','capitalized_interest','fees','taxes','invested','principal_repaid'];
    for (let i = 0; i < rows.length; i += 12) {
      const b = rows.slice(i,i+12), last = b[b.length-1], r = {};
      for (const k of keys) r[k] = b.reduce((s,x) => s+x[k],0);
      Object.assign(r,{year:i/12+1,months:b.length,ending_assets:last.assets,ending_debt:last.debt,ending_net_equity:last.net_equity,ending_dta:last.dta,portfolio_interest_coverage:ratio(r.distributions,r.interest)}); annual.push(r);
    }
    return {status,failure,monthly:rows,annual,final:rows[rows.length-1],max_dta:maxDefined(rows.map(r=>r.period_max_dta)),initial_net_equity:c.initial_assets-c.initial_debt};
  }
  function cleanConfig(config){const c=clone(config);delete c.initial_cash;delete c.shortfall_policy;delete c.allocation.reserve_floor;if(c.evidence)delete c.evidence.reserve_status;return c;}
  function compare(config) {
    validate(config);const c=cleanConfig(config);
    const flow = simulate(c), cash = simulate(c,true);
    const same = flow.status === 'completed' && cash.status === 'completed' && flow.final.month === c.months && cash.final.month === c.months;
    const result={run_type:c.run_type,inputs:clone(c),scope:'Offline household scenario; not a lender test, forecast guarantee or borrowing permission',conventions:{returns:'nominal annual price return / 12 plus separate cash distributions; never supply total return as price return',inflation:'nominal annual / 12 compounded, all bills; month 1 uninflated',dta:'debt / investment assets, investment scope only',coverage:'portfolio cash distributions / interest only; not household DSCR; undefined ratios are null',timing:c.interest_timing,interest_payment_policy:('interest_payment_policy' in c ? c.interest_payment_policy : 'cash'),costs:clone(c.costs)},flow,pay_cash:cash,comparison:{same_full_horizon:same,ending_equity_advantage:same ? flow.final.net_equity-cash.final.net_equity : null},limitations:['No intramonth solvency/settlement, lender eligibility or house maintenance modeled','Monthly fees/taxes are supplied cash estimates, not tax-law calculations','No probabilities; deterministic paths are assumptions, not calibrated forecasts']};
    if(c.adaptive_policy){result.fixed=simulate(c,false,true);const comparable=flow.status==='completed'&&result.fixed.status==='completed';result.comparison.fixed_same_full_horizon=comparable;result.comparison.advantage_over_fixed=comparable?flow.final.net_equity-result.fixed.final.net_equity:null;}
    return result;
  }
  function defaultConfig() {
    return {run_type:'scenario',months:36,initial_assets:10000,initial_debt:0,monthly_take_home:5000,expenses:[{name:'Total household bills',monthly_amount:3500,routed_fraction:900/3500}],annual_income_growth:0.032,annual_inflation:0.032,annual_distribution_yield:0.07390497057934528,annual_price_return:0.02,annual_apr:0.059,rate_convention:'nominal_monthly',interest_timing:'opening_plus_current_routing',interest_payment_policy:'cash',allocation:{household_invest_fraction:1,distribution_reinvest_fraction:0,remaining_cash_debt_paydown_fraction:1,remaining_cash_invest_fraction:1},costs:{tax_treatment:'excluded',fee_treatment:'excluded',monthly_fees:0,monthly_taxes:0},evidence:{classification:'Synthetic educational sample'},scenario_constraints:{max_dta:0.25,min_interest_coverage:3}};
  }
  return {validate,simulate,compare,defaultConfig};
}));

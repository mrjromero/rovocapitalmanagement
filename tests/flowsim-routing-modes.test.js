'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),E=require('../assets/flowsim/engine.js');
const near=(a,b)=>assert(Math.abs(a-b)<1e-6,`${a} != ${b}`);
function config(mode='maximum'){
 const c=E.defaultConfig();Object.assign(c,{months:12,initial_assets:10000,initial_debt:1000,initial_cash:0,monthly_take_home:4000,annual_income_growth:0,annual_inflation:0,annual_distribution_yield:.12,annual_price_return:0,annual_apr:.12,interest_payment_policy:'capitalize'});
 c.expenses=[{name:'Synthetic bills',monthly_amount:2000,routed_fraction:.05}];
 c.scenario_constraints={max_dta:.25,min_interest_coverage:3};
 c.adaptive_policy={mode,target_dta:.15,grid_dollars:1,monthly_increase:100,asset_haircut:0,payout_cut:0,apr_add:0};return c;
}
test('maximum ignores initial/ramp ceilings; gradual retains legacy path',()=>{
 const c=config(),max=E.simulate(c).monthly[0];assert.equal(max.routed_expenses,1475);near(max.peak_financing_debt,2499.75);
 c.adaptive_policy.mode='gradual';const gradual=E.simulate(c);assert.equal(gradual.monthly[0].routed_expenses,100);
 delete c.adaptive_policy.mode;assert.deepEqual(E.simulate(c),gradual);
});
test('target caps actual borrowing peak, excludes new contributions and price growth',()=>{
 const c=config('target');Object.assign(c,{months:1,monthly_take_home:100000,annual_price_return:1});
 const r=E.simulate(c).monthly[0];assert.equal(r.routed_expenses,485);near(r.target_peak_dta,.149985);assert(r.routing_reasons.includes('target_dta'));assert(r.dta<r.target_peak_dta);
 c.interest_payment_policy='cash';assert.equal(E.simulate(c).monthly[0].routed_expenses,500);
});
test('target below inherited ratio pauses borrowing without invented repayment',()=>{
 const c=config('target');c.adaptive_policy.target_dta=.05;const r=E.simulate(c).monthly[0];
 assert.equal(r.routed_expenses,0);assert.equal(r.admission_passed,false);assert(r.admission_failures.includes('target_dta'));assert(!r.scenario_constraint_violations.includes('max_dta'));near(r.principal_repaid,100);near(r.debt,910);
});
test('all modes retain inherited stressed breach even when actual ratio passes',()=>{
 for(const mode of ['gradual','maximum','target']){const c=config(mode);c.initial_debt=2200;c.adaptive_policy.asset_haircut=.2;const r=E.simulate(c).monthly[0];assert.equal(r.routed_expenses,0);assert.equal(r.admission_passed,false);assert(r.admission_failures.includes('peak_dta'));assert(r.screen_dta>.25);assert(r.peak_financing_dta<.25);}
});
test('bill cap and automatic precision never manufacture extra borrowing',()=>{
 for(const mode of ['maximum','target']){const c=config(mode);c.initial_assets=100000;c.expenses[0].monthly_amount=1050.5;c.adaptive_policy.grid_dollars=100;assert.equal(E.simulate(c).monthly[0].routed_expenses,1050.5);c.adaptive_policy.grid_dollars=1;assert.equal(E.simulate(c).monthly[0].routed_expenses,1050.5);c.expenses[0].monthly_amount=0;const r=E.simulate(c).monthly[0];assert.equal(r.routed_expenses,0);assert.equal(r.financed_share,null);}
});
test('all policies decrease immediately when capacity shrinks',()=>{
 for(const mode of ['gradual','maximum','target']){const c=config(mode);c.shocks=[{month:3,asset_multiplier:.2,distribution_multiplier:.01,apr_override:.3}];const r=E.simulate(c).monthly;assert(r[2].routed_expenses<r[1].routed_expenses);assert.equal(r[2].routing_decision,'decreased');assert.equal(r[2].admission_passed,false);}
});
test('unknown/zero B2 still permits funded candidates, but no funding is invented',()=>{
 for(const mode of ['gradual','maximum','target']){const c=config(mode);assert(E.simulate(c).monthly[0].routed_expenses>0);c.monthly_take_home=0;c.annual_distribution_yield=0;const r=E.simulate(c);assert.equal(r.status,'failed');assert(r.monthly[0].admission_failures.includes('cash_funding'));assert.equal(r.monthly[0].funding_shortfall,2000);}
});
test('descending search handles cash-funding lower bound alongside debt upper bound',()=>{
 const c=config();c.monthly_take_home=500;const r=E.simulate(c).monthly[0];assert.equal(r.routed_expenses,1475);assert.equal(r.status,'completed');
 const zero=structuredClone(c);delete zero.adaptive_policy;zero.expenses[0].routed_fraction=0;assert.equal(E.simulate(zero).status,'failed');
});
test('each policy replays exactly through fixed accounting with no look-ahead',()=>{
 for(const mode of ['gradual','maximum','target'])for(const interest of ['cash','capitalize']){
 const c=config(mode);c.interest_payment_policy=interest;const result=E.compare(c),replay=structuredClone(c);delete replay.adaptive_policy;replay.expenses[0].routed_fraction=result.flow.monthly.map(r=>r.routed_expenses/r.expenses);
 const r=E.simulate(replay);result.flow.monthly.forEach((a,i)=>{for(const k of ['assets','debt','net_equity','interest','principal_repaid','invested'])near(a[k],r.monthly[i][k]);near(a.accounting_residual,0);assert(a.routed_expenses<=a.expenses);if(a.routed_expenses>0){assert.equal(a.admission_passed,true);assert(a.screen_dta<=.25);assert(a.screen_interest_coverage>=3);if(mode==='target')assert(a.target_peak_dta<=.15);}});
 const fixed=structuredClone(c);delete fixed.adaptive_policy;const expected=E.simulate(fixed);expected.monthly.forEach((a,i)=>near(a.net_equity,result.fixed.monthly[i].net_equity));
 const future=structuredClone(c);future.shocks=[{month:7,asset_multiplier:.1}];assert.deepEqual(E.simulate(future).monthly.slice(0,6),result.flow.monthly.slice(0,6));
 }
});
test('invalid target/mode and oversized search fail explicitly',()=>{
 for(const target of [-1,.26,NaN,undefined]){const c=config('target');c.adaptive_policy.target_dta=target;assert.throws(()=>E.simulate(c),/target|Target/);}
 const c=config();c.adaptive_policy.mode='unknown';assert.throws(()=>E.simulate(c),/mode/);c.adaptive_policy.mode='maximum';c.expenses[0].monthly_amount=2e12;assert.throws(()=>E.simulate(c),/1 trillion/);
});
test('all modes report undefined zero-collateral and zero-interest admission',()=>{
 for(const mode of ['gradual','maximum','target'])for(const zero of ['initial_assets','annual_apr']){const c=config(mode);c[zero]=0;const r=E.simulate(c).monthly[0];assert.equal(r.routed_expenses,0);assert.equal(r.admission_passed,false);assert(r.admission_failures.includes(zero==='initial_assets'?'dta_undefined':'coverage_undefined'));assert(Number.isFinite(r.net_equity));}
});

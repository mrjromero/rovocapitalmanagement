'use strict';
const assert = require('node:assert/strict');
const {test} = require('node:test');
const fs = require('node:fs');
const engine = require('../assets/flowsim/engine.js');
const fixture = JSON.parse(fs.readFileSync(require.resolve('./fixtures/flowsim-reference.json'),'utf8'));
function equal(actual, expected, path='result') {
  if (typeof expected === 'number') {
    assert.equal(typeof actual,'number',path);
    assert.ok(Math.abs(actual-expected) <= Math.max(1e-7,Math.abs(expected)*1e-11),`${path}: ${actual} != ${expected}`);
  } else if (Array.isArray(expected)) {
    assert.ok(Array.isArray(actual),path); assert.equal(actual.length,expected.length,path+'.length');
    expected.forEach((e,i)=>equal(actual[i],e,`${path}[${i}]`));
  } else if (expected && typeof expected === 'object') {
    for (const [k,v] of Object.entries(expected)) equal(actual[k],v,path+'.'+k);
  } else assert.equal(actual,expected,path);
}
// Reference fixtures predate the peak-risk reporting correction; preserve all financial comparisons.
function accountingOnly(value){if(Array.isArray(value))return value.map(accountingOnly);if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).filter(([k])=>!['max_dta','period_max_dta','scenario_constraint_violations'].includes(k)).map(([k,v])=>[k,accountingOnly(v)]));return value;}
for(const c of fixture.cases)test('Python accounting parity and independent peak-risk checks: '+c.name,()=>{const actual=engine.compare(c.input);equal(accountingOnly(actual),accountingOnly(c.expected));for(const strategy of ['flow','pay_cash']){const path=actual[strategy];for(let i=0;i<path.monthly.length;i++){const r=path.monthly[i],old=c.expected[strategy].monthly[i],collateral=r.opening_assets+r.shock_return,peak=collateral>0?(r.opening_debt+r.routed_expenses+r.capitalized_interest)/collateral:null;equal(r.peak_financing_dta,peak);equal(r.observed_max_dta,old.period_max_dta);const values=[old.period_max_dta,peak].filter(v=>v!==null);equal(r.period_max_dta,values.length?Math.max(...values):null);assert.deepEqual(r.scenario_constraint_violations.filter(k=>k!=='max_dta'),old.scenario_constraint_violations.filter(k=>k!=='max_dta'));if(c.input.scenario_constraints?.max_dta!==undefined)assert.equal(r.scenario_constraint_violations.includes('max_dta'),r.period_max_dta!==null&&r.period_max_dta>c.input.scenario_constraints.max_dta);}const maxima=path.monthly.map(r=>r.period_max_dta).filter(v=>v!==null);equal(path.max_dta,maxima.length?Math.max(...maxima):null);}});
test('matches published synthetic 36-month baseline and first month',()=>{
 const r=engine.compare(engine.defaultConfig());
 equal(r.flow.final.net_equity,79384.33546853966);
 equal(r.flow.monthly[0].invested,2395.575);
 equal(r.flow.monthly[0].debt,838.4125245172121);
 equal(r.flow.monthly[0].net_equity,11573.829142149452);
 assert.equal(r.pay_cash.monthly[0].portfolio_interest_coverage,null);
 assert.ok(r.pay_cash.monthly[0].scenario_constraints_undefined.includes('min_interest_coverage'));
});
test('every monthly identity reconciles and borrowing is never income',()=>{
 for(const c of fixture.cases) for(const ledger of [engine.compare(c.input).flow,engine.compare(c.input).pay_cash]) {
  for(const r of ledger.monthly) {
   equal(r.external_surplus,r.income-r.expenses);
   equal(r.unrouted_expenses+r.routed_expenses,r.expenses);
   equal(r.assets+r.cash-r.debt,r.net_equity);
   assert.ok(Math.abs(r.accounting_residual)<1e-7);
  }
 }
});
test('comparison is undefined when either path fails, not a false win',()=>{
 const c=engine.defaultConfig();c.monthly_take_home=1000;
 const r=engine.compare(c);assert.equal(r.comparison.same_full_horizon,false);assert.equal(r.comparison.ending_equity_advantage,null);
});
test('existing debt remains in pay-cash alternative',()=>{
 const c=engine.defaultConfig();c.initial_debt=3000;const r=engine.compare(c);
 assert.equal(r.pay_cash.monthly[0].opening_debt,3000);assert.ok(r.pay_cash.monthly[0].interest>0);assert.equal(r.pay_cash.monthly[0].routed_expenses,0);
});
test('inputs and defaults remain isolated across repeated runs',()=>{
 const c=engine.defaultConfig(), before=JSON.stringify(c), first=engine.compare(c);
 assert.equal(JSON.stringify(c),before);assert.deepEqual(engine.compare(c),first);
 c.expenses[0].monthly_amount=0;assert.equal(engine.defaultConfig().expenses[0].monthly_amount,3500);
});
const invalid=[
 ['NaN',c=>c.initial_assets=NaN],['Infinity',c=>c.annual_apr=Infinity],['negative debt',c=>c.initial_debt=-1],
 ['fraction above one',c=>c.expenses[0].routed_fraction=1.01],['fraction below zero',c=>c.expenses[0].routed_fraction=-.01],
 ['missing pay',c=>delete c.monthly_take_home],['fractional horizon',c=>c.months=2.5],['zero horizon',c=>c.months=0],
 ['short rate path',c=>c.annual_apr=[.05]],['null costs',c=>c.costs=null],['missing reserves',c=>delete c.initial_cash],
 ['invalid calendar date',c=>{c.rate_convention='actual_365';c.start_date='2027-02-29';}],
 ['invalid shock',c=>c.shocks=[{month:37}]],['invalid access',c=>c.shocks=[{month:1,accessible_cash_fraction:2}]],
 ['unknown constraint',c=>c.scenario_constraints={dscr:3}],['excluded nonzero taxes',c=>c.costs.monthly_taxes=10],
 ['noninteger shock month',c=>c.shocks=[{month:1.5}]],['boolean asset',c=>c.initial_assets=true],
 ['empty expenses',c=>c.expenses=[]],['negative APR',c=>c.annual_apr=-.01],['empty interest policy',c=>c.interest_payment_policy=''],['null interest policy',c=>c.interest_payment_policy=null]
];
for(const [name,mutate] of invalid) test('rejects '+name,()=>{const c=engine.defaultConfig();mutate(c);assert.throws(()=>engine.compare(c));});
test('numeric overflow cannot be presented as valid output',()=>{const c=engine.defaultConfig();c.annual_income_growth=1e308;assert.throws(()=>engine.compare(c));});

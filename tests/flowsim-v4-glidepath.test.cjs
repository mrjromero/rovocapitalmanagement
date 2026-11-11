const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs');
const root=require('node:path').join(__dirname,'..');
const html=fs.readFileSync(root+'/FlowSimV4.html','utf8'),window={};
new Function('window',html.match(/<script id="engine">([\s\S]*?)<\/script>/)[1])(window);
new Function('window',html.match(/<script id="glidepath">([\s\S]*?)<\/script>/)[1])(window);
const F=window.FlowSimV4,G=window.FlowGlidepathV4,E=1e-7,R=1e-10;
const near=(a,b,t=E)=>assert(Math.abs(a-b)<=t,`${a} != ${b}`);
const fixture={assets:184000,debt:46500,pay:330,bills:1120,yield:7,apr:4,growth:4,bandFloor:12,bandCeiling:26,maxDta:40,minCoverage:3,months:24,bandSplit:83,payGrowth:0,inflation:0};
function oraclePass(result,start){
  if(result.failure||result.rows.length!==result.config.months)return false;
  const c=result.config,tail=result.rows.slice(start-1);
  return tail.some(x=>x.redirected>E)&&tail.every(x=>Math.abs(x.financed-x.bills)<=E&&x.payBills<=E&&x.cashBills<=E&&Number.isFinite(x.dta)&&x.dta>=c.bandFloor/100-R&&x.dta<=c.bandCeiling/100+R&&Number.isFinite(x.preDta)&&x.preDta<=c.maxDta/100+R&&x.dta<=c.maxDta/100+R&&x.capitalized<=E&&(x.interest===0||Number.isFinite(x.coverage)&&x.coverage>=c.minCoverage-R)&&x.allocationGap<=E);
}
function oracle(config){
  const c={...F.defaults,...config};
  for(let start=1;start<=c.months;start++)for(let pct=0;pct<100;pct++){
    const run=F.simulate({...c,contribution:100,reduceStart:start,reduced:pct},{redirectReduced:true});
    if(oraclePass(run,start))return {start,pct};
  }
  return null;
}
test('default 240-month plan begins at 188 with 97%, not output crossover 182',()=>{
  const r=G.analyze({months:240});assert.equal(r.crossoverMonth,182);assert.equal(r.startMonth,188);assert.equal(r.taperPct,97);assert.equal(r.monthsChecked,53);assert.equal(r.fullRedirectionMonth,188);assert(oraclePass(r.candidate,188));near(r.firstMonthRedirected,221.36509991263938);near(r.firstMonthContribution,7157.471563842023);near(r.candidate.final.cash,0,1e-7);assert.equal(r.candidate.rows.slice(187).filter(x=>x.payBills>E||x.cashBills>E).length,0);
  const lower=F.simulate({months:240,reduceStart:188,reduced:96},{redirectReduced:true});assert(!oraclePass(lower,188));assert.deepEqual(r.candidate.rows.slice(0,187),r.baseline.rows.slice(0,187));
});
test('120 and 600 months have no passing plan; search uses early rejection',()=>{
  assert.equal(G.analyze().eligible,false);const r=G.analyze({months:600});assert.equal(r.eligible,false);assert.equal(r.startMonth,null);assert.equal(r.monthsChecked,0);assert.equal(r.tested,41300);assert(r.monthsEvaluated<1000000,`Too many transitions: ${r.monthsEvaluated}`);assert.equal(r.blockers[0].code,'belowBand');
});
test('feasible plan need not wait for any output crossover',()=>{
  const c={assets:100000,debt:25000,pay:10000,bills:500,yield:0,apr:0,growth:0,payGrowth:0,inflation:0,bandFloor:0,bandCeiling:30,maxDta:50,months:3};
  const r=G.analyze(c);assert.equal(r.crossoverMonth,null);assert.equal(r.startMonth,1);assert.equal(r.taperPct,0);assert.equal(r.monthsChecked,3);assert(oraclePass(r.candidate,1));assert.match(G.narrative(r,true,r.candidate).join(' '),/tested separately/);
});
test('a lower contribution can pass when 100% fails the lower DTA bound',()=>{
  const c={assets:100000,debt:25000,pay:500,bills:500,yield:12,growth:0,bandFloor:25,months:12,payGrowth:0,inflation:0};
  const r=G.analyze(c);assert.equal(r.startMonth,1);assert.equal(r.taperPct,0);assert(!r.continuousPasses);assert(oraclePass(r.candidate,1));assert.equal(G.check(r.baseline,1,false).code,'belowBand');
});
test('manual zero-contribution full financing can reverse and must fail',()=>{
  const c=F.simulate({months:240,reduceStart:207,reduced:0},{redirectReduced:true});assert.equal(c.rows[206].payBills,0);assert(c.rows[210].payBills>E);assert.deepEqual(G.check(c,207,true),{code:'bills',month:211});
});
test('redirected cash cannot be recycled into future bills',()=>{
  const c={assets:10000,debt:0,pay:100,bills:50,yield:0,apr:0,growth:0,payGrowth:0,inflation:0,financeStart:0,months:2,reduceStart:1,reduced:0,stressStart:2,payCut:100,payCutMonths:1};
  const inside=F.simulate(c),outside=F.simulate(c,{redirectReduced:true});assert.equal(inside.failure,null);near(inside.rows[1].cashBills,50);assert.equal(outside.failure.month,2);near(outside.failure.shortfall,50);near(outside.rows[0].redirected,50);near(outside.rows[0].cash,0);near(outside.final.equity,10000);
  const retained=F.simulate({...c,retain:20},{redirectReduced:true});near(retained.rows[0].retained,20);near(retained.rows[0].redirected,30);near(retained.rows[0].cash,20);near(retained.failure.shortfall,30);
});
test('every redirected dollar leaves FLOW equity while requested cash stays inside',()=>{
  const c={...fixture,retain:100,reduceStart:3,reduced:20},outside=F.simulate(c,{redirectReduced:true}),inside=F.simulate(c);let old=outside.initial,cumulative=0;
  for(const row of outside.rows){
    cumulative+=row.redirected;near(row.pay,row.payBills+row.contributed+row.retained+row.redirected);near(row.bills,row.financed+row.payBills+row.cashBills);near(row.distributions,row.paid+row.principal+row.reinvested);near(row.cash,old.cash-row.cashBills+row.retained);near(row.equity-old.equity,row.pay-row.bills+row.priceGain-row.shockLoss+row.distributions-row.interest-row.redirected,1e-6);near(row.residual,0,1e-6);near(row.equity,inside.rows[row.month-1].equity-cumulative,1e-6);if(row.month>=3)near(row.retained,100);else near(row.redirected,0);old=row;
  }
  near(outside.totals.redirected,cumulative);assert.match(F.toCsv(outside),/Outside FLOW; unavailable for future bill funding/);
});
test('continuation is bit-identical to full rerun, including stress timing',()=>{
  for(const start of [1,2,7,12]){
    const c={...fixture,months:12,retain:50,stressStart:7,shock:10,payCut:20,payCutMonths:2},baseline=F.simulate(c),selected={...c,reduceStart:start,reduced:19};
    const full=F.simulate(selected,{redirectReduced:true}),suffix=F.simulate(selected,{redirectReduced:true,baseline,startMonth:start});assert.deepEqual(suffix.rows,full.rows.slice(start-1));assert.deepEqual(suffix.final,full.final);near(suffix.totals.redirected,full.rows.slice(start-1).reduce((n,row)=>n+row.redirected,0));
  }
});
test('rejection is not a funding failure and the rejecting row is reported',()=>{
  const c={...fixture,reduceStart:1,reduced:19},block={code:'test',month:3};
  const r=F.simulate(c,{redirectReduced:true,checkRow:row=>row.month===3?block:null});assert.equal(r.failure,null);assert.equal(r.rejection,block);assert.equal(r.rows.length,3);assert.equal(G.check(r,1,true),block);
});
test('every month and each independent condition are checked',()=>{
  const good=G.analyze(fixture).candidate;assert(good);const alter=(field,value,code)=>{const x=structuredClone(good);x.rows[2][field]=value;assert.deepEqual(G.check(x,1,true),{code,month:3});};
  alter('payBills',1,'bills');alter('cashBills',1,'bills');alter('dta',null,'dtaUndefined');alter('dta',.11,'belowBand');alter('dta',.27,'aboveBand');alter('preDta',.5,'draw');alter('capitalized',1,'interest');alter('coverage',1,'coverage');alter('allocationGap',1,'cash');
});
test('zero wages reject fake benefit, zero bills do not invent financing dates, zero interest is N/A',()=>{
  const zero=G.analyze({assets:100000,debt:0,pay:0,bills:0,yield:0,apr:0,growth:0,bandFloor:0,months:3});assert(!zero.eligible);assert.equal(zero.blockers[0].code,'noReduction');
  const r=G.analyze({assets:100000,debt:0,pay:100,bills:0,yield:0,apr:0,growth:0,bandFloor:0,months:3});assert(r.eligible);assert.equal(r.startMonth,1);assert.equal(r.fullRedirectionMonth,null);assert.equal(r.actualFinancing.first,null);assert.equal(r.candidate.final.coverage,null);
});
test('one-month eligibility and exports disclose exact scope and outside cash',()=>{
  const r=G.analyze({...fixture,months:1});assert.equal(r.monthsChecked,1);const narrative=G.narrative(r,true,r.candidate).join(' ');assert.match(narrative,/only modeled month/);assert.match(narrative,/Wages continue/);const csv=G.exportCsv(r.candidate,r,true);assert.match(csv,/"Calculated contribution start month","1"/);assert.match(csv,/"Calculated months checked","1"/);assert.match(csv,/"Outside cash"/);assert.match(csv,/not a continuous minimum/);
});
test('earliest feasible start may be delayed after all 100 percentages fail at earlier starts',()=>{
  const r=G.analyze({...fixture,bills:1197});assert.equal(r.startMonth,7);assert.equal(r.taperPct,95);assert.equal(r.monthsChecked,18);assert.equal(r.tested,696);assert.deepEqual(oracle({...fixture,bills:1197}),{start:7,pct:95});
});
test('a one-month case that requires 100% has no reduced grid candidate',()=>{
  const c={assets:100,debt:25,pay:10,bills:1,yield:0,apr:0,growth:0,payGrowth:0,inflation:0,bandFloor:0,bandCeiling:26/110*100,maxDta:50,months:1};
  assert.equal(G.check(F.simulate(c),1,false),null);const r=G.analyze(c);assert(!r.eligible);assert.equal(r.tested,100);assert.equal(r.blockers[0].code,'aboveBand');
});
test('late shock/funding failure rejects earlier starts without aborting their tests',()=>{
  const r=G.analyze({...fixture,stressStart:12,shock:80});assert(!r.eligible);assert.equal(r.baseline.failure.month,12);assert.equal(r.testedStarts,11);assert.equal(r.tested,1100);assert(r.blockers.some(x=>x.code==='funding'&&x.month===12));
  const empty=G.analyze({assets:0,debt:0,pay:0,bills:1000,cash:0});assert.equal(empty.status,'baseline-stopped');assert.equal(empty.blockers[0].code,'funding');
});
test('cash allocation shortfalls, no outgoing cash, zero collateral, and unpaid interest cannot qualify',()=>{
  const gap=G.analyze({...fixture,retain:1000});assert(!gap.eligible);assert.equal(gap.blockers[0].code,'cash');
  const none=G.analyze({assets:100000,debt:0,pay:100,retain:100,bills:0,yield:0,apr:0,growth:0,payGrowth:0,inflation:0,bandFloor:0,months:3});assert(!none.eligible);assert.equal(none.blockers[0].code,'noReduction');
  const zero=G.analyze({assets:0,debt:0,pay:100,bills:0,yield:0,apr:0,growth:0,bandFloor:0,months:1});assert(!zero.eligible);assert.equal(zero.blockers[0].code,'dtaUndefined');
  const interest=G.analyze({assets:100000,debt:25000,pay:100,bills:100,growth:12,yield:0,apr:12,minCoverage:0,maxDta:50,bandFloor:0,months:3});assert(!interest.eligible);assert.equal(interest.blockers[0].code,'interest');
});
test('first and sustained financing dates differ and failed runs have no sustained date',()=>{
  const r=structuredClone(F.simulate({...fixture,months:5}));assert.equal(G.financingDates(r).first,1);r.rows[2].payBills=1;r.rows[2].financed-=1;assert.deepEqual(G.financingDates(r),{first:1,sustained:4});r.failure={month:6};assert.equal(G.financingDates(r).sustained,null);
});
test('invalid inputs and mismatched continuation prefixes reject explicitly',()=>{
  for(const c of [{pay:Infinity},{months:NaN},{months:601},{bandFloor:31,bandCeiling:30},{contribution:NaN}])assert.throws(()=>G.analyze(c));
  const baseline=F.simulate(fixture);assert.throws(()=>F.simulate({...fixture,reduceStart:3,reduced:20,retain:1},{baseline,startMonth:3,redirectReduced:true}),/matching untapered prefix/);assert.throws(()=>F.simulate({...fixture,reduceStart:3,reduced:20},{baseline,startMonth:0,redirectReduced:true}),/Invalid simulation/);
});
test('optimized earliest-start result matches independent full-rerun exhaustive oracle',()=>{
  let seed=41;const rand=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
  for(let i=0;i<12;i++){
    const c={...fixture,assets:70000+rand()*120000,debt:10000+rand()*40000,pay:100+rand()*10000,bills:100+rand()*1200,bandFloor:rand()*27,bandCeiling:30,maxDta:40,months:6,financeStart:1+Math.floor(rand()*3)};
    const wanted=oracle(c),actual=G.analyze(c);assert.deepEqual(actual.eligible?{start:actual.startMonth,pct:actual.taperPct}:null,wanted);const manual=G.analyze({...c,contribution:17.123,reduceStart:3,reduced:7});assert.equal(manual.startMonth,actual.startMonth);assert.equal(manual.taperPct,actual.taperPct);
  }
});

const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),path=require('path');
const ctx={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../FlowSimV2.html'),'utf8').match(/<script id="engine">([\s\S]*?)<\/script>/)[1],ctx);const F=ctx.window.FlowSimV2;
const base={...F.defaults,...F.options,assets:10000,debt:2500,pay:1000,bills:500,apr:12,yield:12,growth:0,payGrowth:0,inflation:0,months:60};
const near=(a,b)=>assert(Math.abs(a-b)<Math.max(1e-7,Math.abs(b)*1e-10),`${a} != ${b}`);
test('target sweep independently solves ending ratio with reinvestment in denominator',()=>{
 const c={...base,debt:2150,bills:0,targetDta:20,sweep:'target',months:1},r=F.simulate(c).final;
 // A before residual cash=11000; interest=21.5; cash after interest=78.5.
 // Already below target if all 78.5 reinvested: no principal repayment.
 near(r.principalRepaid,0);near(r.redirectedReinvestment,78.5);near(r.assets,11078.5);
 const q=F.simulate({...c,debt:2250}).final;const repayment=(2250-.2*(11000+77.5))/.8;
 near(q.principalRepaid,repayment);near(q.assets,11000+77.5-repayment);near(q.debt/q.assets,.2);
 const z=F.simulate({...c,debt:5000}).final;near(z.principalRepaid,50);near(z.redirectedReinvestment,0);assert(z.dta>.2);
});
test('zero target pays all possible debt then reinvests excess; never borrows to hit target',()=>{const r=F.simulate({...base,debt:0,bills:0,sweep:'target',targetDta:0}).final;near(r.debt,0);assert(r.assets>10000);near(r.surplusBalance,0);near(r.residual,0);});
test('cash split and target reinvestment are disjoint; uncovered interest capitalizes',()=>{for(const cash of [0,30,100])for(const sweep of ['principal','target']){const r=F.simulate({...base,cash,drip:100-cash,sweep});for(const x of r.rows){near(x.distributions,x.drip+x.interestPaid+x.principalRepaid+x.redirectedReinvestment+x.generatedSurplus);near(x.interest,x.interestPaid+x.capitalizedInterest);near(x.residual,0);assert(x.principalRepaid>=0&&x.redirectedReinvestment>=0);}}});
test('maximum routes remainder from pay, never more than bills; hand-computed DTA limit',()=>{const r=F.simulate({...base,financing:'maximum',debt:2500,apr:0,yield:0,maxDta:25,minCoverage:0,months:1}).final;
 // (2500+F)/(10500+F)<=.25 => F<=166.666...; cents floor.
 near(r.financedBills,166.66);near(r.directBills,333.34);near(r.payInvested,666.66);near(r.residual,0);});
test('off-grid exact expense ceiling considered; inherited breach and missing funding stop',()=>{const r=F.simulate({...base,financing:'maximum',bills:1.234,debt:0,apr:0,months:1});near(r.final.financedBills,1.234);
 for(const c of [{debt:9000},{assets:0,debt:100},{pay:0,debt:2500,maxDta:25,yield:0}]){const z=F.simulate({...base,financing:'maximum',...c});assert(z.failure);assert.equal(z.rows.length,0);assert.equal(z.final.month,0);assert(!F.toCsv(z).includes('Infinity'));}
});
test('coverage caps financing using period interest; zero interest remains N/A',()=>{const r=F.simulate({...base,debt:2000,financing:'maximum',minCoverage:4.8,maxDta:90,months:1}).final;near(r.financedBills,83.33);assert(r.coverage>=4.8);const z=F.simulate({...base,apr:0,financing:'maximum',maxDta:90}).final;assert.equal(z.coverage,null);});
test('combined stress has explicit timing, no reserve bridge, matched identities and stopped horizon',()=>{const c={...base,stress:1};const r=F.simulate(c);assert.equal(r.rows.length,60);const x=r.rows[12];near(x.shockLoss,r.rows[11].assets*.3);near(x.distributions,(x.openingAssets-x.shockLoss)*.12/12*.7);near(x.apr,15);for(let j=12;j<18;j++)near(r.rows[j].pay,0);near(r.rows[18].pay,1000);for(const row of r.rows)near(row.residual,0);const z=F.simulate({...c,financing:'maximum'});assert(z.failure);assert(z.rows.length<60);});
test('deterministic exhaustive cent oracle across 300 synthetic cases and both sweeps',()=>{let seed=173;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/2**32;};for(let n=0;n<300;n++){const c={...base,...F.options,financing:'maximum',apr:rand()*50,maxDta:rand()*90,minCoverage:rand()*5,targetDta:rand()*95,sweep:n%2?'target':'principal',cash:rand()*100};c.drip=100-c.cash;const a=rand()*60,d=rand()*40,p=rand()*10,b=rand()*12,C=rand()*8;let oracle=null;const fits=f=>{const z=F.route(c,a,d,p,b,C,f);return z.payInvested>=-1e-8&&z.assets>0&&z.debt-c.maxDta/100*z.assets<=1e-7&&z.cashDistributions-c.minCoverage*z.interest>=-1e-7;};for(let i=Math.ceil(Math.max(0,b-p)*100);i<=Math.floor(b*100);i++)if(fits(i/100))oracle=i/100;if(fits(b))oracle=b;const got=F.capacity(c,a,d,p,b,C);if(oracle===null)assert.equal(got,null);else near(got,oracle);}});
test('large numbers and narrow feasible intervals do not require scanning or truncate search',()=>{const c={...base,...F.options,apr:0,maxDta:25,minCoverage:0,financing:'maximum'};const f=F.capacity(c,1e9,250000000,1e8,1e8,0);near(f,0);const g=F.capacity(c,10000,2499.9975,0.01,0.02,0);assert(g===null||g>=.01);});
test('invalid target/mode rejected and input is not mutated',()=>{for(const change of [{targetDta:100},{targetDta:-1},{targetDta:NaN},{financing:'bad'},{sweep:'bad'},{stress:2}])assert.throws(()=>F.simulate({...base,...change}));const c={...base,sweep:'target'},copy={...c};F.simulate(c);assert.deepEqual(c,copy);});
test('narrow funding/guardrail intersection distinguishes a single cent from no cent',()=>{const c={...base,...F.options,apr:0,maxDta:25,minCoverage:0};near(F.capacity(c,10000,2498.9915,.999,2,0),1.01);assert.equal(F.capacity(c,10000,2498.993,.999,2,0),null);});
test('independent 60-month target oracle using payment bisection and stress accounting',()=>{
 const c={...base,sweep:'target',cash:70,drip:30,stress:1,growth:2,payGrowth:3,inflation:3,apr:4.24,targetDta:20};let a=c.assets,d=c.debt,p=c.pay,b=c.bills;
 for(const row of F.simulate(c).rows){if(row.month===13)a*=.7;a*=1+c.growth/1200;p*=1+c.payGrowth/1200;b*=1+c.inflation/1200;const P=row.month>=13&&row.month<=18?0:p,Y=a*c.yield/1200*(row.month>=13?.7:1),C=Y*.7,I=(d+b)*(c.apr+(row.month>=13?3:0))/1200;d+=b+Math.max(0,I-C);a+=P+Y*.3;const cash=Math.max(0,C-I),upper=Math.min(d,cash);let lo=0,hi=upper;
  if(d-upper>.2*(a+cash-upper))lo=hi;else for(let j=0;j<70;j++){const mid=(lo+hi)/2;if(d-mid>.2*(a+cash-mid))lo=mid;else hi=mid;}
  const payment=hi;d-=payment;a+=cash-payment;near(row.assets,a);near(row.debt,d);near(row.principalRepaid,payment);near(row.netEquity,a-d);
 }
});

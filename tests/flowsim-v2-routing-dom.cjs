const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const html=fs.readFileSync(path.join(__dirname,'../FlowSimV2.html'),'utf8');
const makeDom=()=>new JSDOM(html,{runScripts:'dangerously',url:'http://localhost/FlowSimV2.html'});
const dom=makeDom(),w=dom.window,d=w.document,q=s=>d.querySelector(s);let last,calls=[];
const originalSimulate=w.FlowSimV2.simulate;w.FlowSimV2.simulate=c=>{calls.push(c.sweep);return last=originalSimulate(c);};
const set=(n,v)=>{const e=q(`[name=${n}]`);e.value=String(v);e.dispatchEvent(new w.Event('input',{bubbles:true}));e.dispatchEvent(new w.Event('change',{bubbles:true}));};
try{
 assert(!q('#comparison'));assert(!q('#comparisonSummary'));assert(!q('[name=sweep]'));assert(!d.body.textContent.includes('Compare distribution cash choices'));assert(!d.body.textContent.includes('Annual rates use monthly compounding. Percentages display'));
 assert(!q('#targetLabel').hidden);assert.equal(q('#ledgerBody').rows.length,60);assert(q('#activePath').textContent.startsWith('Target 20%, then reinvest'));
 set('financing','maximum');assert.equal(q('#error').textContent,'');assert.equal(last.inputs.sweep,'target');assert.deepEqual(calls,['target']);assert(!q('#verdictText').textContent.includes('Warning-only'));assert(q('#routingHelp').textContent.includes('Unfinanced bills'));
 const expected=originalSimulate({...w.FlowSimV2.defaults,financing:'maximum',sweep:'target',targetDta:20,stress:0});assert.equal(last.final.netEquity,expected.final.netEquity);assert.equal(w.FlowSimV2.toCsv(last),w.FlowSimV2.toCsv(expected));
 const headers=[...q('#ledgerHead').querySelectorAll('th')].map(e=>e.textContent);for(const label of ['Bills financed','Bills paid from pay','Pay invested','Cash reinvested after target','Financing constraint'])assert(headers.includes(label));
 set('targetDta',10);assert.equal(last.inputs.targetDta,10);assert.equal(last.final.netEquity,originalSimulate({...expected.inputs,targetDta:10}).final.netEquity);assert(q('#activePath').textContent.startsWith('Target 10%, then reinvest'));
 set('stress',1);assert(q('#activePath').textContent.includes('Combined stress'));assert(q('#assumptionSummary').textContent.includes('combined shock enabled'));assert.equal(q('#verdictBadge').textContent,'STOP');const count=q('#ledgerBody').rows.length;assert.equal(Number(q('#inspect').max),count);for(const line of q('#chart').querySelectorAll('polyline'))assert.equal(line.getAttribute('points').split(' ').length,count+1);
 set('assets',0);set('debt',10000);set('pay',0);assert.equal(q('#verdictBadge').textContent,'STOP');assert.equal(q('#ledgerBody').rows.length,0);assert.equal(q('#chart').children.length,0);assert(!q('#csv').disabled);assert.equal(last.inputs.sweep,'target');
 set('financing','fixed');assert.equal(q('#ledgerBody').rows.length,60);assert.equal(q('#verdictBadge').textContent,'FAIL');assert(q('#verdictText').textContent.includes('Warning-only'));
 set('targetDta',100);assert(q('#error').textContent);assert.equal(q('#ledgerBody').rows.length,0);assert.equal(q('#chart').children.length,0);assert(q('#csv').disabled);
 for(let i=0;i<2;i++){q('#reset').click();assert.equal(q('[name=financing]').value,'maximum');assert.equal(last.inputs.sweep,'target');assert.equal(q('[name=targetDta]').value,'20');assert.equal(q('[name=stress]').value,'0');assert.equal(q('#ledgerBody').rows.length,60);assert.equal(q('#error').textContent,'');assert.equal(last.final.netEquity,expected.final.netEquity);}
 // Legacy programmatic defaults cannot leak into the UI, even after reset or a fresh load.
 assert.equal(w.FlowSimV2.options.sweep,'principal');set('bills',3400);assert.equal(last.inputs.sweep,'target');assert(calls.every(sweep=>sweep==='target'));
 const fresh=makeDom();try{assert(!fresh.window.document.querySelector('[name=sweep]'));assert(fresh.window.document.querySelector('#activePath').textContent.startsWith('Target 20%, then reinvest'));assert.equal(fresh.window.document.querySelector('#ledgerBody').rows.length,60);}finally{fresh.window.close();}
 console.log('V2 routing DOM PASS: target-only UI, removed comparison/hint, unchanged target results/CSV, mode, stress, early/no-row failure, ledger/chart, invalid clearing, repeated reset and fresh load.');
}finally{w.close();}

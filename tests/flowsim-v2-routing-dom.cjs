const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const dom=new JSDOM(fs.readFileSync(path.join(__dirname,'../FlowSimV2.html'),'utf8'),{runScripts:'dangerously',url:'http://localhost/FlowSimV2.html'}),w=dom.window,d=w.document,q=s=>d.querySelector(s);
const set=(n,v)=>{const e=q(`[name=${n}]`);e.value=String(v);e.dispatchEvent(new w.Event('input',{bubbles:true}));e.dispatchEvent(new w.Event('change',{bubbles:true}));};
try{
 assert(q('#comparison').textContent.includes('60 / 60'));assert(!q('#targetLabel').hidden);
 set('financing','maximum');set('sweep','target');assert.equal(q('#error').textContent,'');assert(!q('#verdictText').textContent.includes('Warning-only'));assert(q('#routingHelp').textContent.includes('Unfinanced bills'));
 const headers=[...q('#ledgerHead').querySelectorAll('th')].map(e=>e.textContent);for(const label of ['Bills financed','Bills paid from pay','Pay invested','Cash reinvested after target','Financing constraint'])assert(headers.includes(label));
 const old=q('#comparison').textContent;set('targetDta',10);assert.notEqual(q('#comparison').textContent,old);
 set('stress',1);assert(q('#comparison').textContent.includes('stopped before'));assert(q('#verdictBadge').textContent==='STOP');const count=q('#ledgerBody').rows.length;assert.equal(Number(q('#inspect').max),count);for(const line of q('#chart').querySelectorAll('polyline'))assert.equal(line.getAttribute('points').split(' ').length,count+1);
 set('assets',0);set('debt',10000);set('pay',0);assert.equal(q('#verdictBadge').textContent,'STOP');assert.equal(q('#ledgerBody').rows.length,0);assert.equal(q('#chart').children.length,0);assert(q('#comparison').textContent.includes('0 / 60'));assert(!q('#csv').disabled);
 set('financing','fixed');assert.equal(q('#ledgerBody').rows.length,60);assert.equal(q('#verdictBadge').textContent,'FAIL');assert(q('#verdictText').textContent.includes('Warning-only'));
 set('targetDta',100);assert(q('#error').textContent);assert.equal(q('#comparison').children.length,0);assert(q('#csv').disabled);
 q('#reset').click();assert.equal(q('[name=financing]').value,'fixed');assert.equal(q('[name=sweep]').value,'principal');assert.equal(q('[name=stress]').value,'0');assert.equal(q('#ledgerBody').rows.length,60);assert.equal(q('#error').textContent,'');
 console.log('V2 routing DOM PASS: A/B comparison, target, mode, stress, early/no-row failure, ledger, chart, invalid clearing and reset.');
}finally{w.close();}

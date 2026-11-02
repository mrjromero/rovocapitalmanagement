'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const root=path.join(__dirname,'..'),dom=new JSDOM(fs.readFileSync(path.join(root,'flowsim.html'),'utf8'),{runScripts:'outside-only'}),w=dom.window,d=w.document,q=s=>d.querySelector(s);
w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
const blobs=[];w.URL.createObjectURL=b=>{blobs.push(b);return 'blob:test';};w.URL.revokeObjectURL=()=>{};w.HTMLAnchorElement.prototype.click=()=>{};
for(const file of ['engine','timeline','explanations'])w.eval(fs.readFileSync(path.join(root,'assets/flowsim',file+'.js'),'utf8'));
let recorded;const compare=w.FlowSim.compare;w.FlowSim.compare=c=>(recorded=compare(c));w.eval(fs.readFileSync(path.join(root,'assets/flowsim/app.js'),'utf8'));
const set=(name,value)=>{const el=q(`[name=${name}]`);el.value=value;el.dispatchEvent(new w.Event('input',{bubbles:true}));el.dispatchEvent(new w.Event('change',{bubbles:true}));};
const run=()=>{q('#scenario').dispatchEvent(new w.Event('submit',{cancelable:true}));assert.equal(q('#error').textContent,'');};
const read=b=>new Promise(resolve=>{const r=new w.FileReader();r.onload=()=>resolve(r.result);r.readAsText(b);});
const parse=line=>Array.from(line.matchAll(/"((?:[^"]|"")*)"(?:,|$)/g),m=>m[1].replaceAll('""','"'));
(async()=>{
 assert.equal(q('[name=adaptiveGrid]'),null);assert(q('#adaptiveModeControls').hidden);assert(!q('#assumptions').open);assert.equal(q('[name=routingMode]').value,'fixed');
 for(const [n,v]of Object.entries({routingMode:'adaptive',assets:10000,debt:1000,income:4000,bills:2000,routing:100,months:12,apr:12,yield:12,growth:0,payGrowth:0,inflation:0,adaptiveHaircut:0,adaptivePayout:0,adaptiveRate:0,targetDta:15}))set(n,v);
 for(const mode of ['gradual','maximum','target']){
 set('adaptiveMode',mode);assert.equal(q('#targetControls').hidden,mode!=='target');assert.equal(q('#gradualControls').hidden,mode!=='gradual');assert(!q('#adaptiveSettings').open);run();assert.equal(recorded.inputs.adaptive_policy.mode,mode);
 const expected=recorded.flow.monthly[0].routed_expenses;assert.equal(expected,{gradual:100,maximum:1475,target:485}[mode]);
 assert(q('#adaptiveActiveAssumptions').textContent.includes({gradual:'Gradual increase',maximum:'Maximum within guardrails',target:'Target DTA'}[mode]));
 q('#columnMode').value='full';q('#columnMode').dispatchEvent(new w.Event('change'));
 const headers=Array.from(q('#ledgerHead tr').cells,c=>c.textContent),first=Array.from(q('#ledgerBody tr').cells,c=>c.textContent);
 assert.equal(Number(first[headers.indexOf('Bills financed')].replace(/[$,]/g,'')),expected);assert.equal(first[headers.indexOf('Admission passed')],'Yes');assert.equal(q('#ledgerBody').rows.length,12);
 q('#chartMonth').value=12;q('#chartMonth').dispatchEvent(new w.Event('input'));const end=Number(recorded.flow.final.net_equity.toFixed(2)).toLocaleString('en-US');assert(q('#chartReadout').textContent.includes(end));assert.equal(q('#chart').querySelectorAll('polyline').length,4);
 q('#viewTimeline').click();assert(q('#timelineDetail').textContent.includes('Routing:'));q('#timelineClose').click();
 q('#export').click();const lines=(await read(blobs.at(-1))).replace(/^\ufeff/,'').split('\r\n').map(parse),canonical=JSON.parse(lines.find(r=>r[0]==='Canonical configuration JSON')[1]);assert.equal(canonical.adaptive_policy.mode,mode);assert(!('grid_dollars' in canonical.adaptive_policy));assert(q('#adaptiveActiveAssumptions').textContent.includes('Automatic precision'));
 const h=lines.find(r=>r[0]==='Strategy'),rows=lines.filter(r=>r[0]==='flow');assert.equal(rows.length,12);assert.equal(Number(rows[0][h.indexOf('routed_expenses')]),expected);assert.equal(rows[0][h.indexOf('admission_passed')],'true');assert(h.includes('target_dta_pct'));assert(h.includes('target_peak_dta_pct'));assert.equal(Number(rows.at(-1)[h.indexOf('net_equity')]),Number(recorded.flow.final.net_equity.toFixed(2)));assert(lines.some(r=>r[0]==='fixed'));assert(lines.some(r=>r[0]==='pay_cash'));
 }
 set('debt',2200);set('adaptiveHaircut',20);run();assert(q('#resultStatus').textContent.includes('adaptive admission did not pass'));assert(q('#ledgerBody tr').classList.contains('breach'));assert(q('#scenarioExplanation').textContent.includes('Admission')||q('#scenarioExplanation').textContent.includes('admission'));
 q('#viewTimeline').click();assert(q('#timelineDetail').textContent.includes('Admission did not pass'));q('#timelineClose').click();
 set('targetDta',26);q('#scenario').dispatchEvent(new w.Event('submit',{cancelable:true}));assert(q('#error').textContent.includes('Target DTA'));assert(q('#export').disabled);
 set('adaptiveMode','maximum');run();assert.equal(q('[name=targetDta]').disabled,true); // dormant target cannot invalidate maximum
 set('routingMode','fixed');run();assert.equal(q('[name=adaptiveGrid]'),null);assert(q('#adaptiveModeControls').hidden);assert(!q('#adaptiveSettings').open);assert.equal(recorded.inputs.adaptive_policy,undefined);
 q('#reset').click();assert.equal(q('#equity').textContent,'$77,563');assert.equal(q('[name=adaptiveMode]').value,'gradual');assert.equal(q('[name=reserve]'),null);
 console.log('Routing modes DOM passed: controls, all modes, ledger/chart/timeline/CSV parity, inherited admission warning, invalid target, fixed regression and reset.');w.close();
})().catch(e=>{console.error(e);process.exitCode=1;w.close();});

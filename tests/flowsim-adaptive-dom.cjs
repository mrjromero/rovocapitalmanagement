const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const root=path.join(__dirname,'..'),dom=new JSDOM(fs.readFileSync(path.join(root,'flowsim.html'),'utf8'),{runScripts:'outside-only'}),w=dom.window,d=w.document,q=s=>d.querySelector(s);
w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
let blobs=[];w.URL.createObjectURL=b=>{blobs.push(b);return 'blob:test';};w.URL.revokeObjectURL=()=>{};w.HTMLAnchorElement.prototype.click=()=>{};
for(const file of ['engine','timeline','explanations','app'])w.eval(fs.readFileSync(path.join(root,'assets/flowsim',file+'.js'),'utf8'));
const run=()=>q('#scenario').dispatchEvent(new w.Event('submit',{cancelable:true})),set=(n,v)=>{q(`[name=${n}]`).value=v;},read=b=>new Promise(resolve=>{const r=new w.FileReader();r.onload=()=>resolve(r.result);r.readAsText(b);});
(async()=>{
 assert.equal(q('[name=routingMode]').value,'fixed');assert(q('#adaptiveComparison').hidden);
 for(const [n,v]of Object.entries({routingMode:'adaptive',assets:100000,debt:10000,reserve:50000,income:6000,bills:3000,routing:1500,months:60}))set(n,v);run();assert.equal(q('#error').textContent,'');assert(!q('#adaptiveComparison').hidden);assert(!q('#adaptiveSettings').open);assert(q('#adaptiveActiveAssumptions').textContent.includes('20.00%'));assert(q('#timelineGrid')!==null);assert(q('#ledgerHead').textContent.includes('Bills financed share'));assert(q('#ledgerHead').textContent.includes('Household cash allocated to investment'));assert.equal(q('#ledgerBody').rows.length,60);
 const row=q('#ledgerBody tr').textContent;q('#viewTimeline').click();assert(q('#timelineGrid').textContent.includes('Share of bills financed'));assert(q('#timelineDetail').textContent.includes('Routing:'));assert(q('#timelineDetail').textContent.includes('does not reduce'));
 q('#timelineMode').value='fixed';q('#timelineMode').dispatchEvent(new w.Event('change'));assert(q('#timelineDetail').textContent.includes('Original fixed share'));assert(q('#timelineDetail').textContent.includes('Routing: fixed'));
 q('#export').click();const csv=await read(blobs.at(-1));assert(csv.includes('adaptive_policy'));assert(csv.includes('peak_financing_dta'));assert(csv.includes('screen_reserve_required'));assert(csv.includes('"fixed","60"'));assert(csv.includes('"pay_cash","60"'));assert.equal(q('#ledgerBody tr').textContent,row);
 set('reserve','');run();assert(q('#ledgerBody').textContent.includes('Cash reserves are unknown'));
 set('routingMode','fixed');run();assert(q('#adaptiveComparison').hidden);assert(!q('#ledgerMode option[value=fixed]'));assert(!q('#ledgerHead').textContent.includes('screen'));assert.equal(q('#error').textContent,'');
 for(const [n,v]of Object.entries({assets:10000,debt:2000,reserve:0,income:1000000,bills:5000,routing:500,months:1,apr:12,interest:'cash'}))set(n,v);run();assert.equal(q('#maxDta').textContent,'25.00%');assert(!q('#adaptiveSettings').open);
 console.log('Adaptive UI QA passed: fixed default, 60-month adaptive ledger, timeline shares/reasons/three strategies, audit CSV and unknown-reserve blocking.');w.close();
})().catch(e=>{console.error(e);process.exitCode=1;w.close();});

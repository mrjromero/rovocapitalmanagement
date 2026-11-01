const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const root=path.join(__dirname,'..'),dom=new JSDOM(fs.readFileSync(path.join(root,'flowsim.html'),'utf8'),{runScripts:'outside-only'}),w=dom.window,d=w.document,q=s=>d.querySelector(s);
w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
let blobs=[];w.URL.createObjectURL=b=>{blobs.push(b);return 'blob:test';};w.URL.revokeObjectURL=()=>{};w.HTMLAnchorElement.prototype.click=()=>{};
for(const file of ['engine','timeline','explanations','app'])w.eval(fs.readFileSync(path.join(root,'assets/flowsim',file+'.js'),'utf8'));
const run=()=>q('#scenario').dispatchEvent(new w.Event('submit',{cancelable:true})),set=(n,v)=>{q(`[name=${n}]`).value=v;},read=b=>new Promise(resolve=>{const r=new w.FileReader();r.onload=()=>resolve(r.result);r.readAsText(b);});
const inspect=m=>{q('#timelineMonth').value=m;q('#timelineMonth').dispatchEvent(new w.Event('input'));};
(async()=>{
 for(const months of [36,60]){
  q('#timelineMode').value='flow';set('months',months);run();const ledger=q('#ledgerBody').textContent,equity=q('#equity').textContent;q('#export').click();const before=await read(blobs.at(-1));
  q('#viewTimeline').click();assert(q('#timelineDialog').open);assert.equal(d.querySelectorAll('#timelineGrid thead button').length,months);
  inspect(months);assert(q('#timelineDetail').textContent.includes(`Month ${months}`));assert(q('#timelineDetail').textContent.includes(equity));assert(q('#timelineNext').disabled);
  q('#timelineGrid thead button:last-child').dispatchEvent(new w.KeyboardEvent('keydown',{key:'Home',bubbles:true}));assert.equal(q('#timelineMonth').value,'1');
  q('#timelineGrid thead button').dispatchEvent(new w.KeyboardEvent('keydown',{key:'PageDown',bubbles:true}));assert.equal(q('#timelineMonth').value,'13');
  const cell=q('#timelineGrid tbody button[data-month="2"]');const touch=new w.Event('pointermove',{bubbles:true});Object.defineProperty(touch,'pointerType',{value:'touch'});cell.dispatchEvent(touch);assert.equal(q('#timelineMonth').value,'13');cell.click();assert.equal(q('#timelineMonth').value,'2');
  q('#timelineMode').value='pay_cash';q('#timelineMode').dispatchEvent(new w.Event('change'));inspect(1);assert(q('#timelineDetail').textContent.includes('Pay-cash benchmark'));assert(q('#timelineReserve').textContent.includes('unknown'));
  q('#timelineClose').click();assert.equal(d.activeElement.id,'viewTimeline');q('#export').click();assert.equal(await read(blobs.at(-1)),before);assert.equal(q('#ledgerBody').textContent,ledger);assert.equal(q('#equity').textContent,equity);
 }
 q('#timelineMode').value='flow';set('income',0);run();q('#viewTimeline').click();inspect(1);assert(q('#timelineDetail').textContent.includes('Funding failed'));inspect(60);assert(q('#timelineDetail').textContent.includes('Stopped'));assert.equal(d.querySelectorAll('#timelineGrid tbody button[data-month="60"]').length,0);
 set('income',5000);set('apr',0);run();inspect(1);assert(q('#timelineDetail').textContent.includes('Ratio undefined'));
 set('reserve',11000);run();assert(q('#timelineReserve').textContent.includes('nonyielding'));assert(q('#timelineDetail').textContent.includes('$11,000.00'));
 set('routing',4000);run();assert(q('#viewTimeline').disabled);assert.equal(q('#timelineGrid').childElementCount,0);assert(q('#timelineDetail').textContent.includes('valid scenario'));
 console.log('Timeline QA passed: 36/60 months, keyboard, touch-click mapping, modes, failures/stopped/empty states, unknown and known reserves, undefined ratios, unchanged ledger/equity and byte-identical CSV.');w.close();
})().catch(e=>{console.error(e);process.exitCode=1;w.close();});

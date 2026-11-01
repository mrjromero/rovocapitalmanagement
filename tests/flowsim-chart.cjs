const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const root=path.join(__dirname,'..'),dom=new JSDOM(fs.readFileSync(path.join(root,'flowsim.html'),'utf8'),{runScripts:'outside-only'}),w=dom.window,d=w.document;
const q=s=>d.querySelector(s);let blobs=[];
w.URL.createObjectURL=b=>{blobs.push(b);return 'blob:test';};w.URL.revokeObjectURL=()=>{};w.HTMLAnchorElement.prototype.click=()=>{};
for(const file of ['engine','explanations','app'])w.eval(fs.readFileSync(path.join(root,'assets/flowsim',file+'.js'),'utf8'));
const run=()=>q('#scenario').dispatchEvent(new w.Event('submit',{cancelable:true}));
const inspect=n=>{q('#chartMonth').value=n;q('#chartMonth').dispatchEvent(new w.Event('input'));};
const read=b=>new Promise(resolve=>{const r=new w.FileReader();r.onload=()=>resolve(r.result);r.readAsText(b);});
(async()=>{
 for(const months of [36,60]){
  q('[name=months]').value=months;run();const ledger=q('#ledgerBody').textContent,equity=q('#equity').textContent;
  q('#export').click();const before=await read(blobs.at(-1));inspect(months);
  assert(q('#chartReadout').textContent.startsWith('Month '+months));assert(q('#chartReadout').textContent.includes(equity));
  assert.equal(q('#chart svg text:last-of-type').getAttribute('text-anchor'),'end');
  const plot=q('#chart svg');plot.getBoundingClientRect=()=>({left:0,width:900});
  const pointer=new w.Event('pointermove');Object.defineProperties(pointer,{clientX:{value:876},pointerType:{value:'mouse'}});plot.dispatchEvent(pointer);assert.equal(q('#chartMonth').value,String(months));
  const touch=new w.Event('pointerdown');Object.defineProperties(touch,{clientX:{value:65},pointerType:{value:'touch'}});plot.dispatchEvent(touch);assert.equal(q('#chartMonth').value,'0');
  for(const button of d.querySelectorAll('.legend button'))button.click();
  assert.equal(d.querySelectorAll('#chart polyline').length,0);assert(q('#chartReadout').textContent.includes('All lines hidden'));
  q('.legend .debt').click();assert.equal(d.querySelectorAll('#chart polyline').length,1);assert(!q('#chartReadout').textContent.includes('FLOW investments'));
  inspect(months);w.dispatchEvent(new w.Event('resize'));assert.equal(q('#chartMonth').value,String(months));assert.equal(q('.legend .flow').getAttribute('aria-pressed'),'false');
  assert.equal(q('#ledgerBody').textContent,ledger);assert.equal(q('#equity').textContent,equity);q('#export').click();assert.equal(await read(blobs.at(-1)),before);
  for(const button of d.querySelectorAll('.legend [aria-pressed=false]'))button.click();
 }
 q('[name=income]').value=0;run();inspect(60);assert(q('#chartReadout').textContent.includes('N/A — path stopped'));
 q('#reset').click();assert.equal(q('#chartMonth').max,'36');assert.equal(q('#error').textContent,'');
 console.log('Chart QA passed: 36/60 months, endpoint inspection, mouse/touch mapping, toggles/all hidden, resize state, stopped paths, unchanged ledger and byte-identical CSV.');dom.window.close();
})().catch(e=>{console.error(e);dom.window.close();process.exitCode=1;});

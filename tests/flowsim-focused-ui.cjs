'use strict';
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const root=path.join(__dirname,'..'),dom=new JSDOM(fs.readFileSync(path.join(root,'flowsim.html'),'utf8'),{runScripts:'outside-only'}),w=dom.window,d=w.document,q=s=>d.querySelector(s);
const css=d.createElement('style');css.textContent=fs.readFileSync(path.join(root,'assets/flowsim/style.css'),'utf8');d.head.append(css);
w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};let blob;
w.URL.createObjectURL=b=>(blob=b,'blob:test');w.URL.revokeObjectURL=()=>{};w.HTMLAnchorElement.prototype.click=()=>{};
for(const f of ['engine','explanations','timeline','app'])w.eval(fs.readFileSync(path.join(root,'assets/flowsim',f+'.js'),'utf8'));
const set=(n,v)=>{q(`[name=${n}]`).value=v;q(`[name=${n}]`).dispatchEvent(new w.Event('input',{bubbles:true}));q(`[name=${n}]`).dispatchEvent(new w.Event('change',{bubbles:true}));},run=()=>{q('#scenario').dispatchEvent(new w.Event('submit',{cancelable:true}));assert.equal(q('#error').textContent,'');};
(async()=>{
 assert.equal(q('[name=reserve]'),null);assert(!/B2|Safety Buffer/.test(d.body.textContent));assert.equal(q('#scenario').querySelectorAll('details').length,1);assert(!q('#assumptions').open);
 for(const n of ['growth','payGrowth','inflation','interest','stress','adaptiveHaircut','adaptivePayout','adaptiveRate'])assert.equal(q(`[name=${n}]`).closest('details').id,'assumptions');
 for(const n of ['assets','debt','yield','apr','income','bills'])assert.equal(q(`[name=${n}]`).closest('details'),null);
 set('growth',4);set('inflation',5);set('interest','cash');assert.match(q('#activeAssumptions').textContent,/4% price growth.*5% bill inflation.*paid from current household funds/);run();assert(!q('#assumptions').open);
 set('routingMode','adaptive');for(const mode of ['gradual','maximum','target']){set('adaptiveMode',mode);run();assert.equal(q('#initialRoutingControl').hidden,mode!=='gradual');assert.equal(w.getComputedStyle(q('#initialRoutingControl')).display==='none',mode!=='gradual');assert.equal(q('#gradualControls').hidden,mode!=='gradual');assert.equal(q('#targetControls').hidden,mode!=='target');assert(q('#bindingConstraint').textContent.startsWith('Month 1 constraint:'));}
 q('#viewTimeline').click();assert(!/B2|Safety Buffer/.test(q('#timelineDialog').textContent));q('#timelineClose').click();
 q('#export').click();const csv=await new Promise(resolve=>{const r=new w.FileReader();r.onload=()=>resolve(r.result);r.readAsText(blob);});assert(!/B2|Safety Buffer|initial_cash|opening_cash|reserve_floor|reserve_status|ending_cash/.test(csv));assert(csv.includes('funding_shortfall'));assert(csv.includes('5: FLOW-only'));
 set('income',0);set('yield',0);run();assert.match(q('#resultStatus').textContent,/stopped in month 1/);assert.equal(q('#advantage').textContent,'Not comparable');
 set('routingMode','fixed');run();assert(q('#initialRoutingControl').hidden===false);assert(q('#adaptiveSettings').hidden);q('#reset').click();assert(!q('#assumptions').open);assert.equal(q('[name=reserve]'),null);
 console.log('Focused UI PASS: grouped inputs, one collapsed assumptions section and live summary, relevant controls, no buffer in UI/timeline/CSV, explicit funding failure, reset.');w.close();
})().catch(e=>{console.error(e);w.close();process.exitCode=1;});

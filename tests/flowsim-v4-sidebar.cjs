const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const dom=new JSDOM(fs.readFileSync(path.join(__dirname,'../FlowSimV4.html'),'utf8'),{runScripts:'dangerously'}),w=dom.window,d=w.document,$=id=>d.getElementById(id);
const set=(k,v)=>{$(k).value=v;$(k).dispatchEvent(new w.Event('input',{bubbles:true}));};
try{
 const toggle=$('scenarioToggle'),panel=$('scenarioPanel');assert.equal(toggle.type,'button');assert.equal(toggle.getAttribute('aria-controls'),panel.id);assert.equal(toggle.getAttribute('aria-expanded'),'true');assert(!panel.hidden);
 set('assets',123456.78);set('contribution',33.333333);$('contribution').dispatchEvent(new w.FocusEvent('focusout',{bubbles:true}));set('inspect',37);$('warningsOnly').click();
 const inputs=[...d.querySelectorAll('#parameters input,#parameters select')].map(e=>[e.id,e.value]);
 const metrics=$('metrics').innerHTML,ledger=$('ledgerBody'),ledgerHTML=ledger.innerHTML,selection=$('chartSelection').innerHTML,detail=$('monthDetail').innerHTML;
 $('scenarioAside').scrollTop=140;
 for(let n=0;n<5;n++){
  toggle.click();assert(panel.hidden);assert($('layout').classList.contains('scenario-collapsed'));assert.equal(toggle.getAttribute('aria-expanded'),'false');assert.equal(toggle.getAttribute('aria-label'),'Show scenario inputs');assert.equal(d.activeElement,toggle);assert($('chartTooltip').hidden);
  assert.equal($('metrics').innerHTML,metrics);assert.equal($('ledgerBody'),ledger);assert.equal(ledger.innerHTML,ledgerHTML);assert.equal($('inspect').value,'37');assert.equal($('chartSelection').innerHTML,selection);assert.equal($('monthDetail').innerHTML,detail);assert.equal($('warningsOnly').getAttribute('aria-pressed'),'true');
  toggle.click();assert(!panel.hidden);assert.equal(toggle.getAttribute('aria-expanded'),'true');assert.equal($('scenarioAside').scrollTop,140);assert.equal(d.activeElement,toggle);assert.deepEqual([...d.querySelectorAll('#parameters input,#parameters select')].map(e=>[e.id,e.value]),inputs);
 }
 $('contribution').dispatchEvent(new w.FocusEvent('focusin',{bubbles:true}));assert.equal($('contribution').value,'33.333333');
 toggle.click();w.matchMedia=()=>({matches:true});w.dispatchEvent(new w.Event('resize'));assert.equal(toggle.textContent,'→ Show inputs');w.matchMedia=()=>({matches:false});w.dispatchEvent(new w.Event('resize'));assert.equal(toggle.textContent,'→\nInputs');
 toggle.click();set('months',1.5);const error=$('error').textContent;toggle.click();toggle.click();assert.equal($('error').textContent,error);assert.equal($('months').value,'1.5');
 $('reset').click();assert.equal($('ledgerBody').rows.length,120);assert(!panel.hidden);assert.equal(toggle.getAttribute('aria-expanded'),'true');
 console.log('V4 sidebar PASS: repeated collapse/reopen, accessible control, focus, values/full precision, selections/filter/results, scroll restoration, resize tooltip cleanup and invalid/reset states.');
}finally{w.close();}

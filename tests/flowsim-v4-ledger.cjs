const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');

(async()=>{
 for(const filename of ['FlowSimV4.html','flow-stages.html']){
 const source=fs.readFileSync(path.join(__dirname,'..',filename),'utf8');
 const dom=new JSDOM(source,{runScripts:'dangerously'}),w=dom.window,d=w.document,$=id=>d.getElementById(id),F=w.FlowSimV4;
 const set=(key,value)=>{$(key).value=value;$(key).dispatchEvent(new w.Event('input',{bubbles:true}));};
 const input=key=>$('ledger-column-'+key),columns=()=>Array.from($('ledgerHead').querySelectorAll('th'),th=>th.dataset.column);
 let blob;w.URL.createObjectURL=value=>(blob=value,'blob:test');w.URL.revokeObjectURL=()=>{};w.HTMLAnchorElement.prototype.click=()=>{};w.print=()=>{};
 const csv=async()=>{$('csv').click();return new Promise(resolve=>{const reader=new w.FileReader();reader.onload=()=>resolve(reader.result.replace(/"Generated","[^"\r\n]*"/,'"Generated","TIME"'));reader.readAsText(blob);});};
 function aligned(keys){assert.deepEqual(columns(),keys);for(const row of $('ledgerBody').rows){assert.equal(row.cells.length,keys.length);assert.deepEqual(Array.from(row.cells,td=>td.dataset.column),keys);}}
 try{
  const keys=Array.from(F.columns,c=>c[0]),engineColumns=JSON.stringify(F.columns),engineResult=JSON.stringify(F.simulate()),fullCsv=await csv();
  $('pdf').click();const printData=Array.from($('printReport').querySelectorAll('.print-section'),el=>el.innerHTML);
  assert($('columnPicker').hidden);assert.equal($('columnsToggle').getAttribute('aria-expanded'),'false');
  assert.equal($('columnsToggle').getAttribute('aria-controls'),'columnPicker');
  assert.equal($('columnOptions').querySelectorAll('input[type=checkbox]').length,keys.length);
  for(const key of keys){assert.equal(input(key).labels.length,1);assert(input(key).checked);}
  assert(input('month').disabled);aligned(keys);
  $('columnsToggle').click();assert(!$('columnPicker').hidden);assert.equal($('columnsToggle').getAttribute('aria-expanded'),'true');
  input('cash').focus();input('cash').click();assert.equal(d.activeElement,input('cash'));aligned(keys.filter(k=>k!=='cash'));
  assert.equal($('columnCount').textContent,'28 / 29');assert.match($('columnStatus').textContent,/28 of 29/);
  input('cash').click();aligned(keys);
  // Every optional column can be independently hidden, and values stay attached to the right heading.
  for(const key of keys.filter(k=>k!=='month')){input(key).click();assert(!columns().includes(key));input(key).click();aligned(keys);}
  $('columnsNone').click();aligned(['month']);assert.equal($('ledgerBody').rows[0].cells[0].textContent,'1');
  input('financed').click();input('payBills').click();aligned(['month','financed','payBills']);
  assert.equal($('ledgerBody').rows[0].cells[1].textContent,'$2,512.50');assert.equal($('ledgerBody').rows[0].cells[2].textContent,'$987.50');
  $('warningsOnly').click();aligned(['month','financed','payBills']);assert.equal(await csv(),fullCsv,'CSV must be independent of the view and warning filter');
  $('pdf').click();assert.deepEqual(Array.from($('printReport').querySelectorAll('.print-section'),el=>el.innerHTML),printData,'Print must retain all months and all fields');
  assert.equal(JSON.stringify(F.columns),engineColumns);assert.equal(JSON.stringify(F.simulate()),engineResult);
  set('months',1);aligned(['month','financed','payBills']);
  set('months',1.5);assert(!$('error').hidden);assert.equal($('ledgerBody').rows.length,0);input('assets').click();
  $('reset').click();aligned(['month','financed','payBills','assets']);assert.equal($('ledgerBody').rows.length,120);
  input('assets').focus();input('assets').dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));assert($('columnPicker').hidden);assert.equal(d.activeElement,$('columnsToggle'));
  for(let n=0;n<3;n++){$('columnsToggle').click();assert(!$('columnPicker').hidden);$('columnsDone').click();assert($('columnPicker').hidden);assert.equal(d.activeElement,$('columnsToggle'));}
  $('columnsToggle').click();$('columnsAll').click();aligned(keys);assert.equal($('columnCount').textContent,'29 / 29');
  // No matching warning rows still retain the selected headings.
  set('assets',1000000);$('warningsOnly').click();assert.equal($('ledgerBody').rows.length,0);assert(!$('empty').hidden);input('pay').click();assert(!columns().includes('pay'));
  $('reset').click();set('assets',0);set('cash',0);set('pay',0);assert.equal($('ledgerBody').rows.length,0);$('columnsNone').click();aligned(['month']);
  console.log(filename+' ledger PASS: 29 labeled controls, stable row alignment, bulk/individual choices, repeated dismissal and focus, view preferences across rerenders/reset, empty/invalid states, and complete unchanged CSV/print/engine data.');
 }finally{w.close();}
 const fresh=new JSDOM(source,{runScripts:'dangerously'});try{assert.equal(fresh.window.document.querySelectorAll('#ledgerHead th').length,29);}finally{fresh.window.close();}
 }
})().catch(error=>{console.error(error);process.exitCode=1;});

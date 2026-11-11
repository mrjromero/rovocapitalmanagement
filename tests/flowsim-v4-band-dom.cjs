const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const dom=new JSDOM(fs.readFileSync(path.join(__dirname,'../FlowSimV4.html'),'utf8'),{runScripts:'dangerously'}),w=dom.window,d=w.document,$=id=>d.getElementById(id),set=(k,v)=>{$(k).value=v;$(k).dispatchEvent(new w.Event('input',{bubbles:true}));};
try{
 for(const [id,v]of [['bandFloor','23.00'],['bandCeiling','26.00'],['bandSplit','50.00']]){assert.equal($(id).value,v);assert(d.querySelector(`label[for="${id}"]`));}
 assert.equal($('target'),null);assert.equal($('maxDta').value,'25.00');assert.equal($('ledgerBody').rows.length,120);
 assert.match($('journeyCopy').textContent,/23%–26% debt band/);assert.match($('journeyCopy').textContent,/first 35 completed months, \$4,973.22/);
 for(let i=0;i<35;i++)assert.notEqual($('ledgerBody').rows[i].cells[16].textContent,'$0.00');
 assert($('ledgerHead').textContent.includes('DTA before band allocation'));assert($('ledgerBody').textContent.includes('Within band: split'));
 const before=$('ledgerBody').innerHTML;set('bandSplit','100');assert.notEqual($('ledgerBody').innerHTML,before);assert.match($('journeyCopy').textContent,/all in-band surplus to reinvestment/);
 set('bandSplit','0');assert.match($('journeyCopy').textContent,/sends in-band surplus to principal/);
 set('bandFloor','27');assert.equal($('bandFloor').getAttribute('aria-invalid'),'true');assert(!$('error').hidden);assert($('wealthJourney').hidden);assert($('csv').disabled);
 set('bandCeiling','28');assert($('error').hidden);assert(!$('wealthJourney').hidden);
 set('bandCeiling','100');assert(!$('error').hidden);$('reset').click();
 const precisionScenario={assets:10000000,debt:2500000,pay:0,bills:0,growth:0,yield:12,apr:0,financeStart:0};for(const [k,v]of Object.entries(precisionScenario))set(k,v);set('bandSplit','33.333333');$('bandSplit').dispatchEvent(new w.FocusEvent('focusout',{bubbles:true}));assert.equal($('bandSplit').value,'33.33');set('months','1');const expected=w.FlowSimV4.simulate({...precisionScenario,bandSplit:33.333333,months:1});assert.equal($('ledgerBody').rows[0].cells[16].textContent,w.FlowSimV4.format(expected.final.reinvested,'$'));assert.notEqual($('ledgerBody').rows[0].cells[16].textContent,w.FlowSimV4.format(w.FlowSimV4.simulate({...precisionScenario,bandSplit:33.33,months:1}).final.reinvested,'$'));
 $('reset').click();assert.equal($('ledgerBody').innerHTML,before);assert.equal($('bandSplit').value,'50.00');
 console.log('V4 band DOM PASS: defaults, labels, independent guardrail, live allocation/narrative updates, 35 reinvestment months, ledger routing, invalid bounds, precision and reset.');
}finally{w.close();}

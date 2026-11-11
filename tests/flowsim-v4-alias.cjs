const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const original=fs.readFileSync(path.join(__dirname,'../FlowSimV4.html')),shared=fs.readFileSync(path.join(__dirname,'../flow-stages.html'));
// V4 now intentionally has an independent debt-band allocator. Freeze the entire
// unapproved Flow Stages app, and protect shared draw/wage/accounting mechanics.
const crypto=require('node:crypto');
assert.equal(crypto.createHash('sha256').update(shared).digest('hex'),'315ccb49c8f0c78da17c5dcce1e3538fdcd7f0ae11357a5e114175b35b1725c2','Flow Stages must remain byte-identical to its approved baseline.');
const source=original.toString(),legacy=shared.toString();
const between=(s,start,end)=>s.slice(s.indexOf(start),s.indexOf(end,s.indexOf(start)));
assert.equal(between(source,'  function capacity(','  // Assess after'),between(legacy,'  function capacity(','  function simulate('),'Draw capacity must remain independent and unchanged.');
assert.equal(between(source,'    let a=config.assets+config.upfront','      const interest='),between(legacy,'    let a=config.assets+config.upfront','      const interest='),'Price growth, distributions, bill funding, stops and wage allocation must stay unchanged.');
assert.equal(between(source,'      a=base+reinvested;','      const row='),between(legacy,'      a=base+reinvested;','      const row='),'Balance, warning and stage accounting must stay unchanged.');
assert(source.includes('id="wealthJourney"')&&source.includes('bandFloor:25,bandCeiling:30,bandSplit:70'));
assert(!legacy.includes('id="wealthJourney"')&&!legacy.includes('bandFloor'),'Do not port V4 features to Flow Stages without authorization.');
for(const filename of ['FlowSimV4.html','flow-stages.html']){
 const dom=new JSDOM(fs.readFileSync(path.join(__dirname,'..',filename),'utf8'),{runScripts:'dangerously',url:'https://rovocapitalmanagement.llc/'+filename}),d=dom.window.document;
 try{
  assert.equal(d.querySelector('header .overline').textContent,'FLOW STAGES');assert.equal(d.querySelectorAll('#ledgerBody tr').length,120);
  d.getElementById('scenarioToggle').click();assert(d.getElementById('scenarioPanel').hidden);d.getElementById('scenarioToggle').click();assert(!d.getElementById('scenarioPanel').hidden);
  const slider=d.getElementById('inspect');slider.value=58;slider.dispatchEvent(new dom.window.Event('input',{bubbles:true}));assert.equal(d.querySelector('#chartTooltip strong').textContent,'Month 58');
  assert(d.querySelector('footer').textContent.includes('For educational purposes only.'));
 }finally{dom.window.close();}
}
console.log('V4 shared URL PASS: Flow Stages baseline frozen; shared draw, wage and balance accounting unchanged, exact FLOW STAGES label, scenario controls, monthly chart and disclaimer at both paths.');

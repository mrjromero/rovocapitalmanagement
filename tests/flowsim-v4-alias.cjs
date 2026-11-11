const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const original=fs.readFileSync(path.join(__dirname,'../FlowSimV4.html')),shared=fs.readFileSync(path.join(__dirname,'../flow-stages.html'));
// Deliberate V4-only review feature. Removing only explicitly bounded narrative
// additions must recover the complete unchanged shared app, not just its engine.
const withoutJourney=original.toString()
 .replace(/<!-- V4_JOURNEY_(CARD|SCRIPT)_START -->[\s\S]*?<!-- V4_JOURNEY_\1_END -->\n/g,'')
 .replace(/\/\* V4_JOURNEY_(STYLE|UI)_START \*\/[\s\S]*?\/\* V4_JOURNEY_\1_END \*\/\n/g,'')
 .replace(/\/\* V4_JOURNEY_(ERROR|RENDER)_START \*\/[\s\S]*?\/\* V4_JOURNEY_\1_END \*\//g,'');
assert.equal(withoutJourney,shared.toString(),'Only the explicitly bounded V4 narrative may differ; all pre-existing simulator code must remain identical.');
assert(original.toString().includes('id="wealthJourney"'));
assert(!shared.toString().includes('id="wealthJourney"'),'Flow Stages must not receive the unapproved feature.');
for(const filename of ['FlowSimV4.html','flow-stages.html']){
 const dom=new JSDOM(fs.readFileSync(path.join(__dirname,'..',filename),'utf8'),{runScripts:'dangerously',url:'https://rovocapitalmanagement.llc/'+filename}),d=dom.window.document;
 try{
  assert.equal(d.querySelector('header .overline').textContent,'FLOW STAGES');assert.equal(d.querySelectorAll('#ledgerBody tr').length,120);
  d.getElementById('scenarioToggle').click();assert(d.getElementById('scenarioPanel').hidden);d.getElementById('scenarioToggle').click();assert(!d.getElementById('scenarioPanel').hidden);
  const slider=d.getElementById('inspect');slider.value=58;slider.dispatchEvent(new dom.window.Event('input',{bubbles:true}));assert.equal(d.querySelector('#chartTooltip strong').textContent,'Month 58');
  assert(d.querySelector('footer').textContent.includes('For educational purposes only.'));
 }finally{dom.window.close();}
}
console.log('V4 shared URL PASS: V4-only narrative isolated; every pre-existing byte unchanged, exact FLOW STAGES label, scenario controls, monthly chart and disclaimer at both paths.');

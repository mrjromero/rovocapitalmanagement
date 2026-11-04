const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const original=fs.readFileSync(path.join(__dirname,'../FlowSimV4.html')),shared=fs.readFileSync(path.join(__dirname,'../flow-stages.html'));
assert(original.equals(shared),'FlowSimV4.html and flow-stages.html must remain byte-identical. Copy the editing source to the shared URL before publishing.');
for(const filename of ['FlowSimV4.html','flow-stages.html']){
 const dom=new JSDOM(fs.readFileSync(path.join(__dirname,'..',filename),'utf8'),{runScripts:'dangerously',url:'https://rovocapitalmanagement.llc/'+filename}),d=dom.window.document;
 try{
  assert.equal(d.querySelector('header .overline').textContent,'FLOW STAGES');assert.equal(d.querySelectorAll('#ledgerBody tr').length,120);
  d.getElementById('scenarioToggle').click();assert(d.getElementById('scenarioPanel').hidden);d.getElementById('scenarioToggle').click();assert(!d.getElementById('scenarioPanel').hidden);
  const slider=d.getElementById('inspect');slider.value=58;slider.dispatchEvent(new dom.window.Event('input',{bubbles:true}));assert.equal(d.querySelector('#chartTooltip strong').textContent,'Month 58');
  assert(d.querySelector('footer').textContent.includes('For educational purposes only.'));
 }finally{dom.window.close();}
}
console.log('V4 shared URL PASS: byte-identical published pages, exact FLOW STAGES label, scenario controls, monthly chart and disclaimer at both paths.');

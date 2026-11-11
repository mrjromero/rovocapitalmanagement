const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{JSDOM}=require('jsdom');
const read=name=>fs.readFileSync(path.join(__dirname,'..',name),'utf8'),source=read('FlowSimV4.html'),shared=read('flow-stages.html'),backup=read('flow-stages-backup-2026-11-11.html');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
// The user approved synchronization only after an exact, durable legacy backup.
assert.equal(hash(backup),'315ccb49c8f0c78da17c5dcce1e3538fdcd7f0ae11357a5e114175b35b1725c2','Preserve every byte of the pre-sync Flow Stages backup.');
assert.equal(hash(source),'5fdcfee715a28ed8ab98b3b631b163f0eb8b2cda593ad16af72b491718d98b07','This synchronization must not change V4.');
assert.equal(shared,source.replaceAll('FLOW V4','FLOW STAGES').replace('FLOW-V4-roadmap.csv','FLOW-Stages-roadmap.csv'),'Only three user-visible titles and the CSV filename may differ between active apps.');
assert.equal((source.match(/FLOW V4/g)||[]).length,3);
assert(source.includes('id="wealthJourney"')&&shared.includes('bandFloor:25,bandCeiling:30,bandSplit:70'));
assert(!backup.includes('id="wealthJourney"')&&!backup.includes('bandFloor'),'The backup retains its original static-target implementation.');
const robots=read('robots.txt');assert(!robots.includes('flow-stages-backup-2026-11-11.html'),'Do not add a backup crawl exception.');
assert(backup.includes('<meta name="robots" content="noindex,nofollow">'));
for(const filename of ['FlowSimV4.html','flow-stages.html']){
 const dom=new JSDOM(read(filename),{runScripts:'dangerously',url:'https://rovocapitalmanagement.llc/'+filename}),w=dom.window,d=w.document,$=id=>d.getElementById(id);
 try{
  const brand=filename==='FlowSimV4.html'?'FLOW V4':'FLOW STAGES';
  assert.equal(d.title,brand+' · Contribution Roadmap');assert.equal(d.querySelector('header .overline').textContent,'FLOW STAGES');assert.equal(d.querySelectorAll('#ledgerBody tr').length,120);
  $('scenarioToggle').click();assert($('scenarioPanel').hidden);$('scenarioToggle').click();assert(!$('scenarioPanel').hidden);
  $('inspect').value=58;$('inspect').dispatchEvent(new w.Event('input',{bubbles:true}));assert.equal(d.querySelector('#chartTooltip strong').textContent,'Month 58');
  assert(d.querySelector('footer').textContent.includes('For educational purposes only.'));
  assert.equal($('stage5Card').open,false);assert.match($('stage5Summary').textContent,/Coming later/);
  assert.match(w.FlowSimV4.toCsv(w.FlowSimV4.simulate()),new RegExp('^\\uFEFF"'+brand+' Contribution Roadmap"'));
  let printCount=0;w.print=()=>printCount++;$('pdf').click();assert.equal(printCount,1);assert.equal(d.querySelector('#printReport h1').textContent,brand+' · Contribution Roadmap');
  $('months').value=240;$('months').dispatchEvent(new w.Event('input',{bubbles:true}));assert($('stage5Card').open);assert(!$('glideToggle').disabled);
  $('glideToggle').checked=true;$('glideToggle').dispatchEvent(new w.Event('change',{bubbles:true}));
  assert.equal($('reduceStart').value,'188');assert.equal(Number($('reduced').value),97);assert.equal($('ledgerBody').rows[187].cells[28].textContent,'$221.37');assert.equal($('ledgerBody').rows[187].cells[19].textContent,'$0.00');
  $('glideToggle').checked=false;$('glideToggle').dispatchEvent(new w.Event('change',{bubbles:true}));assert.equal($('reduceStart').value,'0');assert.equal(Number($('contribution').value),100);assert($('restoreManual'));
  $('restoreManual').click();assert.equal(Number($('reduced').value),50);assert(!$('restoreManual'));
  $('reset').click();assert.equal($('months').value,'120');assert.equal($('stage5Card').open,false);assert.equal($('ledgerBody').rows.length,120);
 }finally{w.close();}
}
console.log('Flow Stages sync PASS: exact backup and unchanged V4; complete source parity except branding; both live routes, defaults, chart, compact Stage 5, automatic plan, restore/reset, CSV and print.');

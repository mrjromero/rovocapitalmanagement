const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{JSDOM}=require('jsdom');
const read=name=>fs.readFileSync(path.join(__dirname,'..',name),'utf8'),source=read('FlowSimV4.html'),shared=read('flow-stages.html'),backup=read('flow-stages-backup-2026-11-11.html');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
// The user approved synchronization only after an exact, durable legacy backup.
assert.equal(hash(backup),'315ccb49c8f0c78da17c5dcce1e3538fdcd7f0ae11357a5e114175b35b1725c2','Preserve every byte of the pre-sync Flow Stages backup.');
assert.equal(hash(source),'8bfb42854796045e321d5a911df70f39b4e94850cbcd5b68d38b94cf03f104b5','Syncing reviewed UI improvements must not change V4.');
const navigationStyle="/* Flow Stages Toolbox navigation */\nheader{flex-wrap:wrap;gap:12px 20px}.toolbox-back{display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:8px 12px;border:1px solid #416970;border-radius:8px;color:var(--green);text-decoration:none;white-space:nowrap}.toolbox-back:hover{text-decoration:underline;background:#172b3b}\n";
const navigationLink="<a class=\"toolbox-back\" href=\"/toolbox\"><span aria-hidden=\"true\">←</span> Back to Toolbox</a>";
assert.equal(shared,
 source.replaceAll('FLOW V4','FLOW STAGES').replace('FLOW-V4-roadmap.csv','FLOW-Stages-roadmap.csv')
  .replace('</style></head><body>',navigationStyle+'</style></head><body>')
  .replace('</p></div></header>','</p></div>'+navigationLink+'</header>')
  .replace('bandFloor:25,bandCeiling:30,bandSplit:70','bandFloor:25,bandCeiling:30,bandSplit:0'),
 'Only Toolbox navigation, branding, and the default band split may differ; preserve simulator logic.');
assert.equal((source.match(/FLOW V4/g)||[]).length,3);
assert(source.includes('id="wealthJourney"')&&shared.includes('bandFloor:25,bandCeiling:30,bandSplit:0'));
assert(!backup.includes('id="wealthJourney"')&&!backup.includes('bandFloor'),'The backup retains its original static-target implementation.');
const robots=read('robots.txt');assert(!robots.includes('flow-stages-backup-2026-11-11.html'),'Do not add a backup crawl exception.');
assert(backup.includes('<meta name="robots" content="noindex,nofollow">'));
for(const filename of ['FlowSimV4.html','flow-stages.html']){
 const dom=new JSDOM(read(filename),{runScripts:'dangerously',url:'https://rovocapitalmanagement.llc/'+filename}),w=dom.window,d=w.document,$=id=>d.getElementById(id);
 try{
  const brand=filename==='FlowSimV4.html'?'FLOW V4':'FLOW STAGES';
  const defaultSplit=filename==='flow-stages.html'?0:70;
  assert.equal(w.FlowSimV4.defaults.bandSplit,defaultSplit);
  assert.equal(Number($('bandSplit').value),defaultSplit);
  const inBand=w.FlowSimV4.allocateBand(w.FlowSimV4.defaults,100000,27000,1000);
  assert.equal(Math.round(inBand.reinvested*100),defaultSplit*1000);
  // Verify both modeled amounts at currency precision (floating point can leave fractional cents).
  assert.equal(Math.round(inBand.principal*100),(100-defaultSplit)*1000);
  const back=d.querySelectorAll('header a.toolbox-back');
  assert.equal(back.length,filename==='flow-stages.html'?1:0);
  if(back.length){assert.equal(back[0].href,'https://rovocapitalmanagement.llc/toolbox');assert.match(back[0].textContent,/Back to Toolbox/);}
  assert.equal(d.title,brand+' · Contribution Roadmap');assert.equal(d.querySelector('header .overline').textContent,'FLOW STAGES');assert.equal(d.querySelectorAll('#ledgerBody tr').length,120);
  $('scenarioToggle').click();assert($('scenarioPanel').hidden);$('scenarioToggle').click();assert(!$('scenarioPanel').hidden);
  $('inspect').value=58;$('inspect').dispatchEvent(new w.Event('input',{bubbles:true}));assert.equal(d.querySelector('#chartTooltip strong').textContent,'Month 58');
  assert($('columnPicker')&&$('columnsToggle'));
  const labels=Array.from(d.querySelectorAll('.chart-month-label'));
  assert.equal(labels.at(-1).textContent,'Month 120');assert.equal(labels.at(-1).getAttribute('text-anchor'),'end');
  const tooltip=Object.fromEntries(Array.from($('chartTooltip').querySelectorAll('div'),el=>Array.from(el.children,node=>node.textContent)));
  const row=w.FlowSimV4.simulate().rows[57];assert.equal(tooltip['Bills financed'],w.FlowSimV4.format(row.financed,'$'));assert.equal(tooltip['Bills from pay'],w.FlowSimV4.format(row.payBills,'$'));
  assert(d.querySelector('footer').textContent.includes('For educational purposes only.'));
  assert.equal($('stage5Card').open,false);assert.match($('stage5Summary').textContent,/Coming later/);
  assert.match(w.FlowSimV4.toCsv(w.FlowSimV4.simulate()),new RegExp('^\\uFEFF"'+brand+' Contribution Roadmap"'));
  let printCount=0;w.print=()=>printCount++;$('pdf').click();assert.equal(printCount,1);assert.equal(d.querySelector('#printReport h1').textContent,brand+' · Contribution Roadmap');
  // Keep the existing 70/30 Stage 5 regression fixture independent of page defaults.
  $('bandSplit').value=70;$('bandSplit').dispatchEvent(new w.Event('input',{bubbles:true}));
  $('months').value=240;$('months').dispatchEvent(new w.Event('input',{bubbles:true}));assert($('stage5Card').open);assert(!$('glideToggle').disabled);
  $('glideToggle').checked=true;$('glideToggle').dispatchEvent(new w.Event('change',{bubbles:true}));
  assert.equal($('reduceStart').value,'188');assert.equal(Number($('reduced').value),97);assert.equal($('ledgerBody').rows[187].cells[28].textContent,'$221.37');assert.equal($('ledgerBody').rows[187].cells[19].textContent,'$0.00');
  $('glideToggle').checked=false;$('glideToggle').dispatchEvent(new w.Event('change',{bubbles:true}));assert.equal($('reduceStart').value,'0');assert.equal(Number($('contribution').value),100);assert($('restoreManual'));
  $('restoreManual').click();assert.equal(Number($('reduced').value),50);assert(!$('restoreManual'));
  $('reset').click();assert.equal(Number($('bandSplit').value),defaultSplit);assert.equal($('months').value,'120');assert.equal($('stage5Card').open,false);assert.equal($('ledgerBody').rows.length,120);
 }finally{w.close();}
}
console.log('Flow Stages sync PASS: exact preserved V4 and backup; source parity except branding, Toolbox navigation, and default band split; both app variants, defaults, chart, compact Stage 5, automatic plan, restore/reset, CSV and print.');

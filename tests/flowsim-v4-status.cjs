const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const source=fs.readFileSync(path.join(__dirname,'../FlowSimV4.html'),'utf8');
const dom=new JSDOM(source,{runScripts:'dangerously'}),w=dom.window,d=w.document,F=w.FlowSimV4,$=id=>d.getElementById(id);
const set=(key,value)=>{$(key).value=value;$(key).dispatchEvent(new w.Event('input',{bubbles:true}));};
const use=config=>{$('reset').click();for(const [key,value]of Object.entries(config))$(key).value=value;$('months').dispatchEvent(new w.Event('input',{bubbles:true}));return F.simulate(config);};
const text=()=>$('summary').textContent;
const clean=count=>{assert.equal($('simulationStatus'),null);assert.equal($('summary').className,'simulation-count');assert.equal($('summaryWarningsOnly'),null);assert.equal($('summary').children.length,1);assert.equal(text(),`${count} ${count===1?'month':'months'} modeled`);assert.equal($('summary').querySelector('h2,.status-badge'),null);assert.equal($('summary').getAttribute('aria-live'),'polite');};
const attention=r=>{assert(r.warningMonths>0);assert.equal($('simulationStatus').textContent,`${r.warningMonths} ${r.warningMonths===1?'Month Needs':'Months Need'} Attention`);assert.equal($('summary').className,'banner warn');assert.match(text(),/Borrowing limits, coverage or cash allocations need attention in \d+ months?\. Check the ledger below to adjust\./);assert.doesNotMatch(text(),/breached|safely|hypothetical|lender approval|safe borrowing|month\(s\)/);assert.equal($('summaryWarningsOnly').textContent,'View Flagged Months');assert.equal($('summaryWarningsOnly').getAttribute('aria-controls'),'ledgerBody');assert.equal($('summary').nextElementSibling.getAttribute('aria-labelledby'),'roadmapTitle');};
try{
 clean(120);assert($('scenarioNotes').hidden);
 assert(!source.includes('Capacity is hypothetical, not lender approval or a long-term safe borrowing budget.'));
 assert.match(d.querySelector('footer').textContent,/For educational purposes only/);
 use({months:1});clean(1);
 use({months:600,inflation:0});clean(600);
 // Different warning causes must be counted, not all described as breaches.
 const undefinedRatio=use({assets:0,debt:0,pay:0,bills:0,months:1});attention(undefinedRatio);assert.equal(undefinedRatio.final.status,'DTA undefined');
 const cashGap=use({assets:10000,debt:0,pay:100,bills:0,retain:200,financeStart:0,months:3});attention(cashGap);assert(cashGap.rows.every(row=>row.status==='Cash allocation not fully funded'));
 const coverage=use({assets:25000,debt:5000,pay:0,bills:0,yield:1,apr:12,maxDta:90,financeStart:0,months:2});attention(coverage);assert(coverage.rows.every(row=>row.coverage<3&&row.preDta<.9));
 const r=use({assets:10000,debt:8000,pay:5000,bills:0,growth:0,yield:0,apr:0,financeStart:0,months:6});attention(r);assert.equal(r.warningMonths,4);
 const allRows=$('ledgerBody').innerHTML,story=$('journeyCopy').innerHTML,metrics=$('metrics').innerHTML;
 for(let repeat=0;repeat<2;repeat++){
  $('summaryWarningsOnly').click();assert.equal($('ledgerBody').rows.length,4);assert.equal($('summaryWarningsOnly').getAttribute('aria-pressed'),'true');assert.equal($('warningsOnly').getAttribute('aria-pressed'),'true');
  assert.equal($('journeyCopy').innerHTML,story);assert.equal($('metrics').innerHTML,metrics);
  $('warningsOnly').click();assert.equal($('ledgerBody').innerHTML,allRows);assert.equal($('summaryWarningsOnly').getAttribute('aria-pressed'),'false');
 }
 $('warningsOnly').click();set('debt',0);clean(6);assert.equal($('ledgerBody').rows.length,0);assert.equal($('warningsOnly').getAttribute('aria-pressed'),'true');set('debt',8000);attention(r);assert.equal($('summaryWarningsOnly').getAttribute('aria-pressed'),'true');set('months',7);assert.equal($('summaryWarningsOnly').getAttribute('aria-pressed'),'true');assert.equal($('ledgerBody').rows.length,4);
 w.print=()=>{};$('pdf').click();assert.match($('printReport').textContent,/4 Months Need Attention/);assert.doesNotMatch($('printReport').textContent,/Warnings only|View Flagged Months/);assert.equal($('printReport').querySelectorAll('.print-section tbody tr').length,21);
 // A later failure cannot turn earlier clear months into an all-clear run.
 const stopped=use({assets:1000,debt:0,pay:1000,bills:2000,cash:2000,financeStart:0,yield:0,growth:0,payGrowth:0,inflation:0,months:4});assert.equal(stopped.failure.month,3);assert.equal(stopped.warningMonths,0);assert.equal($('summary').className,'banner fail');assert.match(text(),/Projection stops before month 3/);assert.doesNotMatch(text(),/All .* Clear/);assert.equal($('simulationStatus'),null);
 const warnedStop=use({assets:0,debt:0,pay:1000,bills:2000,cash:2000,financeStart:0,yield:0,growth:0,payGrowth:0,inflation:0,months:4});assert.equal(warnedStop.warningMonths,2);assert.equal($('summary').className,'banner fail');assert.match(text(),/Projection stops before month 3/);assert.equal($('simulationStatus'),null);assert.equal($('summaryWarningsOnly').textContent,'View Flagged Months');$('summaryWarningsOnly').click();assert.equal($('warningsOnly').getAttribute('aria-pressed'),'true');
 const zero=use({assets:0,debt:0,cash:0,pay:0,bills:1000,months:3});assert.equal(zero.rows.length,0);assert.match(text(),/Projection stops before month 1/);assert.doesNotMatch(text(),/All .* Clear/);assert.equal($('summaryWarningsOnly'),null);
 use({months:1,financeStart:2});clean(1);assert(!$('scenarioNotes').hidden);assert.match($('scenarioNotes').textContent,/beyond this horizon/,'Operational configuration notes remain visible beside inputs');assert($('scenarioPanel').contains($('scenarioNotes')));$('pdf').click();assert.match($('printReport').textContent,/beyond this horizon/);assert.match($('printReport').textContent,/1 month modeled/);
 set('months','');assert.equal($('summary').innerHTML,'');assert.equal($('summaryWarningsOnly'),null);assert.equal($('scenarioNotes').textContent,'');assert($('scenarioNotes').hidden);assert.equal($('summary').className,'simulation-count');assert(!$('error').hidden);
 $('reset').click();clean(120);assert($('scenarioNotes').hidden);assert.equal($('warningsOnly').getAttribute('aria-pressed'),'false');
 console.log('V4 status PASS: inline-only clean 1/120/600 months, singular/plural warning counts, guardrail/coverage/undefined-DTA/cash-gap causes, two synced filters, rerenders, full print export, stopped/empty/invalid paths, input-side configuration notes and reset.');
}finally{w.close();}

const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const dom=new JSDOM(fs.readFileSync(path.join(__dirname,'../FlowSimV4.html'),'utf8'),{runScripts:'dangerously'}),w=dom.window,d=w.document,$=id=>d.getElementById(id);
const set=(id,value)=>{$(id).value=value;$(id).dispatchEvent(new w.Event('input',{bubbles:true}));};
try{
 assert.equal($('journeyTitle').textContent,'Your Wealth Engine Journey');
 assert.equal($('wealthJourney').nextElementSibling.querySelector('h2').textContent,'Month-by-month plan');
 assert.equal($('journeyCopy').children.length,4);assert.equal($('journeyCopy').querySelectorAll('h3').length,4);assert.match($('journeyCopy').textContent,/In Month 2, your 25% DTA draw limit taps the brakes/);
 const initial=$('journeyCopy').textContent;
 for(const button of d.querySelectorAll('.journey-month')){button.click();const month=button.dataset.month;assert.equal($('inspect').value,month);assert.equal(d.activeElement,$('inspect'));assert($('monthLabel').textContent.startsWith('Month '+month+' ·'));assert.equal($('chartTooltip').querySelector('strong').textContent,'Month '+month);assert.equal($('chartTooltip').hidden,false);assert($('chartSelection').children.length>0);}
 $('warningsOnly').click();assert.equal($('journeyCopy').textContent,initial);$('warningsOnly').click();
 set('assets','1000000');assert.notEqual($('journeyCopy').textContent,initial);assert.match($('journeyCopy').textContent,/through the modeled horizon/);
 set('months','1');assert.equal($('inspect').max,'1');assert([...d.querySelectorAll('.journey-month')].every(b=>b.dataset.month==='1'));assert.match($('journeyCopy').textContent,/only modeled month/);
 set('months','');assert.equal($('wealthJourney').hidden,true);assert.equal($('journeyCopy').children.length,0);assert.equal($('inspect').disabled,true);
 set('months','12');assert.equal($('wealthJourney').hidden,false);assert.equal($('journeyCopy').children.length,4);
 set('assets','0');set('cash','0');set('pay','0');assert.equal($('journeyCopy').children.length,4);assert.equal(d.querySelectorAll('.journey-month').length,0);assert.match($('journeyCopy').textContent,/launch stalls/);
 $('reset').click();assert.equal($('journeyCopy').textContent,initial);assert.equal($('inspect').value,'1');
 set('reduceStart','12');set('reduced','0');assert.notEqual($('journeyCopy').textContent,initial);
 set('stressStart','20');set('shock','50');assert.notEqual($('journeyCopy').textContent,initial);
 $('reset').click();assert.equal($('journeyCopy').textContent,initial);
 console.log('V4 journey DOM PASS: placement, four executive sections, all pill targets, focus, chart/slider/inspector synchronization, filter independence, scenario/reset edits, invalid and zero-completed clearing.');
}finally{w.close();}

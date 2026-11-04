const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const dom=new JSDOM(fs.readFileSync(path.join(__dirname,'../FlowSimV4.html'),'utf8'),{runScripts:'dangerously'}),w=dom.window,d=w.document,$=id=>d.getElementById(id);
const set=(k,v)=>{$(k).value=v;$(k).dispatchEvent(new w.Event('input',{bubbles:true}));};
const bounds={left:50,top:100,width:1000,height:280};
$('chart').getBoundingClientRect=()=>bounds;$('chartWrap').getBoundingClientRect=()=>({width:1000});
const point=(x,y=130,type='pointermove')=>$('chart').dispatchEvent(new w.MouseEvent(type,{clientX:bounds.left+x/1000*bounds.width,clientY:bounds.top+y/280*bounds.height}));
const rowCheck=(month,count)=>{point(75+(month-1)/Math.max(1,count-1)*900);assert.equal($('inspect').value,String(month));assert.equal($('chartTooltip').hidden,false);assert.equal($('chartTooltip').querySelector('strong').textContent,'Month '+month);assert($('monthLabel').textContent.startsWith('Month '+month+' ·'));const row=w.FlowSimV4.simulate(Object.fromEntries(Object.keys(w.FlowSimV4.defaults).map(k=>[k,Number($(k).value)]))).rows[month-1];for(const k of ['assets','debt','equity','cash'])assert($('chartTooltip').textContent.includes(w.FlowSimV4.format(row[k],'$')));assert.equal($('chartSelection').querySelectorAll('circle').length,3);};
try{
  for(let m=1;m<=120;m++)rowCheck(m,120);
  point(74);assert($('chartTooltip').hidden);point(976);assert($('chartTooltip').hidden);point(400,24);assert($('chartTooltip').hidden);point(400,236);assert($('chartTooltip').hidden);
  rowCheck(32,120);$('chart').dispatchEvent(new w.Event('pointerleave'));assert($('chartTooltip').hidden);
  set('inspect',33);assert.equal($('chartTooltip').querySelector('strong').textContent,'Month 33');assert(!$('chartTooltip').hidden);
  $('inspect').dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape'}));assert($('chartTooltip').hidden);
  set('months',1);rowCheck(1,1);point(900,130,'pointerdown');assert.equal($('inspect').value,'1');
  set('inflation',0);set('months',600);for(let m=1;m<=600;m++)rowCheck(m,600);
  bounds.width=300;bounds.height=84;$('chartWrap').getBoundingClientRect=()=>({width:300});for(const m of [1,2,300,599,600]){rowCheck(m,600);const left=parseFloat($('chartTooltip').style.left);assert(left>=0&&left+260<=300);}
  set('months',1.5);assert($('chartTooltip').hidden);point(300);assert($('chartTooltip').hidden);
  $('reset').click();assert($('chartTooltip').hidden);assert.equal($('inspect').value,'1');rowCheck(9,120);
  set('assets',0);set('cash',0);set('pay',0);assert.equal($('ledgerBody').rows.length,0);assert($('chartTooltip').hidden);point(300);assert($('chartTooltip').hidden);
  $('reset').click();rowCheck(10,120);$('chart').dispatchEvent(new w.Event('pointercancel'));assert($('chartTooltip').hidden);
  console.log('V4 chart PASS: all 120/600 monthly points and exact displayed balances, endpoints, 1/0 months, hover/tap, slider, Escape, responsive coordinates, reset and invalid-input cleanup.');
}finally{w.close();}

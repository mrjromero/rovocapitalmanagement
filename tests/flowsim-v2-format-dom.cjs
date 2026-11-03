const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const dom=new JSDOM(fs.readFileSync(path.join(__dirname,'../FlowSimV2.html'),'utf8'),{runScripts:'dangerously',url:'http://localhost/FlowSimV2.html'}),w=dom.window,d=w.document,q=s=>d.querySelector(s),F=w.FlowSimV2;let last;
const simulate=F.simulate;F.simulate=c=>(last=simulate(c));
const set=(name,value,commit=true)=>{const e=q(`[name=${name}]`);e.value=String(value);e.dispatchEvent(new w.Event('input',{bubbles:true}));if(commit)e.dispatchEvent(new w.Event('change',{bubbles:true}));};
try{
 set('yield',7.123456789);set('apr',4.241234567);set('growth',2.3456789);set('targetDta',20.123456);set('maxDta',28.123456);
 assert.equal(q('[name=yield]').value,'7.12');assert.equal(last.inputs.yield,7.123456789);assert.equal(last.inputs.apr,4.241234567);assert.equal(last.inputs.growth,2.3456789);assert.equal(last.inputs.targetDta,20.123456);assert.equal(last.inputs.maxDta,28.123456);
 const exact=simulate({...F.defaults,yield:7.123456789,apr:4.241234567,growth:2.3456789,targetDta:20.123456,maxDta:28.123456});assert.equal(last.final.netEquity,exact.final.netEquity);
 set('pay',5100);assert.equal(last.inputs.yield,7.123456789);q('[name=yield]').dispatchEvent(new w.Event('focusout',{bubbles:true}));assert.equal(q('[name=yield]').value,'7.12');
 set('cash',33.123456789,false);assert.equal(q('[name=cash]').value,'33.123456789');q('[name=cash]').dispatchEvent(new w.Event('change',{bubbles:true}));assert.equal(q('[name=cash]').value,'33.12');assert.equal(q('[name=drip]').value,'66.88');assert.equal(last.inputs.cash,33.123456789);assert.equal(last.inputs.drip+last.inputs.cash,100);
 set('bills',3000);assert.equal(last.inputs.cash,33.123456789);assert.equal(last.inputs.yield,7.123456789);
 const csv=F.toCsv(last),raw=F.toCsv(last,{fullPrecision:true});assert(csv.includes('"Input","yield","7.12"'));assert(!csv.includes('7.123456789'));assert(raw.includes('"Input","yield","7.123456789"'));assert(csv.includes('rounded exports cannot exactly reproduce'));assert.equal(last.inputs.yield,7.123456789);
 const lines=csv.split('\r\n'),headIndex=lines.findIndex(l=>l.startsWith('"month",')),headers=lines[headIndex].replace(/^"|"$/g,'').split('","'),dta=headers.indexOf('dta_pct'),apr=headers.indexOf('apr');for(const line of lines.slice(headIndex+1)){const fields=line.replace(/^"|"$/g,'').split('","');for(const i of [dta,apr])if(fields[i])assert(!/\.\d{3}/.test(fields[i]));}
 assert(!/\d\.\d{3,}%/.test(q('#comparison').textContent+q('#activePath').textContent+q('#dtaMonth').textContent+q('#splitText').textContent));
 assert(q('[name=growth]').closest('label').textContent.startsWith('Price growth'));const help=q('summary[aria-label="About Price growth"]');assert(help);help.click();assert(help.parentElement.open);assert(help.parentElement.textContent.includes('excluding distributions'));help.click();assert(!help.parentElement.open);assert(d.querySelectorAll('.field-help').length>=20);
 set('yield',7.12);assert.equal(last.inputs.yield,7.12);q('#reset').click();assert.equal(last.inputs.yield,7);assert.equal(last.inputs.cash,100);console.log('V2 formatting DOM PASS: raw precision retention, edits, linked allocation, two-decimal displays/CSV, full-precision API export, help and reset.');
}finally{w.close();}

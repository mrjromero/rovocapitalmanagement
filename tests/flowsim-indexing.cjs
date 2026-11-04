const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const targets=['flowsim.html','FlowSimV2.html','FlowSimV3.html','FlowSimV4.html','flow-stages.html'];
for(const name of targets){const dom=new JSDOM(fs.readFileSync(path.join(__dirname,'..',name),'utf8'));const tags=[...dom.window.document.head.querySelectorAll('meta[name="robots"]')];assert.equal(tags.length,1,name+' requires one static robots directive');const terms=tags[0].content.split(',').map(t=>t.trim().toLowerCase());assert(terms.includes('noindex')&&terms.includes('nofollow'),name);dom.window.close();}
const robots=fs.readFileSync(path.join(__dirname,'../robots.txt'),'utf8');assert.match(robots,/^User-agent: \*$/m);assert.match(robots,/^Disallow: \/$/m);
const allows=robots.split(/\r?\n/).filter(s=>s.startsWith('Allow: ')).map(s=>s.slice(7));assert.deepEqual(allows,targets.flatMap(n=>['/'+n+'$','/'+n+'?']));
// Google/Bing-style longest-path matching, with end anchors and literal query delimiters.
const allowed=url=>allows.some(pattern=>pattern.endsWith('$')?url===pattern.slice(0,-1):url.startsWith(pattern));
for(const name of targets){assert(allowed('/'+name));assert(allowed('/'+name+'?shared=1'));assert(!allowed('/'+name+'/other'));assert(!allowed('/'+name+'-backup'));}
for(const p of ['/','/index.html','/private.html','/assets/flowsim/engine.js'])assert(!allowed(p));
console.log('FlowSim indexing PASS: static noindex/nofollow on all five pages; exact page/query crawl exceptions only; site-wide block retained.');

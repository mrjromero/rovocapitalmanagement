'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const root=path.join(__dirname,'..'),html=fs.readFileSync(path.join(root,'flowsim.html'),'utf8'),dom=new JSDOM(html),d=dom.window.document;
const defaults={assets:'10000',debt:'0',income:'5000',bills:'3500',routing:'250',months:'36',yield:'7',apr:'6',growth:'2',payGrowth:'3',inflation:'3',targetDta:'20',maxDta:'25',coverage:'3',routingMode:'fixed',adaptiveMode:'gradual'};
for(const [name,value]of Object.entries(defaults))assert.equal(d.querySelector(`[name="${name}"]`).value,value,name);
assert.equal(d.querySelector('[name=reserve]'),null);assert.equal(d.querySelector('[name=adaptiveGrid]'),null);
assert.equal(d.querySelectorAll('iframe,form[action]').length,0);
for(const el of d.querySelectorAll('script[src],link[rel=stylesheet]'))assert.match(el.getAttribute('src')||el.getAttribute('href'),/^assets\/flowsim\//);
for(const name of ['app','engine','timeline','explanations']){const source=fs.readFileSync(path.join(root,'assets/flowsim',name+'.js'),'utf8');assert(!/\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon|localStorage|sessionStorage|indexedDB/.test(source),name+' must remain local and ephemeral');}
assert(!/B2|Safety Buffer|Test grid/.test(d.body.textContent));assert(!d.querySelector('#assumptions').open);
console.log('Release checks PASS: generic defaults, local assets only, no account/network/storage integration, no removed controls.');dom.window.close();

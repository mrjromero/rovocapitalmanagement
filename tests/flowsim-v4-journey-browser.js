// Optional local UI QA: NODE_PATH exposes playwright, FLOWSIM_BROWSER selects Chromium.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('path'),fs=require('fs');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.FLOWSIM_BROWSER?{executablePath:process.env.FLOWSIM_BROWSER}:{})});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[],requests=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
  await page.goto('file:///'+path.resolve(__dirname,'../FlowSimV4.html').replaceAll('\\','/'));
  const out=process.env.FLOWSIM_ARTIFACTS||path.resolve(__dirname,'../../flow-journey-qa');fs.mkdirSync(out,{recursive:true});
  assert.equal(await page.locator('#journeyCopy p').count(),4);
  const defaultStory=await page.locator('#journeyCopy').innerText();
  assert(defaultStory.includes('In Month 2, your 25% DTA draw limit taps the brakes'));
  await page.locator('#wealthJourney').screenshot({path:path.join(out,'journey-desktop.png')});
  for(const n of [1,2,120,2,1]){
   const pill=page.locator('.journey-month[data-month="'+n+'"]').first();await pill.click();
   assert.equal(await page.locator('#inspect').inputValue(),String(n));assert((await page.locator('#monthLabel').innerText()).startsWith('Month '+n+' ·'));
   assert.equal(await page.locator('#chartTooltip strong').innerText(),'Month '+n);
   assert(await page.locator('#inspect').evaluate(el=>el===document.activeElement));
  }
  await page.keyboard.press('ArrowRight');assert.equal(await page.locator('#inspect').inputValue(),'2');
  await page.keyboard.press('Escape');assert(await page.locator('#chartTooltip').isHidden());
  await page.locator('#journeyCopy .journey-month').last().focus();await page.keyboard.press('Enter');assert.equal(await page.locator('#inspect').inputValue(),'120');
  await page.locator('#warningsOnly').click();assert.equal(await page.locator('#journeyCopy').innerText(),defaultStory);
  await page.locator('#reset').click();
  await page.locator('#assets').fill('1000000');assert.notEqual(await page.locator('#journeyCopy').innerText(),defaultStory);
  assert((await page.locator('#journeyCopy').innerText()).includes('That lead holds through the modeled horizon'));
  await page.locator('#wealthJourney').screenshot({path:path.join(out,'journey-crossover-desktop.png')});
  await page.locator('#months').fill('1');assert((await page.locator('#journeyCopy').innerText()).includes('only modeled month'));
  await page.locator('#months').fill('');assert(await page.locator('#wealthJourney').isHidden());
  await page.locator('#reset').click();assert.equal(await page.locator('#journeyCopy').innerText(),defaultStory);
  await page.setViewportSize({width:390,height:844});await page.locator('#scenarioToggle').click();
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.locator('#wealthJourney').screenshot({path:path.join(out,'journey-mobile.png')});
  await page.locator('.journey-month[data-month="120"]').click();assert.equal(await page.locator('#inspect').inputValue(),'120');
  assert(await page.locator('#inspect').evaluate(el=>{const r=el.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight;}));
  await page.screenshot({path:path.join(out,'journey-mobile-inspector.png')});
  await page.locator('#scenarioToggle').click();await page.locator('#inflation').fill('0');await page.locator('#months').fill('600');
  assert.equal(await page.locator('#ledgerBody tr').count(),600);await page.locator('.journey-month[data-month="600"]').click();assert.equal(await page.locator('#inspect').inputValue(),'600');
  await page.locator('#assets').fill('0');await page.locator('#pay').fill('0');assert.equal(await page.locator('#journeyCopy p').count(),4);assert.equal(await page.locator('.journey-month').count(),0);
  assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
  console.log('V4 journey browser PASS: 1440px/390px, screenshots, repeated pill clicks, keyboard activation and arrows, focus/scroll, synchronized chart/slider/details, reset/filter, live edits, 1/600 months, invalid/failed plans, no JS errors/network requests.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

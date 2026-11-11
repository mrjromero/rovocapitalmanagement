// Optional local geometry/accessibility QA: Playwright and FLOWSIM_BROWSER=Chromium.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.FLOWSIM_BROWSER?{executablePath:process.env.FLOWSIM_BROWSER}:{})});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[],requests=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
  await page.goto('file:///'+path.resolve(__dirname,'../FlowSimV4.html').replaceAll('\\','/'));
  const out=process.env.FLOWSIM_ARTIFACTS||path.resolve(__dirname,'../../flowsim-ledger-qa');fs.mkdirSync(out,{recursive:true});
  // Use browser glyph geometry, not just source/anchor assertions, including one/short/long horizons.
  for(const width of [1440,1024,768,390,320]){
   await page.setViewportSize({width,height:1100});
   for(const months of [1,2,12,120,600]){
    await page.locator('#inflation').fill('0');await page.locator('#months').fill(String(months));
    const bounds=await page.locator('#chart').evaluate(svg=>{const viewport=svg.getBoundingClientRect();return Array.from(svg.querySelectorAll('.chart-month-label'),el=>{const r=el.getBoundingClientRect(),b=el.getBBox();return {text:el.textContent,visible:r.left>=viewport.left-.5&&r.right<=viewport.right+.5&&r.top>=viewport.top-.5&&r.bottom<=viewport.bottom+.5,svgVisible:b.x>=0&&b.x+b.width<=1000};});});
    assert(bounds.length>0);assert(bounds.every(x=>x.visible&&x.svgVisible),JSON.stringify({width,months,bounds}));
    assert.equal(bounds.at(-1).text,'Month '+months);
   }
   await page.locator('#columnsToggle').click();
   assert(await page.locator('#columnPicker').isVisible());
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`No horizontal document overflow at ${width}px`);
   const controls=await page.locator('#columnOptions label').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,height:r.height};}));
   assert(controls.every(r=>r.left>=0&&r.right<=width&&r.height>=44));
   await page.locator('#columnsNone').click();assert.equal(await page.locator('#ledgerHead th').count(),1);
   await page.getByRole('checkbox',{name:'Bills financed',exact:true}).check();await page.getByRole('checkbox',{name:'Bills from pay',exact:true}).check();
   assert.equal(await page.locator('#ledgerHead th').count(),3);
   await page.locator('#columnsDone').click();assert(await page.locator('#columnsToggle').evaluate(el=>el===document.activeElement));
  }
  await page.setViewportSize({width:1440,height:1100});await page.locator('#reset').click();
  await page.locator('#columnsToggle').focus();await page.keyboard.press('Enter');assert.equal(await page.locator('#columnsToggle').getAttribute('aria-expanded'),'true');
  await page.getByRole('checkbox',{name:'Bills financed',exact:true}).focus();await page.keyboard.press('Space');assert.equal(await page.locator('#ledgerHead th').count(),2);await page.keyboard.press('Space');
  await page.keyboard.press('Escape');assert(await page.locator('#columnPicker').isHidden());assert(await page.locator('#columnsToggle').evaluate(el=>el===document.activeElement));
  await page.keyboard.press('Space');assert(await page.locator('#columnPicker').isVisible());
  await page.locator('#columnsAll').click();assert.equal(await page.locator('#ledgerHead th').count(),29);
  await page.locator('#columnPicker').screenshot({path:path.join(out,'columns-desktop.png')});
  await page.locator('#columnsDone').click();
  await page.locator('#inspect').focus();await page.keyboard.press('End');assert.equal(await page.locator('#inspect').inputValue(),'120');
  assert(await page.locator('#chartTooltip').isVisible());assert((await page.locator('#chartTooltip').innerText()).includes('Bills from pay'));
  const chartCard=page.locator('#chartWrap').locator('..');await chartCard.screenshot({path:path.join(out,'chart-month-120-desktop.png')});
  await page.keyboard.press('Escape');assert(await page.locator('#chartTooltip').isHidden());
  await page.setViewportSize({width:390,height:844});await page.locator('#scenarioToggle').click();
  await page.locator('#inspect').focus();await page.keyboard.press('Home');await page.keyboard.press('End');
  await chartCard.screenshot({path:path.join(out,'chart-month-120-mobile.png')});
  await page.locator('#columnsToggle').click();await page.locator('#columnPicker').screenshot({path:path.join(out,'columns-mobile.png')});
  await page.locator('#columnsNone').click();const download=page.waitForEvent('download');await page.locator('#csv').click();const csv=fs.readFileSync(await(await download).path(),'utf8');assert(csv.includes('"120",'));assert(csv.includes('"Bills financed (USD)"'));assert(csv.includes('"Interest capitalized (USD)"'));
  await page.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));assert.equal(await page.locator('#printReport .print-section tbody tr').count(),360);
  await page.reload();assert.equal(await page.locator('#ledgerHead th').count(),29);assert(await page.locator('#columnPicker').isHidden());
  assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
  console.log('V4 ledger/browser PASS: glyph bounds at 1/2/12/120/600 months and 1440/1024/768/390/320px, responsive picker, labeled keyboard controls, Space/Enter/Escape/focus, slider End, screenshots, full CSV/print, reload, zero runtime errors or network requests.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});

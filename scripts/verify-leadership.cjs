const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const base=process.env.SITE_URL || 'http://127.0.0.1:4173/';
(async()=>{
 const browser=await chromium.launch();
 const page=await browser.newPage();
 const out=path.resolve(__dirname,'../test-results');
 fs.mkdirSync(out,{recursive:true});
 for(const width of [320,390,768,1024,1440,1920,2560]){
  await page.setViewportSize({width,height:1200});
  const response=await page.goto(base,{waitUntil:'networkidle'});
  assert.equal(response.status(),200);
  await page.locator('.leadership-pair img').evaluateAll(async images=>{for(const image of images)await image.decode();});
  const cards=await page.locator('.leadership-pair .chair-feature').evaluateAll(els=>els.map(e=>{
   const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};
  }));
  assert.equal(cards.length,2);
  assert(Math.abs(cards[0].y-cards[1].y)<2,'Cards must share a row at '+width);
  assert(Math.abs(cards[0].w-cards[1].w)<2,'Cards must have equal width');
  assert(cards[1].x>=cards[0].x+cards[0].w+8,'Cards must not overlap');
  assert(Math.abs(cards[0].h-cards[1].h)<2,'Cards must have equal height');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  const styles=await page.locator('link[rel="stylesheet"][href^="assets/"]').evaluateAll(els=>els.map(e=>e.getAttribute('href')));
  assert(styles.length>=3 && styles.every(s=>/\?v=[a-f0-9]{12}$/.test(s)),'Styles must have content versions');
  if([390,1440,2560].includes(width)){
   await page.locator('.leadership-section').scrollIntoViewIfNeeded();
   await page.screenshot({path:path.join(out,'leadership-fixed-'+width+'.png')});
  }
 }
 await browser.close();
 console.log('PASS: two aligned, equal-sized, non-overlapping chair cards at seven widths; no overflow; images decode; all local styles versioned. '+base);
})().catch(e=>{console.error(e);process.exit(1)});

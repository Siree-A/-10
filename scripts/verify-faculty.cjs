const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const out=path.join(root,'test-results');
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch();
 const page=await browser.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'faculty.json'),'utf8'));
 assert.equal(manifest.length,32);
 for(const entry of manifest){assert(fs.existsSync(path.join(root,entry.image)));assert(fs.existsSync(path.join(root,entry.original)));}
 for(const width of [320,390,768,1024,1440]){
  await page.setViewportSize({width,height:1000});
  await page.goto('http://127.0.0.1:4173/index.html',{waitUntil:'networkidle'});
  await page.waitForSelector('.faculty-filters:not([hidden])');
  await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'overflow '+width);
  assert.equal(await page.locator('.chair-photo-link img').evaluateAll(imgs=>imgs.length===2&&imgs.every(i=>i.complete&&i.naturalWidth>0)),true);
  if(width===1440 || width===390)await page.screenshot({path:path.join(out,'faculty-home-'+width+'.png')});
  for(const [category,count] of [['advisor-basic',10],['advisor-advanced',6],['co-basic',10],['co-advanced',6]]){
   await page.locator('[data-filter="'+category+'"]').click();
   const seen=new Set();
   while(true){
    const visible=page.locator('.faculty-card:not([hidden])');
    const size=width<=620?1:width<=1000?2:3;
    assert((await visible.count())<=size);
    await visible.locator('img').evaluateAll(async images=>{for(const i of images){i.loading='eager';await i.decode();}});
    for(const group of await visible.evaluateAll(els=>els.map(e=>e.dataset.group)))seen.add(group);
    if(await page.locator('#faculty-next').isDisabled())break;
    await page.locator('#faculty-next').click();
   }
   assert.equal(seen.size,count,category+' '+width);
   await page.locator('[data-filter="'+category+'"]').click();
   assert.equal(await page.locator('#faculty-prev').isDisabled(),true);
  }
  await page.locator('[data-filter="advisor-basic"]').click();
  const first=page.locator('.faculty-card:not([hidden]) .faculty-image-link').first();
  await first.click();
  assert.equal(await page.locator('#faculty-dialog').evaluate(e=>e.open),true);
  assert.equal(await page.locator('#faculty-dialog-title').textContent(),'Advisor Basic · กลุ่มที่ 1');
  await page.locator('#faculty-dialog-image').evaluate(i=>i.decode());
  await page.keyboard.press('ArrowRight');
  assert.equal(await page.locator('#faculty-dialog-title').textContent(),'Advisor Basic · กลุ่มที่ 2');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#faculty-dialog').evaluate(e=>e.open),false);
  assert.equal(await first.evaluate(e=>e===document.activeElement),true);
  await page.locator('#faculty').scrollIntoViewIfNeeded();
  await page.waitForTimeout(150);
  if([390,768,1440].includes(width))await page.screenshot({path:path.join(out,'faculty-gallery-'+width+'.png')});
 }
 await page.setViewportSize({width:1440,height:1000});
 await page.goto('http://127.0.0.1:4173/index.html');
 await page.locator('[data-filter="co-advanced"]').click();
 await page.locator('.faculty-card:not([hidden]) .faculty-image-link').first().click();
 await page.locator('#faculty-dialog-image').evaluate(i=>i.decode());
 await page.screenshot({path:path.join(out,'faculty-lightbox.png')});
 assert.deepEqual(errors,[]);
 await browser.close();
 console.log('PASS: 32 faculty images, correct category counts, all pages, 5 viewport widths, no overflow, full-size viewer, keyboard navigation, Escape and focus restoration.');
})().catch(e=>{console.error(e);process.exit(1)});

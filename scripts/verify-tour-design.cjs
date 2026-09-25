const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
const b=await chromium.launch();const p=await b.newPage({viewport:{width:1440,height:1000}});const errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.goto((process.env.SITE_URL||'http://127.0.0.1:4180')+'/index.html');
await p.locator('#site-tour').waitFor();await p.screenshot({path:'test-results/tour-desktop.png'});
for(let i=0;i<6;i++){assert.equal(await p.locator('#site-tour').getAttribute('data-step'),String(i));assert.ok(await p.locator('#tour-title').innerText());if(i<5)await p.locator('#tour-next').click();}
await p.locator('.tour-guide-button').click();await p.waitForFunction(()=>document.querySelector('#guide-picture img').naturalWidth>0);await p.locator('#guide-zoom').click();assert.ok(await p.locator('#guide-picture').evaluate(e=>e.classList.contains('zoomed')));await p.keyboard.press('Escape');assert.ok(await p.locator('#site-tour').isVisible());assert.equal(await p.evaluate(()=>document.activeElement.className),'tour-guide-button');
await p.locator('#tour-never').check();await p.locator('#tour-next').click();await p.reload();assert.equal(await p.locator('#site-tour').isVisible(),false);await p.locator('.tour-launcher').click();
for(const w of [390,320]){await p.setViewportSize({width:w,height:844});await p.locator('#tour-skip').click();await p.locator('.tour-launcher').click();await p.screenshot({path:`test-results/tour-mobile-${w}.png`});for(let i=0;i<6;i++){assert.ok(await p.locator('#site-tour').evaluate(e=>e.scrollWidth<=e.clientWidth+1),'dialog horizontal overflow');if(i<5)await p.locator('#tour-next').click();}await p.locator('.tour-guide-button').click();await p.locator('#guide-close').click();}
assert.deepEqual(errors,[]);console.log('PASS: six steps, mobile 320/390, guide image/zoom/Escape/focus, never-show and replay');await b.close();
})().catch(e=>{console.error(e);process.exit(1)});

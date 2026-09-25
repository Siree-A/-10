const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch();
 const page=await browser.newPage({viewport:{width:1440,height:1000}});page.setDefaultTimeout(25000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{const Original=window.AudioContext;window.AudioContext=class extends Original{constructor(...a){super(...a);window.testAudio=this;}};});
 await page.goto('http://127.0.0.1:4173/game.html');
 const bank=await page.evaluate(async()=> (await import('./assets/quest-data.js?v=20260925-2')).questions);
 assert.equal(bank.length,64);assert.equal(new Set(bank.map(q=>q.text)).size,64);
 assert.equal(bank.filter(q=>q.source).length,40);
 for(const [i,q] of bank.entries()){assert.equal(q.id,i);assert.equal(q.options.length,3);assert.ok(q.answer>=0&&q.answer<3);assert.ok(q.explanation);if(i>=24)assert.ok(q.source.page>0&&q.source.title);}
 assert.deepEqual([0,1,2,3].map(t=>bank.filter(q=>q.topic===t).length),[16,16,16,16]);
 await page.locator('#student-id').fill('NEON');await page.locator('#student-name').fill('ทดสอบ เมืองวิจัย');await page.locator('#login-form button').click();
 await page.waitForFunction(()=>document.querySelector('#world').dataset.playerZ);
 await page.locator('#sound').click();assert.equal(await page.evaluate(()=>window.testAudio.state),'running');
 await page.locator('#pause').click();await page.waitForFunction(()=>window.testAudio.state==='suspended');
 await page.locator('#resume').click();await page.waitForFunction(()=>window.testAudio.state==='running');
 await page.locator('#sound').click();await page.waitForFunction(()=>window.testAudio.state==='suspended');
 // Cross the reactor to each lab through real path-following, not teleportation.
 for(const i of [0,1,2,3]){
  await page.locator('.station-button').nth(i).click();
  assert.equal(await page.locator('#challenge').isVisible(),false,'no instantaneous teleport');
  await page.locator('#challenge').waitFor({state:'visible',timeout:25000});
  const position=await page.locator('#world').getAttribute('data-player-x');
  assert.ok(Math.abs(+position-(i%2===0?-7:7))<1);
  await page.locator('.answer').first().click();assert.equal(await page.locator('#question-source').isVisible(),true);
  await page.locator('#finish-question').click();
 }
 await page.locator('#new-round').click();
 await page.locator('.game-settings summary').click();await page.locator('#graphics').selectOption('low');
 assert.equal(await page.locator('#world').getAttribute('data-quality'),'low');
 await page.locator('#camera-view').selectOption('overview');await page.locator('#camera-view').selectOption('follow');
 await page.setViewportSize({width:390,height:844});await page.locator('#world').scrollIntoViewIfNeeded();
 const before=+(await page.locator('#world').getAttribute('data-player-x'));
 const left=await page.locator('[data-move="a"]').boundingBox();await page.mouse.move(left.x+20,left.y+20);await page.mouse.down();await page.waitForTimeout(500);await page.mouse.up();
 await page.waitForFunction(x=>+document.querySelector('#world').dataset.playerX<x-.3,before);
 const stopped=await page.locator('#world').getAttribute('data-player-x');await page.waitForTimeout(400);assert.equal(await page.locator('#world').getAttribute('data-player-x'),stopped);
 await page.screenshot({path:'test-results/neon-mobile-controls.png'});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.setViewportSize({width:1440,height:1000});await page.locator('#world').scrollIntoViewIfNeeded();
 await page.locator('#graphics').selectOption('high');await page.locator('#world').scrollIntoViewIfNeeded();await page.waitForTimeout(1000);await page.screenshot({path:'test-results/neon-desktop.png'});
 // Previously released v1 IDs and accumulated XP load without migration/reset.
 await page.locator('#switch-player').click();
 await page.evaluate(()=>localStorage.setItem('research10.quest.v1.LEGACY.legacy',JSON.stringify({version:1,id:'LEGACY',name:'legacy',xp:435,completed:8,crystals:3,bestStreak:3,streak:1,skills:[2,1,2,1],history:[],round:{number:3,questions:[0,6,12,18],done:[0],crystals:[2],bonus:false}})));
 await page.locator('#student-id').fill('LEGACY');await page.locator('#student-name').fill('legacy');await page.locator('#login-form button').click();
 assert.equal(await page.locator('#xp').textContent(),'435 XP');assert.equal(await page.locator('#completed').textContent(),'8');assert.equal(await page.locator('.station-button:disabled').count(),1);
 assert.deepEqual(errors,[]);console.log('PASS: 64 unique questions, 40 page citations, pathfinding to all stations, audio lifecycle, low graphics, mobile movement and legacy saves.');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});

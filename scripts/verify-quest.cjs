const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.env.SITE_URL || 'http://127.0.0.1:4173';
fs.mkdirSync('test-results',{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true});
 const context=await browser.newContext({viewport:{width:1440,height:1050}});
 const page=await context.newPage();const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/game.html');
 await page.waitForFunction(()=>document.querySelector('#world canvas') || document.querySelector('#world-loading').textContent.includes('ไม่ได้'));
 assert.equal(await page.locator('#world canvas').count(),1,'3D canvas initialized');
 assert.equal(await page.locator('#world-loading').isHidden(),true,'WebGL initialization succeeded');
 await page.screenshot({path:'test-results/quest-desktop-welcome.png',fullPage:true});
 await page.locator('#student-id').fill('B08');await page.locator('#student-name').fill('นักวิจัย ทดสอบ');
 await page.locator('#login-form button').click();
 await page.locator('#profile-card').waitFor({state:'visible'});
 const initial = await page.evaluate(()=>JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k=>k.startsWith('research10.quest')))));
 assert.equal(initial.xp,0);
 // Walk across a crystal using keyboard; movement and persistence are real input driven.
 await page.locator('#world').focus();await page.keyboard.down('ArrowDown');await page.waitForTimeout(240);await page.keyboard.up('ArrowDown');
 await page.waitForFunction(()=>document.querySelector('#crystals').textContent==='1');
 await page.locator('#pause').click();assert.equal(await page.locator('#pause-overlay').isVisible(),true);
 assert.equal(await page.locator('.station-button:disabled').count(),4);
 await page.locator('#resume').click();
 // Correct responses from the authored bank, using the shuffled answer identifiers.
 for(let i=0;i<4;i++){
  await page.locator('.station-button').nth(i).click();
  const answer=await page.evaluate(async()=>{
   const {questions}=await import('./assets/quest-data.js');
   return questions.find(q=>q.text===document.querySelector('#question-title').textContent).answer;
  });
  await page.locator(`.answer[data-answer="${answer}"]`).click();
  assert.equal(await page.locator('.answer:disabled').count(),3);
  await page.locator('#finish-question').click();
 }
 assert.equal(await page.locator('#completed').textContent(),'4');
 assert.equal(await page.locator('#xp').textContent(),'255 XP');
 assert.equal(await page.locator('#best-streak').textContent(),'4');
 assert.equal(await page.locator('.badge.earned').count(),3);
 await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
 await page.screenshot({path:'test-results/quest-desktop-playing.png',fullPage:true});
 await page.reload();await page.locator('#student-id').fill('b08');await page.locator('#student-name').fill('นักวิจัย ทดสอบ');await page.locator('#login-form button').click();
 assert.equal(await page.locator('#xp').textContent(),'255 XP');
 assert.equal(await page.locator('.station-button:disabled').count(),4);
 await page.locator('#new-round').click();
 assert.equal(await page.locator('#round').textContent(),'รอบที่ 2');
 const second=await page.evaluate(()=>JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k=>k.startsWith('research10.quest')))));
 second.round.questions.forEach((q,i)=>assert.notEqual(q,initial.round.questions[i]));
 await page.locator('.station-button').first().click();
 await page.keyboard.press('Escape');assert.equal(await page.locator('#challenge').isVisible(),false);
 await page.locator('.station-button').first().click();
 const wrong=await page.evaluate(async()=>{const {questions}=await import('./assets/quest-data.js');return (questions.find(q=>q.text===document.querySelector('#question-title').textContent).answer+1)%3;});
 await page.locator(`.answer[data-answer="${wrong}"]`).click();
 assert.match(await page.locator('#feedback').textContent(),/10 XP/);
 assert.equal(await page.locator('#xp').textContent(),'265 XP');
 await page.screenshot({path:'test-results/quest-feedback.png'});
 await page.locator('#finish-question').click();
 const downloadEvent=page.waitForEvent('download');await page.locator('#export').click();const download=await downloadEvent;
 await download.saveAs('test-results/quest-export.json');assert.equal(JSON.parse(fs.readFileSync('test-results/quest-export.json')).xp,265);
 await page.locator('#switch-player').click();await page.locator('#student-id').fill('B09');await page.locator('#student-name').fill('<img src=x onerror=alert(1)>');await page.locator('#login-form button').click();
 assert.equal(await page.locator('#xp').textContent(),'0 XP');assert.equal(await page.locator('#profile-name img').count(),0);
 for(const width of [320,390,768,820,1024,1280]){
  await page.setViewportSize({width,height:920});await page.waitForTimeout(120);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`overflow at ${width}`);
 }
 await page.setViewportSize({width:390,height:844});
 await page.locator('.menu-toggle').click();assert.equal(await page.locator('#primary-nav a[href="game.html"]').isVisible(),true);await page.locator('.menu-toggle').click();
 await page.locator('#switch-player').click();await page.locator('#student-id').fill('B08');await page.locator('#student-name').fill('นักวิจัย ทดสอบ');await page.locator('#login-form button').click();
 await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
 await page.screenshot({path:'test-results/quest-mobile.png',fullPage:true});
 assert.deepEqual(errors,[]);
 // Failed WebGL/module initialization preserves the full learning game.
 const fallback=await context.newPage();await fallback.route('**/quest-world.js',r=>r.abort());await fallback.goto(base+'/game.html');
 await fallback.locator('#student-id').fill('T01');await fallback.locator('#student-name').fill('Fallback');await fallback.locator('#login-form button').click();
 await fallback.locator('.station-button').first().click();assert.equal(await fallback.locator('#challenge').isVisible(),true);
 // Corrupt saved records are never silently overwritten.
 await page.locator('#switch-player').click();
 await page.evaluate(()=>localStorage.setItem('research10.quest.v1.BAD.corrupt','{bad'));
 await page.locator('#student-id').fill('BAD');await page.locator('#student-name').fill('corrupt');await page.locator('#login-form button').click();
 assert.equal(await page.locator('#login-error').isVisible(),true);
 assert.equal(await page.evaluate(()=>localStorage.getItem('research10.quest.v1.BAD.corrupt')),'{bad');
 // Storage denied: playable in memory, with an explicit export warning.
 const blocked=await browser.newContext({reducedMotion:'reduce'});const memory=await blocked.newPage();
 await memory.addInitScript(()=>{Storage.prototype.getItem=()=>{throw new Error('blocked')};Storage.prototype.setItem=()=>{throw new Error('blocked')};});
 await memory.goto(base+'/game.html');await memory.locator('#student-id').fill('TMP');await memory.locator('#student-name').fill('Temporary');await memory.locator('#login-form button').click();
 assert.equal(await memory.locator('#profile-card').isVisible(),true);
 assert.match(await memory.locator('#save-status').textContent(),/บันทึกในเครื่องไม่ได้/);
 await memory.locator('.station-button').first().click();await memory.locator('.answer').first().click();assert.equal(await memory.locator('#feedback').isVisible(),true);
 await blocked.close();
 for(const route of ['index.html','portfolio.html','documents.html']){
  await page.goto(base+'/'+route);assert.ok(await page.locator('a[href="game.html"]').count(),`navigation on ${route}`);
  for(const width of [820,1024,1280]){await page.setViewportSize({width,height:920});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${route} overflow at ${width}`);}
 }
 console.log('PASS: 3D, movement, collectibles, scoring, combos, rounds, persistence, profile isolation, escaping, export, responsive navigation, fallback and corrupt saves.');
 await browser.close();
})().catch(error=>{console.error(error);process.exit(1);});

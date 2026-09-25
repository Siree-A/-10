const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const base=process.env.SITE_URL||'http://127.0.0.1:4173';
const legacy={version:1,id:'A12',name:'old',xp:435,completed:8,crystals:3,bestStreak:3,streak:1,skills:[2,1,2,1],history:[],round:{number:3,questions:[64,70,78,86],done:[],crystals:[],bonus:false}};
(async()=>{
 const {questions}=await import('../assets/quest-data.js');
 const {dayKey,normalizeCode,recordPractice,rankRows}=await import('../assets/quest-community.js');
 const {insights}=await import('../assets/quest-insights.js');
 assert.equal(questions.length,124);assert.equal(questions.filter(q=>q.id>=64).length,60);
 assert.equal(dayKey('2026-09-24T17:00:00Z'),'2026-09-25');assert.equal(dayKey('2026-09-24T16:59:59Z'),'2026-09-24');assert.equal(normalizeCode(' a1 '),'A01');
 let p={name:'ภญ.ทดสอบ',completed:0};
 const event={at:'2026-09-25T02:00:00Z',type:'mission',xp:40,detail:{question:0,correct:false}};
 recordPractice(p,event);recordPractice(p,{...event,detail:{question:0,correct:true}});
 assert.equal(p.journal['2026-09-25'].points,10);assert.equal(insights(p).axes[0].correct,0);assert.equal(insights(p).axes[1].rate,null);
 recordPractice(p,{...event,at:'2026-09-26T02:00:00Z',detail:{question:0,correct:true}});assert.equal(p.journal['2026-09-26'].points,40);assert.equal(insights(p).total,1);
 for(const q of questions.filter(q=>q.topic===1).slice(0,3))recordPractice(p,{...event,detail:{question:q.id,correct:true}});
 assert.match(insights(p).strength,/100%/);
 assert.deepEqual(rankRows([{code:'A01',daily:40},{code:'B01',daily:40},{code:'A02',daily:10}],'daily').map(r=>r.rank),[1,1,3]);
 assert.equal(rankRows([{code:'A01',daily:40},{code:'B01',daily:40}],'daily','B').length,1);
 const browser=await chromium.launch();const context=await browser.newContext({viewport:{width:1440,height:1050}});await context.route('**/quest-cloud-config.js*',r=>r.fulfill({contentType:'text/javascript',body:"export const cloudConfig={url:'',publishableKey:''}"}));const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/game.html');await page.waitForFunction(()=>document.querySelector('#member-status').textContent.includes('80'));
 const roster=JSON.parse(fs.readFileSync('researchers.json','utf8'));
 for(const id of ['A12','B08','B11','B24','B34']){await page.locator('#student-id').fill(id);assert.equal(await page.locator('#student-name').inputValue(),roster.find(r=>r.code===id).name);}
 assert.equal(await page.locator('#student-name').getAttribute('readonly'),'');
 await page.locator('#student-id').fill('Z99');await page.locator('#login-form button[type=submit]').click();assert.equal(await page.locator('#login-error').isVisible(),true);
 await page.evaluate(v=>{localStorage.setItem('research10.quest.v1.A12.one',JSON.stringify({...v,xp:30}));localStorage.setItem('research10.quest.v1.A12.two',JSON.stringify(v));},legacy);
 await page.locator('#student-id').fill('a12');await page.locator('#login-form button[type=submit]').click();
 assert.equal(await page.locator('#xp').textContent(),'435 XP');assert.equal(await page.locator('#profile-name').textContent(),roster.find(r=>r.code==='A12').name);
 assert.ok(await page.evaluate(()=>localStorage.getItem('research10.quest.v1.A12.two')));
 assert.equal(await page.locator('#join-ranking').isDisabled(),true);assert.match(await page.locator('#ranking-status').textContent(),/เฉพาะเครื่อง/);
 await page.locator('#avatar-style').selectOption('neutral');
 await page.locator('.game-settings summary').click();await page.locator('#quick-mode').check();
 for(let i=0;i<4;i++){await page.locator('.station-button').nth(i).click();assert.equal(await page.locator('.answer').count(),4);const title=await page.locator('#question-title').textContent(),q=questions.find(q=>q.text===title);await page.locator(`.answer[data-answer="${q.answer}"]`).click();assert.match(await page.locator('#question-source').textContent(),/พื้นฐาน/);await page.locator('#finish-question').click();}
 assert.match(await page.locator('#insight-status').textContent(),/4 ข้อ/);assert.equal(await page.locator('#skill-radar circle').count(),4);assert.match(await page.locator('#ranking-podium').textContent(),/160 แต้ม/);
 await page.locator('#radar-angle').fill('20');assert.match(await page.locator('#skill-radar').getAttribute('style'),/20deg/);
 await page.locator('.insights-card').screenshot({path:'test-results/community-insights.png'});
 await page.locator('#open-survey').click();assert.equal(await page.locator('#pause-overlay').isVisible(),true);
 for(let i=0;i<3;i++)await page.locator(`input[name="survey-${i}"][value="4"]`).check();
 await page.locator('#survey-form button[type=submit]').click();assert.match(await page.locator('#survey-status').textContent(),/บันทึกในเครื่องแล้ว/);await page.locator('#close-survey').click();
 const downloaded=page.waitForEvent('download');await page.locator('#export-survey').click();await (await downloaded).saveAs('test-results/reflection.json');const reflection=JSON.parse(fs.readFileSync('test-results/reflection.json','utf8'));assert.equal(reflection.relax,4);assert.equal(reflection.name,undefined);assert.equal(reflection.id,undefined);
 await page.reload();await page.waitForFunction(()=>document.querySelector('#member-status').textContent.includes('80'));await page.locator('#student-id').fill('A12');await page.locator('#login-form button[type=submit]').click();assert.equal(await page.locator('#avatar-style').inputValue(),'neutral');
 for(const width of [320,390,768,1024,1440]){await page.setViewportSize({width,height:1000});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`overflow ${width}`);}
 await page.setViewportSize({width:390,height:844});await page.locator('.insights-card').screenshot({path:'test-results/community-mobile.png'});
 await page.locator('#switch-player').click();await page.locator('#student-id').fill('B08');await page.locator('#login-form button[type=submit]').click();assert.equal(await page.locator('#avatar-style').inputValue(),'long');assert.doesNotMatch(await page.locator('#survey-summary').textContent(),/4\/5/);
 assert.deepEqual(errors,[]);
 // Mock the provider boundary; no live credentials or production writes.
 const cloud=await browser.newContext(),cp=await cloud.newPage();let signup=0,records=[],fail=true;
 await cp.route('**/quest-cloud-config.js*',r=>r.fulfill({contentType:'text/javascript',body:"export const cloudConfig={url:'https://quest-test.supabase.co',publishableKey:'sb_publishable_test'}"}));
 await cp.route('https://quest-test.supabase.co/**',async r=>{const path=new URL(r.request().url()).pathname;let data;if(path==='/auth/v1/signup'){signup++;data={access_token:'test-token',refresh_token:'test-refresh',expires_in:3600};}else if(path.endsWith('quest_board'))data=[{code:'A12',daily:40,total:90}];else if(path.endsWith('quest_reflection_summary'))data={ready:false};else if(path.endsWith('quest_record')){records.push(r.request().postDataJSON());if(fail)return r.fulfill({status:503,body:'{}',contentType:'application/json'});data={accepted:true,added:true};}else data={accepted:true};await r.fulfill({body:JSON.stringify(data),contentType:'application/json'});});
 await cp.goto(base+'/game.html');await cp.waitForFunction(()=>document.querySelector('#ranking-status').textContent.includes('ออนไลน์'));assert.equal(signup,0);
 await cp.locator('#student-id').fill('A12');await cp.locator('#login-form button[type=submit]').click();await cp.locator('#join-ranking').check();await cp.locator('.game-settings summary').click();await cp.locator('#quick-mode').check();await cp.locator('.station-button').first().click();await cp.locator('.answer').first().click();await cp.locator('#finish-question').click();
 await cp.waitForFunction(()=>document.querySelector('#cloud-message').textContent.includes('ยังส่งไม่สำเร็จ'));assert.equal(signup,1);assert.equal(records.length,1);assert.equal(records[0].p_code,'A12');assert.equal(records[0].points,undefined);
 fail=false;await cp.locator('#refresh-ranking').click();await cp.waitForFunction(()=>document.querySelector('#cloud-message').textContent.includes('ส่งแต้มวันนี้แล้ว'));assert.equal(records.length,2);assert.equal(records[0].p_event,records[1].p_event);
 console.log('PASS: 124 questions, first-attempt SWOT, Bangkok rollover, ties, roster autofill, legacy migration, 4 choices, avatar persistence, responsive radar, private survey, opt-in cloud and idempotent retry.');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});

import { topics, questions, levelOf, floorXP, titles } from './quest-data.js?v=community-1';
import { createSoundtrack } from './quest-audio.js?v=20260925-2';
import { dayKey, normalizeCode, ensureJournal, recordPractice } from './quest-community.js?v=community-1';
import { createClub } from './quest-club-ui.js?v=connected-1';

const $ = id => document.getElementById(id);
const PREFIX = 'research10.quest.v1.';
let player = null, playerKey = '', paused = false, scene = null, currentQuestion = null, answered = false;
let sound = false, toastTimer, portrait, worldFailed=false;
const soundtrack=createSoundtrack();
let roster=[], rosterReady=false, club=null;
const MEMBER_PREFIX='research10.quest.member.';
const shuffle = items => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};
const integer = value => Number.isSafeInteger(value) && value >= 0;
function makeRound(number = 1, previous = []) {
  return { number, questions: topics.map((_, i) => {
    const seen=new Set(player?.history.filter(h=>h.type==='mission').map(h=>h.detail.question)||[]);
    const all = questions.filter(q => q.topic === i && !previous.includes(q.id));
    const unseen=all.filter(q=>!seen.has(q.id));
    const pool=unseen.length?unseen:all;
    return pool[Math.floor(Math.random() * pool.length)].id;
  }), done: [], crystals: [], bonus: false };
}
function valid(p) {
  return p?.version === 1 && typeof p.name === 'string' && p.name.length <= 80 && typeof p.id === 'string'
    && ['xp','completed','crystals','bestStreak','streak'].every(k => integer(p[k]))
    && Array.isArray(p.skills) && p.skills.length === 4 && p.skills.every(integer)
    && Array.isArray(p.history) && p.history.length <= 200
    && integer(p.round?.number) && p.round.number > 0 && typeof p.round.bonus === 'boolean'
    && Array.isArray(p.round.questions) && p.round.questions.length === 4
    && p.round.questions.every((id, i) => questions.some(q => q.id === id && q.topic === i))
    && ['done','crystals'].every(k => Array.isArray(p.round[k]) && new Set(p.round[k]).size === p.round[k].length
      && p.round[k].every(n => integer(n) && n < (k === 'done' ? 4 : 12)));
}
function save() {
  if (!player) return;
  try {
    localStorage.setItem(playerKey, JSON.stringify(player));
    $('save-status').textContent = '✓ บันทึกความก้าวหน้าในเบราว์เซอร์นี้แล้ว';
  } catch {
    $('save-status').textContent = 'บันทึกในเครื่องไม่ได้ ขณะนี้เล่นได้เฉพาะครั้งนี้ กรุณาส่งออกประวัติก่อนปิดหน้า';
  }
}
function reward(amount, type, detail) {
  const oldLevel = levelOf(player.xp);
  player.xp += amount;
  const event={ at: new Date().toISOString(), type, detail, xp: amount, totalXP: player.xp };
  player.history.push(event);recordPractice(player,event);
  player.history = player.history.slice(-200);
  save(); render();
  if (levelOf(player.xp) > oldLevel) toast(`เลเวลอัป! LEVEL ${levelOf(player.xp)} ✦`);
}
function toast(message) {
  $('toast').textContent = message; $('toast').classList.add('visible');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').classList.remove('visible'), 3000);
}
function chime(success = true) {
  soundtrack.effect(success?'success':'wrong');
}
function memberKey(id){return MEMBER_PREFIX+encodeURIComponent(id);}
function findStored(id){
  try {
    const current=localStorage.getItem(memberKey(id));
    if(current)return {key:memberKey(id),raw:current};
    // Keep original saves; choose the valid legacy profile with the most XP.
    let best=null, first=null;
    for(let i=0;i<localStorage.length;i++){
      const key=localStorage.key(i);if(!key?.startsWith(PREFIX+encodeURIComponent(id)+'.'))continue;
      const raw=localStorage.getItem(key);first||={key,raw};
      try{const p=JSON.parse(raw);if(valid(p)&&(!best||p.xp>best.xp))best={key,raw,xp:p.xp};}catch{}
    }
    return best||first;
  } catch { /* in-memory play is still available */ }
  return null;
}
async function loadRoster(){
  try{
    const response=await fetch('researchers.json',{cache:'no-cache'});if(!response.ok)throw new Error('roster');
    roster=(await response.json()).filter(item=>/^[AB]\d{2}$/.test(item.code)&&typeof item.name==='string');rosterReady=true;
    $('retry-roster').hidden=true;updateMember();renderRanking();
    $('member-status').textContent=`พบรายชื่อ ${roster.length} คน · กรอกรหัสเพื่อเติมชื่ออัตโนมัติ`;
  }catch{roster=[];rosterReady=false;$('member-status').textContent='โหลดรายชื่อไม่ได้ชั่วคราว กรุณาลองใหม่เพื่อใช้ชื่อที่ถูกต้อง';$('retry-roster').hidden=false;}
}
function updateMember(){
  const id=normalizeCode($('student-id').value);
  const member=roster.find(item=>item.code===id);$('student-name').value=member?.name||'';
  $('student-name').readOnly=true;
  $('member-status').textContent=member?`${member.track==='Advanced'?'Advanced':'Basic'} · กลุ่ม ${member.group} · ชื่อนี้อ้างอิงจากรายชื่อเว็บไซต์`:'ยังไม่พบรหัสนี้ในรายชื่อ A01–A30 / B01–B50';
  return member;
}
function renderRanking(){
  club?.ranking(roster);
}
function render() {
  soundtrack.active(!!player&&!paused&&!document.hidden);
  document.body.classList.toggle('is-playing',!!player);
  $('hud-xp').textContent=player?`${player.xp} XP · LV.${levelOf(player.xp)}`:`${questions.length} ภารกิจความรู้`;
  $('hud-missions').textContent=`${player?.round.done.length||0} / 4 สถานี`;
  $('welcome').hidden = !!player; $('login-card').hidden = !!player; $('profile-card').hidden = !player;
  $('pause').disabled = !player;
  $('fullscreen').disabled=!player;
  $('round').textContent = `รอบที่ ${player?.round.number || 1}`;
  $('round-progress').value = player?.round.done.length || 0;
  $('new-round').hidden = !player || player.round.done.length !== 4;
  $('world-next').hidden=$('new-round').hidden;
  $('interact').hidden=!$('world-next').hidden;
  $('round-status').textContent = player?.round.bonus ? '✓ สำรวจครบแล้ว! รับโบนัส +60 XP' : 'ทำครบ 4 สถานี รับโบนัส +60 XP';
  $('stations').replaceChildren(...topics.map((topic, i) => {
    const button = document.createElement('button');
    button.className = 'station-button'; button.style.setProperty('--station-color', topic.color);
    button.innerHTML = `<span class="station-icon" aria-hidden="true">${topic.icon}</span><span class="station-copy"><strong>${topic.name}</strong><small>${topic.short}</small></span><span class="station-status">${player?.round.done.includes(i) ? '✓ สำเร็จ' : '↗'}</span>`;
    button.disabled = !!player && (paused || player.round.done.includes(i));
    button.addEventListener('click', () => {
      if (!player) { $('student-id').focus(); toast('ใส่เลขที่และชื่อเพื่อเริ่มเล่น'); return; }
      if(scene&&!worldFailed&&!$('quick-mode').checked){$('world').scrollIntoView({block:'center',behavior:'instant'});scene.visit(i);$('world').focus({preventScroll:true});}
      else openChallenge(i);
    });
    return button;
  }));
  renderRanking();club?.update(player);
  if (!player) return;
  const level = levelOf(player.xp), target = floorXP(level + 1);
  $('profile-name').textContent = player.name; $('profile-code').textContent = `RESEARCHER · ${player.id}`;
  $('level').textContent = `LV. ${level}`; $('xp').textContent = `${player.xp.toLocaleString()} XP`;
  $('rank').textContent = titles[Math.min(level - 1, titles.length - 1)];
  $('level-progress').max = target - floorXP(level); $('level-progress').value = player.xp - floorXP(level);
  $('next-level').textContent = `อีก ${(target - player.xp).toLocaleString()} XP สู่เลเวล ${level + 1}`;
  const today=player.journal?.[dayKey()]||{xp:0,missions:0};$('today-xp').textContent=`${today.xp||0} XP`;$('today-missions').textContent=today.missions||0;
  $('avatar-style').value=player.avatar;scene?.style(player.avatar);portrait?.style(player.avatar);
  $('completed').textContent = player.completed; $('crystals').textContent = player.crystals; $('best-streak').textContent = player.bestStreak;
  $('badges').replaceChildren(...[
    ['✦ ก้าวแรก', player.completed > 0], ['◇ ครบทุกทักษะ', player.skills.every(n => n > 0)],
    ['⚡ คอมโบ 3', player.bestStreak >= 3], ['♜ นักวิจัย Lv.5', level >= 5]
  ].map(([label, earned]) => { const badge = document.createElement('span'); badge.className = 'badge' + (earned ? ' earned' : ''); badge.textContent = label; badge.title = earned ? 'ปลดล็อกแล้ว' : 'ยังไม่ปลดล็อก'; return badge; }));
  scene?.sync(player.round);
}
$('student-id').addEventListener('input',updateMember);
$('retry-roster').addEventListener('click',loadRoster);
$('avatar-style').addEventListener('change',()=>{if(player){player.avatar=$('avatar-style').value;save();render();portrait?.wave();}});
$('login-form').addEventListener('submit', event => {
  event.preventDefault();
  const id=normalizeCode($('student-id').value),member=roster.find(item=>item.code===id),name=member?.name;
  if (!rosterReady||!member) {
    $('login-error').hidden = false; $('login-error').textContent = 'กรุณาใช้รหัสในรายชื่อ A01–A30 หรือ B01–B50 และรอโหลดรายชื่อให้สำเร็จ'; return;
  }
  $('login-error').hidden = true;
  playerKey = memberKey(id);
  let restored, stored;
  stored=findStored(id)?.raw;
  try {
    if (stored) { restored = JSON.parse(stored); if (!valid(restored)) throw new Error('Invalid save'); }
  } catch {
    $('login-error').hidden = false;
    $('login-error').textContent = 'อ่านข้อมูลในเครื่องไม่ได้ หากมีข้อมูลเดิม ระบบจะไม่เขียนทับ กรุณาตรวจการอนุญาตพื้นที่จัดเก็บหรือใช้โปรไฟล์ใหม่';
    return;
  }
  if(restored)restored.name=name;
  player = ensureJournal(restored || { version: 1, id, name, xp: 0, completed: 0, crystals: 0, bestStreak: 0, streak: 0, skills: [0,0,0,0], history: [], round: makeRound() });
  player.id=id;player.name=name;
  paused = false; $('pause-overlay').hidden = true; $('pause').textContent = 'พักเกม';
  save(); render(); scene?.reset(); portrait?.wave(); $('world').focus({preventScroll:true});
  toast(restored ? 'ยินดีต้อนรับกลับ! ไปสำรวจต่อกัน' : 'ยินดีต้อนรับสู่ Sky Lab ✦');
});
$('focus-login').addEventListener('click', () => $('student-id').focus());
$('switch-player').addEventListener('click', () => {
  save(); player = null; playerKey = ''; paused = false; scene?.reset();
  $('pause-overlay').hidden = true; $('interact').disabled = true; $('interact').textContent = 'เลือกสถานีด้านขวา →';
  $('student-id').value = ''; $('student-name').value = ''; $('save-status').textContent = '';
  render(); $('student-id').focus();
});
function setPause(value) {
  if (!player) return;
  paused = value; $('pause-overlay').hidden = !paused; $('pause').textContent = paused ? 'เล่นต่อ' : 'พักเกม';
  scene?.stop(); render(); if (!paused) $('world').focus({preventScroll:true});
}
$('pause').addEventListener('click', () => setPause(!paused));
$('resume').addEventListener('click', () => setPause(false));
$('sound').addEventListener('click', async () => { try {sound=await soundtrack.enable(!sound);$('sound').textContent=`เสียง: ${sound?'เปิด':'ปิด'}`;$('sound').setAttribute('aria-pressed',String(sound));chime();}catch{sound=false;$('sound').textContent='เสียงไม่พร้อม';$('sound').setAttribute('aria-pressed','false');} });
$('volume').addEventListener('input',e=>soundtrack.volume(+e.target.value/100));
$('camera-view').addEventListener('change',e=>scene?.view(e.target.value));
$('graphics').addEventListener('change',e=>scene?.quality(e.target.value));
$('jump').addEventListener('click',()=>scene?.jump());
document.querySelectorAll('[data-move]').forEach(button=>{
  const key=button.dataset.move;
  button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);scene?.input(key,true);});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,()=>scene?.input(key,false));
  button.addEventListener('keydown',e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();scene?.input(key,true);}});
  button.addEventListener('keyup',()=>scene?.input(key,false));button.addEventListener('blur',()=>scene?.input(key,false));
});
$('fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.querySelector('.world-card').requestFullscreen();}catch{toast('เบราว์เซอร์นี้ไม่รองรับเต็มจอ ใช้มุมกล้องติดตามแทนได้');}});
$('new-round').addEventListener('click', () => {
  if (!player || paused || player.round.done.length !== 4) return;
  player.round = makeRound(player.round.number + 1, player.round.questions); save(); render(); scene?.reset();
  toast('การค้นพบครั้งใหม่เริ่มแล้ว ✦'); $('world').focus({preventScroll:true});
});
$('export').addEventListener('click', () => {
  if (!player) return;
  const data = { ...player, exportedAt: new Date().toISOString(), note: 'Local practice progress; not authenticated or certified.' };
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], {type:'application/json'}));
  const link = document.createElement('a'); link.href = url; link.download = `research-quest-${player.id}-${new Date().toISOString().slice(0,10)}.json`;
  link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
});
function openChallenge(topicIndex) {
  if (!player || paused || $('challenge').open || player.round.done.includes(topicIndex)) return;
  scene?.stop();
  currentQuestion = questions[player.round.questions[topicIndex]]; answered = false;
  $('question-topic').textContent = `${topics[topicIndex].short} / ${topics[topicIndex].name}`;
  $('question-title').textContent = currentQuestion.text;
  $('question-source').hidden=true;
  $('feedback').hidden = true; $('finish-question').hidden = true;
  $('answers').replaceChildren(...shuffle(currentQuestion.options.map((text, index) => ({text,index}))).map((option, i) => {
    const button = document.createElement('button'); button.className = 'answer';
    const number = document.createElement('b'); number.textContent = ['A','B','C','D'][i];
    const label = document.createElement('span'); label.textContent = option.text;
    button.append(number,label); button.dataset.answer = option.index;
    button.addEventListener('click', () => submitAnswer(option.index, button)); return button;
  }));
  $('challenge').showModal();
}
function submitAnswer(index, button) {
  if (answered || !player) return; answered = true;
  const correct = index === currentQuestion.answer, topic = currentQuestion.topic;
  player.streak = correct ? player.streak + 1 : 0;
  player.bestStreak = Math.max(player.bestStreak, player.streak);
  const combo = correct ? Math.min(20, (player.streak - 1) * 5) : 0;
  const earned = correct ? 40 + combo : 10;
  player.round.done.push(topic); player.completed++; if (correct) player.skills[topic]++;
  $('answers').querySelectorAll('button').forEach(answer => { answer.disabled = true; if (+answer.dataset.answer === currentQuestion.answer) answer.classList.add('correct'); });
  if (!correct) button.classList.add('wrong');
  let bonus = 0;
  if (player.round.done.length === 4 && !player.round.bonus) { player.round.bonus = true; bonus = 60; }
  reward(earned + bonus, 'mission', { question: currentQuestion.id, answer:index, correct, round: player.round.number, combo, roundBonus: bonus });
  club?.event(player,{kind:'mission',item:currentQuestion.id,answer:index});
  $('feedback').replaceChildren();
  const heading = document.createElement('strong'); heading.textContent = correct ? `ถูกต้อง! +${earned} XP${combo ? ` · คอมโบ ${player.streak}` : ''}` : 'ได้เรียนรู้เพิ่มแล้ว +10 XP';
  const explanation = document.createElement('span'); explanation.textContent = currentQuestion.explanation + (bonus ? ' ✦ สำรวจครบ 4 สถานี รับโบนัสรอบ +60 XP!' : '');
  $('feedback').append(heading, explanation); $('feedback').hidden = false; $('finish-question').hidden = false;
  $('question-source').textContent=currentQuestion.source?`ที่มา: ${currentQuestion.source.title} · ${currentQuestion.source.page?'หน้า '+currentQuestion.source.page+' (PDF)':currentQuestion.source.section+' ข้อ '+currentQuestion.source.question}`:'โจทย์ฝึกพื้นฐานที่จัดทำสำหรับเกม';
  $('question-source').hidden=false;
  if(correct)scene?.celebrate();
  chime(correct); $('finish-question').focus();
}
$('finish-question').addEventListener('click', () => $('challenge').close());
$('challenge').addEventListener('close', () => { currentQuestion = null; scene?.stop(); $('world').focus({preventScroll:true}); });
$('interact').addEventListener('click', () => { const near = scene?.nearest(); if (near !== undefined && near !== null) openChallenge(near); });
window.addEventListener('storage', event => {
  if (player && (event.key === playerKey || event.key === null)) {
    player = null; playerKey = ''; paused = false; $('challenge').close(); scene?.reset(); $('pause-overlay').hidden = true;
    render(); $('interact').disabled = true;
    $('save-status').textContent = 'ข้อมูลถูกเปลี่ยนจากแท็บอื่น กรุณาใส่เลขที่และชื่ออีกครั้งเพื่ออ่านความก้าวหน้าล่าสุด';
  }
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { soundtrack.active(false);scene?.stop(); if (player && !$('challenge').open) setPause(true); }
  else soundtrack.active(!!player&&!paused);
});
$('world-next').addEventListener('click',()=>$('new-round').click());
window.addEventListener('blur', () => scene?.stop());
club=createClub({getPlayer:()=>player,getRoster:()=>roster,pause:()=>setPause(true),save,toast});
loadRoster();
render();

// Dynamically loaded so the learning flow remains available without WebGL.
try {
  const { createLab } = await import('./quest-world.js?v=community-1');
  scene = createLab($('world'), {
    active: () => !!player && !paused && !$('challenge').open && !$('satisfaction').open,
    playing:()=>!!player,
    inspect:toast,
    effect:kind=>soundtrack.effect(kind),
    quality:text=>$('quality-status').textContent=text,
    position:(x,z)=>{$('map-player').style.left=`${(x+11.5)/23*100}%`;$('map-player').style.top=`${(z+8.5)/17*100}%`;},
    open: openChallenge,
    collect: id => {
      if (!player || paused || player.round.crystals.includes(id)) return;
      player.round.crystals.push(id); player.crystals++;
      reward(5, 'crystal', {id, round:player.round.number}); toast('✧ ผลึกความรู้ +5 XP'); chime();
      club?.event(player,{kind:'crystal',item:id,answer:null});
    },
    nearby: index => {
      const available = player && !paused && index !== null && !player.round.done.includes(index);
      $('interact').disabled = !available;
      $('interact').textContent = available ? `E · ${topics[index].name}` : 'เดินไปใกล้สถานี';
    },
    failed: () => { worldFailed=true;$('world-loading').hidden = false; $('world-loading').textContent = 'ภาพ 3 มิติหยุดทำงาน รีโหลดหน้าเพื่อลองใหม่ หรือเล่นผ่านรายการสถานีได้'; }
  });
  $('world-loading').hidden = true;
  if (player) {scene.sync(player.round);scene.style(player.avatar);}
} catch {
  $('world-loading').textContent = 'เครื่องนี้เปิดภาพ 3 มิติไม่ได้ แต่ยังทำภารกิจผ่านรายการสถานีได้';
  $('world-loading').style.top = '70%';
}

// The portrait is optional: a failed portrait never disables the world or quizzes.
try {
  const { createPortrait } = await import('./quest-avatar.js?v=community-1');
  portrait = createPortrait($('avatar-preview'), () => !!player && !paused && !$('challenge').open);
  if (player) {portrait.style(player.avatar);portrait.wave();}
} catch {
  $('avatar-preview').hidden = true;
}

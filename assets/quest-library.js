import {questions,topics} from './quest-data.js?v=community-1';
export function createLibrary({getPlayer,open,toast}){
 const section=document.createElement('section');section.className='question-atlas';section.id='question-atlas';
 section.innerHTML=`<div class="club-header"><div><p class="panel-kicker">124 DISCOVERIES · YOUR OWN PACE</p><h2>แผนที่โจทย์ทั้งหมด ✨</h2><p>4 สถานีคือ 4 หมวด ไม่ใช่มีแค่ 4 ข้อ! เล่นรอบใหม่ในเมือง หรือเลือกโจทย์จากแผนที่นี้ได้เลย</p></div><button class="primary" id="continue-discovery">เล่นข้อใหม่ถัดไป →</button></div><p id="atlas-progress" role="status"></p><progress id="atlas-meter" max="124" value="0" aria-label="จำนวนโจทย์ที่เคยทำ"></progress><div class="atlas-filters"><label>หมวด <select id="atlas-topic"><option value="all">ทั้งหมด 4 หมวด</option>${topics.map((t,i)=>`<option value="${i}">${t.name}</option>`).join('')}</select></label><label>แสดง <select id="atlas-state"><option value="all">ทุกข้อ</option><option value="new">ยังไม่เคยทำ</option><option value="done">เคยทำแล้ว</option></select></label><span id="atlas-count"></span></div><div id="atlas-questions" class="atlas-questions"></div><p class="club-note">✓ = เคยตอบแล้ว · การทบทวนยังได้ XP แต่แต้มอันดับนับคำตอบแรกต่อข้อในแต่ละวันเหมือนเดิม การเล่นจากแผนที่ไม่เปลี่ยนความคืบหน้ารอบเดินสำรวจ</p>`;
 document.querySelector('.insights-card').before(section);
 const $=id=>document.getElementById(id);
 const seen=()=>new Set([...Object.keys(getPlayer()?.evidence||{}).map(Number),...(getPlayer()?.history||[]).filter(e=>e.type==='mission').map(e=>e.detail.question)]);
 function pool(){const topic=$('atlas-topic').value;return questions.filter(q=>topic==='all'||q.topic===+topic);}
 function play(q){if(!getPlayer()){toast('กรอกรหัสเพื่อเริ่มเล่นก่อนนะ');$('student-id').focus();return;}open(q);}
 function next(){const done=seen(),q=pool().find(q=>!done.has(q.id));if(q)play(q);else section.scrollIntoView({block:'start',behavior:'instant'});}
 function update(){const done=seen(),state=$('atlas-state').value,list=pool().filter(q=>state==='all'||(state==='done')===done.has(q.id));$('atlas-progress').textContent=`ค้นพบแล้ว ${done.size} / ${questions.length} ข้อ · เหลือ ${questions.length-done.size} ข้อใหม่`;$('atlas-meter').value=done.size;$('atlas-count').textContent=`แสดง ${list.length} ข้อ`;
 const remaining=pool().some(q=>!done.has(q.id));$('continue-discovery').disabled=!remaining;$('continue-discovery').textContent=remaining?'เล่นข้อใหม่ถัดไป →':'ค้นพบครบหมวดที่เลือกแล้ว ✓';
 $('atlas-questions').replaceChildren(...list.map(q=>{const b=document.createElement('button');b.className='atlas-question'+(done.has(q.id)?' discovered':'');b.type='button';b.textContent=`${done.has(q.id)?'✓':'◇'} ${String(q.id+1).padStart(3,'0')}`;b.title=q.text;b.setAttribute('aria-label',`ข้อ ${q.id+1} ${done.has(q.id)?'เคยทำแล้ว':'ยังไม่เคยทำ'}: ${q.text}`);b.style.setProperty('--topic',topics[q.topic].color);b.onclick=()=>play(q);return b;}));
 }
 $('continue-discovery').onclick=next;$('atlas-topic').onchange=update;$('atlas-state').onchange=update;
 return {update,next};
}

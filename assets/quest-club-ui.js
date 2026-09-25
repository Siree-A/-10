import {dayKey,localBoard,rankRows} from './quest-community.js?v=community-1';
import {configured,rpc,readRpc} from './quest-cloud.js?v=connected-1';
import {insights,radar} from './quest-insights.js?v=community-1';
const $=id=>document.getElementById(id),SURVEY='research10.quest.reflection.';
const text=(tag,value,cls)=>{const el=document.createElement(tag);el.textContent=value;if(cls)el.className=cls;return el;};
export function createClub(hooks){
  let period='daily',track='all',onlineRows=null,onlineMessage='',busy=false,refreshing=false,surveyBusy=false,activePlayer=null,breakTimer,breakEnd=0;
  function ranking(){
    const roster=hooks.getRoster(),members=new Map(roster.map(m=>[m.code,m]));
    let rows=onlineRows||localBoard(roster);
    const p=hooks.getPlayer();if(!onlineRows&&p&&!rows.some(r=>r.code===p.id))rows=[...rows,{code:p.id,daily:p.journal?.[dayKey()]?.points||0,total:Object.values(p.journal||{}).reduce((s,d)=>s+d.points,0)}];
    rows=rankRows(rows,period,track).filter(r=>members.has(r.code));
    $('ranking-date').textContent=period==='daily'?`วันที่ ${dayKey()} · เวลาไทย`:'สะสมตั้งแต่เริ่มใช้ระบบอันดับ';
    $('ranking-status').textContent=onlineRows?'อันดับรวมออนไลน์ · อัปเดตอัตโนมัติทุก 30 วินาที':onlineMessage||'อันดับเฉพาะเครื่องนี้ · ยังไม่เชื่อมฐานข้อมูลกลาง';
    $('ranking-empty').hidden=rows.length>0;
    $('ranking-podium').replaceChildren(...rows.slice(0,3).map(r=>{const el=text('div','',`podium-place place-${r.rank}`);el.append(text('b',['','🥇','🥈','🥉'][r.rank]||'✦'),text('strong',r.code),text('span',members.get(r.code).name),text('em',`${r[period]} แต้ม · อันดับ ${r.rank}`));return el;}));
    $('ranking-list').replaceChildren(...rows.slice(3).map(r=>{const el=text('li','');el.append(text('b',r.rank),text('span',`${r.code} · ${members.get(r.code).name}`),text('em',r[period]));return el;}));
  }
  async function refresh(){
    if(!configured){ranking();return;}
    if(refreshing)return;refreshing=true;
    $('refresh-ranking').disabled=true;
    try{const rows=await readRpc('quest_board');if(!Array.isArray(rows)||rows.some(r=>!Number.isFinite(r.daily)||!Number.isFinite(r.total)))throw Error();onlineRows=rows;onlineMessage='';}
    catch{onlineRows=null;onlineMessage='โหลดอันดับออนไลน์ไม่สำเร็จ · ขณะนี้แสดงเฉพาะเครื่องนี้';}
    finally{$('refresh-ranking').disabled=false;ranking();refreshing=false;}
    try{const s=await readRpc('quest_reflection_summary');$('community-reflection').textContent=s.ready?`ภาพรวม 30 วัน · ${s.responses} แบบประเมิน · ผ่อนคลาย ${s.relax}/5 · เข้าใจ ${s.learn}/5 · พึงพอใจ ${s.satisfaction}/5`:'ภาพรวมความคิดเห็นจะแสดงเมื่อมีอย่างน้อย 5 บัญชีผู้เล่นนิรนาม';}catch{$('community-reflection').textContent='ยังโหลดภาพรวมความคิดเห็นออนไลน์ไม่ได้';}
  }
  async function flush(p){
    if(busy||!configured||!p.cloudJoin||!p.outbox?.length)return;busy=true;
    try{
      while(p.outbox?.length&&p.cloudJoin){
        const e=p.outbox[0];
        if(e.day!==dayKey()){p.outbox.shift();if(p===hooks.getPlayer()){hooks.save();$('cloud-message').textContent='รายการออฟไลน์ข้ามวันเก็บเป็น XP ส่วนตัว ไม่ย้อนเพิ่มอันดับออนไลน์';}continue;}
        await rpc('quest_record',{p_event:e.id,p_code:p.id,p_day:e.day,p_kind:e.kind,p_item:e.item,p_answer:e.answer});
        p.outbox.shift();if(p===hooks.getPlayer())hooks.save();
      }
      if(p===hooks.getPlayer())$('cloud-message').textContent='✓ ส่งแต้มวันนี้แล้ว · เซิร์ฟเวอร์ตรวจคำตอบและตัดรายการซ้ำ';
      await refresh();
    }catch{if(p===hooks.getPlayer())$('cloud-message').textContent=`รอส่ง ${p.outbox?.length||0} รายการ · ระบบจะลองใหม่อัตโนมัติเมื่อออนไลน์ภายในวันนี้`;}
    finally{busy=false;}
  }
  function event(p,e){if(!configured||!p.cloudJoin)return;p.outbox||=[];if(p.outbox.length>=150){$('cloud-message').textContent='คิวเต็ม กรุณาเชื่อมต่อและรีเฟรชก่อนส่งเพิ่ม';return;}p.outbox.push({...e,id:crypto.randomUUID(),day:dayKey()});hooks.save();flush(p);}
  $('join-ranking').disabled=!configured;
  $('login-online').disabled=!configured;if(!configured)$('login-online').checked=false;
  $('share-survey').disabled=!configured;
  $('share-survey').addEventListener('change',()=>{const p=hooks.getPlayer();if(p){p.shareSurvey=$('share-survey').checked;if(!p.shareSurvey)delete p.pendingReflection;hooks.save();}});
  $('cloud-message').textContent=configured?'เลือกเข้าร่วมก่อนเริ่มเก็บแต้มออนไลน์':'ผู้ดูแลกำลังเตรียมระบบอันดับรวม ขณะนี้เล่นและเก็บผลในเครื่องได้';
  $('join-ranking').addEventListener('change',()=>{const p=hooks.getPlayer();if(!p){$('join-ranking').checked=false;hooks.toast('กรอกรหัสและเริ่มเล่นก่อนเข้าร่วมอันดับ');return;}p.cloudJoin=$('join-ranking').checked;hooks.save();if(p.cloudJoin)flush(p);});
  $('refresh-ranking').addEventListener('click',()=>{const p=hooks.getPlayer();if(p?.outbox?.length)flush(p);else refresh();});
  document.querySelectorAll('[data-period]').forEach(b=>b.addEventListener('click',()=>{period=b.dataset.period;document.querySelectorAll('[data-period]').forEach(t=>t.setAttribute('aria-pressed',String(t===b)));ranking();}));
  $('ranking-track').addEventListener('change',e=>{track=e.target.value;ranking();});
  const prompts=['เล่นแล้วรู้สึกผ่อนคลายเพียงใด?','รู้สึกเข้าใจเรื่องงานวิจัยเพิ่มขึ้นเพียงใด?','พึงพอใจกับประสบการณ์เล่นโดยรวมเพียงใด?'];
  $('survey-questions').replaceChildren(...prompts.map((prompt,i)=>{const f=text('fieldset','');f.append(text('legend',prompt));const row=text('div','','rating-row');for(let n=1;n<=5;n++){const label=text('label',''),input=document.createElement('input');input.type='radio';input.name='survey-'+i;input.value=n;input.required=true;label.append(input,text('span',n));row.append(label);}f.append(row);return f;}));
  function savedSurvey(){try{return JSON.parse(localStorage.getItem(SURVEY+hooks.getPlayer()?.id)||'null');}catch{return null;}}
  function surveySummary(){const last=surveyValues||savedSurvey();$('survey-summary').textContent=last?`บันทึกล่าสุด ${last.day} · ผ่อนคลาย ${last.relax}/5 · เข้าใจ ${last.learn}/5 · พึงพอใจ ${last.satisfaction}/5`:'ช่วยบอกความรู้สึกหลังเล่น เพื่อออกแบบกิจกรรมครั้งต่อไป';}
  $('open-survey').addEventListener('click',()=>{if(!hooks.getPlayer()){hooks.toast('เริ่มเล่นด้วยรหัสของคุณก่อนประเมิน');return;}hooks.pause();$('survey-status').textContent='';$('satisfaction').showModal();});
  $('close-survey').addEventListener('click',()=>$('satisfaction').close());
  async function sendReflection(p){
    if(!configured||surveyBusy||!p.shareSurvey||!p.pendingReflection)return;
    const record=p.pendingReflection;
    if(record.day!==dayKey()){delete p.pendingReflection;if(p===hooks.getPlayer())hooks.save();return;}
    surveyBusy=true;
    try{await rpc('quest_reflect',{p_relax:record.relax,p_learn:record.learn,p_satisfaction:record.satisfaction,p_topic:record.topic});if(p.pendingReflection===record)delete p.pendingReflection;if(p===hooks.getPlayer()){hooks.save();$('survey-status').textContent='✓ ส่งความคิดเห็นแล้ว ขอบคุณที่ช่วยพัฒนาเกม';} }
    catch{if(p===hooks.getPlayer())$('survey-status').textContent='รอส่งความคิดเห็น · ระบบจะลองใหม่อัตโนมัติภายในวันนี้';}
    finally{surveyBusy=false;}
  }
  $('survey-form').addEventListener('submit',async e=>{
    e.preventDefault();const p=hooks.getPlayer();if(!p)return;const f=new FormData(e.target),record={day:dayKey(),relax:+f.get('survey-0'),learn:+f.get('survey-1'),satisfaction:+f.get('survey-2'),topic:f.get('topic')||$('survey-topic').value};
    if(![record.relax,record.learn,record.satisfaction].every(v=>Number.isInteger(v)&&v>=1&&v<=5))return;
    let stored=false;try{localStorage.setItem(SURVEY+p.id,JSON.stringify(record));stored=true;}catch{}
    surveyValues=record;
    $('survey-status').textContent=stored?'✓ บันทึกในเครื่องแล้ว ขอบคุณที่ช่วยพัฒนาเกม':'บันทึกในเครื่องไม่ได้ กรุณาส่งออกผลก่อนปิดหน้า';surveySummary();
    p.shareSurvey=$('share-survey').checked;if(p.shareSurvey&&configured){p.pendingReflection=record;hooks.save();const submit=e.target.querySelector('[type=submit]');submit.disabled=true;await sendReflection(p);submit.disabled=false;}
  });
  let surveyValues=null;
  $('export-survey').addEventListener('click',()=>{const record=savedSurvey()||surveyValues;if(!record){hooks.toast('ยังไม่มีผลประเมินให้ส่งออก');return;}const url=URL.createObjectURL(new Blob([JSON.stringify(record,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='research-quest-reflection.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
  function stopBreak(){clearInterval(breakTimer);breakTimer=null;document.querySelector('.breath-orb').classList.remove('breathing');$('take-break').textContent='พักสบาย ๆ 30 วินาที';$('breath-text').textContent='พักครบแล้ว หรือพร้อมเมื่อไหร่ก็ค่อยกลับไปสำรวจ 🌱';}
  $('take-break').addEventListener('click',()=>{if(breakTimer){stopBreak();return;}hooks.pause();breakEnd=Date.now()+30000;document.querySelector('.breath-orb').classList.add('breathing');$('take-break').textContent='จบช่วงพัก';const tick=()=>{const seconds=Math.max(0,Math.ceil((breakEnd-Date.now())/1000));$('breath-text').textContent=`คลายไหล่ มองไกล ๆ หายใจในจังหวะที่สบาย · ${seconds} วินาที`;if(!seconds)stopBreak();};tick();breakTimer=setInterval(tick,1000);});
  function update(p){
    if(activePlayer!==p){activePlayer=p;surveyValues=null;$('survey-form').reset();$('join-ranking').checked=!!p?.cloudJoin;$('share-survey').checked=configured&&p?.shareSurvey!==false;surveySummary();if(p){p.shareSurvey??=true;$('cloud-message').textContent=p.cloudJoin?'ส่งแต้มให้อัตโนมัติหลังเล่น · เปลี่ยนตัวเลือกได้ตลอด':'เล่นเฉพาะเครื่อง · เปิดส่งแต้มอัตโนมัติได้เมื่อต้องการ';if(p.cloudJoin)flush(p);sendReflection(p);}}
    const data=insights(p);radar($('skill-radar'),data);
    $('insight-status').textContent=p?`อิงคำตอบแรก ${data.total} ข้อ · อย่างน้อย 3 ข้อต่อหมวดจึงเริ่มสรุป${data.partial?' · XP เก่าคงอยู่ แต่เริ่มหลักฐานทักษะจากเวอร์ชันนี้':''}`:'กรอกรหัสและเล่นเพื่อสร้างแผนที่ทักษะของคุณ';
    $('skill-values').replaceChildren(...data.axes.map(a=>{const li=text('li','');li.append(text('strong',a.name),text('span',a.rate===null?'ยังไม่มีข้อมูล':`${a.rate}% · ถูก ${a.correct}/${a.total} ข้อ${a.total<3?' · ข้อมูลน้อย':''}`));return li;}));
    for(const key of ['strength','weakness','opportunity','threat','strategy'])$('insight-'+key).textContent=data[key];
  }
  $('radar-angle').addEventListener('input',e=>$('skill-radar').style.transform=`perspective(700px) rotateY(${e.target.value}deg)`);
  ranking();refresh();
  const sync=()=>{if(document.hidden||!navigator.onLine)return;const p=hooks.getPlayer();if(p){flush(p);sendReflection(p);}refresh();};
  setInterval(sync,30000);window.addEventListener('online',sync);document.addEventListener('visibilitychange',()=>{if(!document.hidden)sync();});
  return {ranking,update,event};
}

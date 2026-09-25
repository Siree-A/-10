export const dayKey=(at=Date.now())=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Bangkok',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(at));
export const normalizeCode=value=>value.trim().toUpperCase().replace(/^([AB])(\d)$/,(_,a,n)=>a+'0'+n);
export function defaultAvatar(name){return /^(ภญ\.|นางสาว|นาง)/.test(name)?'long':/^ภก\./.test(name)?'short':'neutral';}
export function ensureJournal(p){
  if(!p.journal||typeof p.journal!=='object'||Array.isArray(p.journal))p.journal={};
  for(const [day,row] of Object.entries(p.journal)){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||!row||!['xp','missions','correct','points'].every(k=>Number.isSafeInteger(row[k])&&row[k]>=0)||!Array.isArray(row.questions)||!Array.isArray(row.crystals))delete p.journal[day];
  }
  p.avatar=['short','long','neutral'].includes(p.avatar)?p.avatar:defaultAvatar(p.name);
  if(!p.evidence||typeof p.evidence!=='object'||Array.isArray(p.evidence)){p.evidence={};p.evidencePartial=p.completed>0;}
  if(!Array.isArray(p.outbox))p.outbox=[];
  return p;
}
export function recordPractice(p,event){
  ensureJournal(p);const day=dayKey(event.at);
  const row=p.journal[day]||={xp:0,missions:0,correct:0,points:0,questions:[],crystals:[]};
  row.xp+=event.xp;
  if(event.type==='mission'){
    if(!Object.hasOwn(p.evidence,event.detail.question))p.evidence[event.detail.question]={correct:event.detail.correct,at:event.at};
    row.missions++;if(event.detail.correct)row.correct++;
    if(!row.questions.includes(event.detail.question)){row.questions.push(event.detail.question);row.points+=event.detail.correct?40:10;}
  }else if(event.type==='crystal'&&!row.crystals.includes(event.detail.id)){row.crystals.push(event.detail.id);row.points+=5;}
}
export function localBoard(roster,storage){
  const records=new Map();
  try{storage||=localStorage;
  for(let i=0;i<storage.length;i++){
    const key=storage.key(i);if(!key.startsWith('research10.quest.member.'))continue;
    try{const p=JSON.parse(storage.getItem(key));if(!roster.some(r=>r.code===p.id))continue;
      const days=Object.values(p.journal||{}),today=p.journal?.[dayKey()];
      records.set(p.id,{code:p.id,total:days.reduce((s,d)=>s+(Number.isSafeInteger(d.points)?d.points:0),0),daily:today?.points||0});
    }catch{/* Ignore unreadable unrelated records without replacing them. */}
  }
  }catch{/* Storage unavailable: do not break the game. */}
  return [...records.values()];
}
export function rankRows(rows,period,track='all'){
  let last=null,rank=0;
  return rows.filter(r=>(track==='all'||r.code.startsWith(track))&&r[period]>0)
    .sort((a,b)=>b[period]-a[period]||a.code.localeCompare(b.code))
    .map((r,i)=>{if(r[period]!==last){rank=i+1;last=r[period];}return {...r,rank};});
}

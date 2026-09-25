import {topics,questions} from './quest-data.js?v=community-1';
// Deterministic learning reflections, not an AI diagnosis or certified ability score.
export function insights(player){
  const axes=topics.map((t,i)=>({...t,total:0,correct:0,rate:null,index:i}));
  for(const [id,event] of Object.entries(player?.evidence||{})){
    const q=questions.find(q=>q.id===+id);if(!q||typeof event?.correct!=='boolean')continue;
    const a=axes[q.topic];a.total++;if(event.correct)a.correct++;
  }
  axes.forEach(a=>{a.rate=a.total?Math.round(a.correct/a.total*100):null;});
  const sufficient=axes.filter(a=>a.total>=3),strong=sufficient.filter(a=>a.rate>=70),weak=sufficient.filter(a=>a.rate<70),unknown=axes.filter(a=>a.total<3);
  const total=axes.reduce((n,a)=>n+a.total,0),weakest=[...sufficient].sort((a,b)=>a.rate-b.rate)[0];
  return {axes,total,
    strength:strong.length?strong.map(a=>`${a.name}: ถูก ${a.correct}/${a.total} ข้อ (${a.rate}%)`).join(' · '):'ยังไม่มีหมวดที่มีคำตอบอย่างน้อย 3 ข้อและถูก ≥70% ลองสำรวจเพิ่มอีกนิด',
    weakness:weak.length?weak.map(a=>`${a.name}: ควรทบทวนอีกครั้ง (${a.correct}/${a.total} ข้อ)`).join(' · '):'ยังไม่พบหมวดที่เข้าเกณฑ์ทบทวนจากข้อมูลที่เพียงพอ ไม่ได้หมายความว่าไม่มีจุดที่พัฒนาได้',
    opportunity:unknown.length?`เก็บข้อมูลเพิ่มใน ${unknown.map(a=>a.name).join(' / ')} ให้ครบอย่างน้อยหมวดละ 3 ข้อใหม่`:'ลองอธิบายเหตุผลของคำตอบให้เพื่อนฟัง แล้วนำแนวคิดไปใช้กับโจทย์งานประจำหนึ่งเรื่อง',
    threat:'การจำเฉลยและความต่างของความยากอาจทำให้ภาพดูดีกว่าความเข้าใจจริง กราฟจึงใช้เฉพาะคำตอบแรกของแต่ละข้อ และไม่ใช้เปรียบเทียบรับรองความสามารถ',
    strategy:unknown.length?`WO · เริ่มที่ “${unknown[0].name}” อีก ${3-unknown[0].total} ข้อใหม่ อ่านเหตุผลในเฉลยแล้วสรุปด้วยคำของตนเอง`:
      weakest?.rate<70?`WT · ฝึก “${weakest.name}” รอบละหนึ่งข้อ จดเหตุผลที่ตัวเลือกอื่นไม่เหมาะสม และพักเมื่อรู้สึกล้า`:
      'SO · ใช้หมวดที่ถนัดออกแบบคำถามจากงานจริง แล้วชวนเพื่อนแลกเปลี่ยนเหตุผลและตรวจแหล่งอ้างอิง',
    partial:!!player?.evidencePartial};
}
const NS='http://www.w3.org/2000/svg';
export function radar(container,data){
  container.replaceChildren();const svg=document.createElementNS(NS,'svg');svg.setAttribute('viewBox','0 0 400 340');svg.setAttribute('role','img');
  const title=document.createElementNS(NS,'title');title.textContent='กราฟแมงมุมสัดส่วนตอบถูกครั้งแรก 4 ทักษะ ดูค่าจริงและจำนวนข้อในตารางด้านล่าง';svg.append(title);
  const point=(i,r,z=0)=>{const a=i*Math.PI/2-Math.PI/2;return [200+Math.cos(a)*r,176+Math.sin(a)*r*.72-z];};
  const poly=(pts,fill,stroke,width=1)=>{const p=document.createElementNS(NS,'polygon');p.setAttribute('points',pts.map(p=>p.join(',')).join(' '));p.setAttribute('fill',fill);p.setAttribute('stroke',stroke);p.setAttribute('stroke-width',width);svg.append(p);};
  for(const z of [0,20])for(const r of [30,60,90,120,150])poly([0,1,2,3].map(i=>point(i,r,z)),'none',z?'#6298bf55':'#6298bf20');
  for(let i=0;i<4;i++){const l=document.createElementNS(NS,'line'),a=point(i,0,20),b=point(i,150,20);l.setAttribute('x1',a[0]);l.setAttribute('y1',a[1]);l.setAttribute('x2',b[0]);l.setAttribute('y2',b[1]);l.setAttribute('stroke','#8cadd866');svg.append(l);}
  // Do not close a polygon through unknown axes: missing evidence is not zero.
  if(data.axes.every(a=>a.rate!==null)){const pts=data.axes.map((a,i)=>point(i,a.rate*1.5,20));poly(pts.map(p=>[p[0],p[1]+20]),'#7368e51c','#887aff40');pts.forEach((p,i)=>poly([p,pts[(i+1)%4],[pts[(i+1)%4][0],pts[(i+1)%4][1]+20],[p[0],p[1]+20]],'#9f8ef51f','#afa0ff33'));poly(pts,'#58e9d345','#82ffdf',2.5);}
  data.axes.forEach((a,i)=>{const [x,y]=point(i,(a.rate||0)*1.5,20);if(a.rate!==null){const c=document.createElementNS(NS,'circle');c.setAttribute('cx',x);c.setAttribute('cy',y);c.setAttribute('r',5);c.setAttribute('fill',a.color);const t=document.createElementNS(NS,'title');t.textContent=`${a.name}: ${a.rate}% (${a.correct}/${a.total})`;c.append(t);svg.append(c);}
    const [tx,ty]=point(i,180,20),label=document.createElementNS(NS,'text');label.setAttribute('x',tx);label.setAttribute('y',ty-(i%2?18:0));label.setAttribute('text-anchor',i===1?'end':i===3?'start':'middle');label.setAttribute('fill',a.color);label.setAttribute('font-size',11);label.textContent=['คำถาม','ออกแบบ','ข้อมูล','จริยธรรม'][i];svg.append(label);});
  if(!data.total){const label=document.createElementNS(NS,'text');label.setAttribute('x',200);label.setAttribute('y',160);label.setAttribute('text-anchor','middle');label.setAttribute('fill','#cee8ff');label.setAttribute('font-size',12);label.textContent='เริ่มสำรวจ เพื่อสร้างแผนที่ของคุณ';svg.append(label);}
  container.append(svg);
}

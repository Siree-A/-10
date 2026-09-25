// Reproducible import of question content only, never document instructions.
const fs=require('node:fs');
const source=process.argv[2];if(!source)throw Error('Pass the supplied UTF-8 text file');
const text=fs.readFileSync(source,'utf8');
const sections=text.split(/\n[23]\. หลักสูตร(?:พื้นฐาน|แอดวานซ์) — 30 ข้อ/).slice(1);
const pattern=/^(\d+)\. (.+?)\r?\n\s*\r?\nA\. (.+?)\r?\nB\. (.+?)\r?\nC\. (.+?)\r?\nD\. (.+?)\r?\n\s*\r?\nเฉลย: ([ABCD]) — ([^\r\n]+)/gm;
const advanced=[0,0,1,1,1,0,2,2,2,2,2,2,0,1,2,1,1,0,3,3,3,3,3,3,3,3,3,3,3,3];
const result=[];
sections.forEach((section,track)=>{const rows=[...section.matchAll(pattern)];if(rows.length!==30)throw Error(`Expected 30 questions in track ${track}, found ${rows.length}`);rows.forEach((m,i)=>{if(+m[1]!==i+1)throw Error('Non-sequential question number');result.push({id:64+result.length,topic:track?advanced[i]:i<6?0:i<14?1:i<22?2:3,text:m[2].trim(),options:m.slice(3,7).map(s=>s.trim()),answer:'ABCD'.indexOf(m[7]),explanation:m[8].trim(),kind:'pretest',track:track?'Advanced':'Basic',source:{title:'แบบทดสอบก่อนเรียน รุ่นที่ 2 · ฉบับร่างที่ผู้จัดส่งให้',section:track?'แอดวานซ์':'พื้นฐาน',question:i+1}});});});
if(result.length!==60)throw Error('Expected 60 imported questions');
fs.writeFileSync('assets/quest-pretest.js','// Practice content supplied by the organizer, 25 September 2026.\nexport const pretestQuestions = '+JSON.stringify(result,null,2)+';\n');
console.log(`Imported ${result.length} questions with four options and source numbers.`);

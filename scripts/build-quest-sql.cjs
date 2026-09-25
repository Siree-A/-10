const fs=require('node:fs');
(async()=>{const {questions}=await import('../assets/quest-data.js');const roster=JSON.parse(fs.readFileSync('researchers.json','utf8'));
const quote=s=>"'"+s.replaceAll("'","''")+"'";
const seed=`\ninsert into quest_private.members(code) values ${roster.map(m=>'('+quote(m.code)+')').join(',')} on conflict do nothing;\ninsert into quest_private.answers(id,answer,options) values ${questions.map(q=>`(${q.id},${q.answer},${q.options.length})`).join(',')} on conflict(id) do update set answer=excluded.answer,options=excluded.options;\n`;
fs.writeFileSync('supabase/quest-setup.sql','begin;\n'+fs.readFileSync('supabase/quest-schema.sql','utf8')+seed+'commit;\n');console.log(`SQL ready: ${roster.length} codes, ${questions.length} answers`);})();

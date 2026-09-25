const {PGlite}=require(process.env.PGLITE_MODULE||'@electric-sql/pglite');
const assert=require('node:assert/strict'),fs=require('node:fs'),{randomUUID}=require('node:crypto');
(async()=>{
 const db=new PGlite();
 await db.exec("create role anon;create role authenticated;create schema auth;create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;");
 await db.exec(fs.readFileSync('supabase/quest-setup.sql','utf8'));
 assert.equal((await db.query('select count(*)::int n from quest_private.answers')).rows[0].n,124);
 const id=randomUUID(),day=(await db.query("select (now() at time zone 'Asia/Bangkok')::date::text as day")).rows[0].day;
 await db.exec(`set role authenticated;set request.jwt.claim.sub='${id}';`);
 async function submit(code,item,answer,date=day,event=randomUUID()){return (await db.query('select public.quest_record($1,$2,$3,$4,$5,$6) result',[event,code,date,'mission',item,answer])).rows[0].result;}
 const {questions}=await import('../assets/quest-data.js');
 const event=randomUUID();assert.equal((await submit('A12',64,questions[64].answer,day,event)).added,true);assert.equal((await submit('A12',64,questions[64].answer,day,event)).added,false);assert.equal((await submit('A12',64,0)).added,false);
 await submit('A12',65,(questions[65].answer+1)%4);
 assert.deepEqual((await db.query('select * from public.quest_board()')).rows,[{code:'A12',daily:50,total:50}]);
 for(const args of [['Z99',0,0],['A12',999,0],['A12',66,7],['A12',66,0,'2020-01-01']])await assert.rejects(()=>submit(...args));
 await assert.rejects(()=>db.query('select * from quest_private.events'));
 await db.query("select public.quest_reflect(4,5,3,'data')");await db.query("select public.quest_reflect(5,5,4,'ethics')");
 assert.equal((await db.query('select public.quest_reflection_summary() s')).rows[0].s.ready,false);
 await assert.rejects(()=>db.query("select public.quest_reflect(6,5,3,'data')"));
 for(let i=0;i<4;i++){await db.exec(`set request.jwt.claim.sub='${randomUUID()}';`);await db.query("select public.quest_reflect(4,5,3,'data')");}
 const aggregate=(await db.query('select public.quest_reflection_summary() s')).rows[0].s;assert.equal(aggregate.ready,true);assert.equal(aggregate.responses,5);assert.equal(aggregate.owner,undefined);
 await db.exec("reset role;set role anon;set request.jwt.claim.sub='';");await assert.rejects(()=>submit('A12',66,0));await assert.rejects(()=>db.query("select public.quest_reflect(4,5,3,'data')"));assert.equal((await db.query('select * from public.quest_board()')).rows.length,1);
 await db.exec("reset role;set role authenticated;set request.jwt.claim.sub='';");await assert.rejects(()=>submit('A12',66,0));
 await db.close();console.log('PASS: PostgreSQL setup, server grading, duplicate suppression, current-day validation, role permissions, no raw access, survey bounds, upsert and 5-account aggregation.');
})().catch(e=>{console.error(e);process.exit(1)});

begin;
-- Research Quest: casual, self-reported member codes, NOT verified identities.
-- Run in a dedicated Supabase project. Tables are private; browsers only call RPCs.
create schema if not exists quest_private;
revoke all on schema quest_private from public, anon, authenticated;
create table if not exists quest_private.members(code text primary key check(code ~ '^[AB][0-9]{2}$'));
create table if not exists quest_private.answers(id integer primary key, answer integer not null, options integer not null check(options between 3 and 4), check(answer>=0 and answer<options));
create table if not exists quest_private.events(
  event_id uuid primary key, owner uuid not null, code text not null references quest_private.members,
  day date not null, kind text not null check(kind in ('mission','crystal')), item integer not null,
  points integer not null check(points in (5,10,40)), created_at timestamptz not null default now(),
  unique(code,day,kind,item)
);
create index if not exists quest_events_day on quest_private.events(day,code);
create index if not exists quest_events_owner_time on quest_private.events(owner,created_at);
create table if not exists quest_private.reflections(
  owner uuid not null, day date not null, relax smallint not null check(relax between 1 and 5),
  learn smallint not null check(learn between 1 and 5), satisfaction smallint not null check(satisfaction between 1 and 5),
  topic text not null check(topic in ('question','design','data','ethics')), primary key(owner,day)
);
alter table quest_private.members enable row level security;
alter table quest_private.answers enable row level security;
alter table quest_private.events enable row level security;
alter table quest_private.reflections enable row level security;
revoke all on all tables in schema quest_private from public,anon,authenticated;

create or replace function public.quest_record(p_event uuid,p_code text,p_day date,p_kind text,p_item integer,p_answer integer default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid(); v_answer integer; v_options integer; v_points integer; v_insert integer;
begin
 if v_user is null then raise exception 'Authentication required'; end if;
 if p_event is null or p_code is null or p_day is null or p_kind is null or p_item is null then raise exception 'Invalid event'; end if;
 if p_day<>(now() at time zone 'Asia/Bangkok')::date then raise exception 'Only current Bangkok day accepted'; end if;
 if not exists(select 1 from quest_private.members where code=p_code) then raise exception 'Invalid member code'; end if;
 -- Serialize submissions for a code: one credited attempt per question/crystal/day.
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(p_code));
 if exists(select 1 from quest_private.events where event_id=p_event or (code=p_code and day=p_day and kind=p_kind and item=p_item)) then return jsonb_build_object('accepted',true,'added',false); end if;
 if (select count(*) from quest_private.events where owner=v_user and created_at>now()-interval '1 minute')>=60 then raise exception 'Please slow down'; end if;
 if p_kind='mission' then
  select answer,options into v_answer,v_options from quest_private.answers where id=p_item;
  if not found or p_answer is null or p_answer<0 or p_answer>=v_options then raise exception 'Invalid answer'; end if;
  v_points:=case when p_answer=v_answer then 40 else 10 end;
 elsif p_kind='crystal' then
  if p_item<0 or p_item>11 or p_answer is not null then raise exception 'Invalid crystal'; end if;v_points:=5;
 else raise exception 'Invalid event kind'; end if;
 insert into quest_private.events(event_id,owner,code,day,kind,item,points) values(p_event,v_user,p_code,p_day,p_kind,p_item,v_points) on conflict do nothing;
 get diagnostics v_insert=row_count;
 return jsonb_build_object('accepted',true,'added',v_insert>0);
end $$;

create or replace function public.quest_board()
returns table(code text,daily bigint,total bigint) language sql stable security definer set search_path='' as $$
 select e.code,coalesce(sum(e.points) filter(where e.day=(now() at time zone 'Asia/Bangkok')::date),0)::bigint,sum(e.points)::bigint
 from quest_private.events e group by e.code order by sum(e.points) desc,e.code limit 80;
$$;

create or replace function public.quest_reflect(p_relax integer,p_learn integer,p_satisfaction integer,p_topic text)
returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if p_relax is null or p_learn is null or p_satisfaction is null or p_topic is null or p_relax not between 1 and 5 or p_learn not between 1 and 5 or p_satisfaction not between 1 and 5 or p_topic not in ('question','design','data','ethics') then raise exception 'Invalid reflection'; end if;
 insert into quest_private.reflections values(auth.uid(),(now() at time zone 'Asia/Bangkok')::date,p_relax,p_learn,p_satisfaction,p_topic)
 on conflict(owner,day) do update set relax=excluded.relax,learn=excluded.learn,satisfaction=excluded.satisfaction,topic=excluded.topic;
 return jsonb_build_object('accepted',true);
end $$;

-- Only aggregate reflections are exposed; no code, name, session ID or raw answer.
create or replace function public.quest_reflection_summary()
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare n integer; result jsonb;
begin
 select count(distinct owner) into n from quest_private.reflections where day>=(now() at time zone 'Asia/Bangkok')::date-29;
 if n<5 then return jsonb_build_object('ready',false); end if;
 select jsonb_build_object('ready',true,'responses',count(*),'relax',round(avg(relax),1),'learn',round(avg(learn),1),'satisfaction',round(avg(satisfaction),1)) into result from quest_private.reflections where day>=(now() at time zone 'Asia/Bangkok')::date-29;
 return result;
end $$;
revoke all on function public.quest_record(uuid,text,date,text,integer,integer) from public,anon;
revoke all on function public.quest_reflect(integer,integer,integer,text) from public,anon;
revoke all on function public.quest_board() from public;
revoke all on function public.quest_reflection_summary() from public;
grant execute on function public.quest_record(uuid,text,date,text,integer,integer) to authenticated;
grant execute on function public.quest_reflect(integer,integer,integer,text) to authenticated;
grant execute on function public.quest_board() to anon,authenticated;
grant execute on function public.quest_reflection_summary() to anon,authenticated;

insert into quest_private.members(code) values ('A01'),('A02'),('A03'),('A04'),('A05'),('A06'),('A07'),('A08'),('A09'),('A10'),('A11'),('A12'),('A13'),('A14'),('A15'),('A16'),('A17'),('A18'),('A19'),('A20'),('A21'),('A22'),('A23'),('A24'),('A25'),('A26'),('A27'),('A28'),('A29'),('A30'),('B01'),('B02'),('B03'),('B04'),('B05'),('B06'),('B07'),('B08'),('B09'),('B10'),('B11'),('B12'),('B13'),('B14'),('B15'),('B16'),('B17'),('B18'),('B19'),('B20'),('B21'),('B22'),('B23'),('B24'),('B25'),('B26'),('B27'),('B28'),('B29'),('B30'),('B31'),('B32'),('B33'),('B34'),('B35'),('B36'),('B37'),('B38'),('B39'),('B40'),('B41'),('B42'),('B43'),('B44'),('B45'),('B46'),('B47'),('B48'),('B49'),('B50') on conflict do nothing;
insert into quest_private.answers(id,answer,options) values (0,0,3),(1,1,3),(2,1,3),(3,0,3),(4,1,3),(5,1,3),(6,0,3),(7,1,3),(8,1,3),(9,0,3),(10,0,3),(11,0,3),(12,0,3),(13,1,3),(14,0,3),(15,1,3),(16,1,3),(17,1,3),(18,1,3),(19,1,3),(20,1,3),(21,1,3),(22,1,3),(23,1,3),(24,0,3),(25,0,3),(26,1,3),(27,0,3),(28,0,3),(29,1,3),(30,1,3),(31,0,3),(32,0,3),(33,1,3),(34,0,3),(35,0,3),(36,0,3),(37,0,3),(38,1,3),(39,0,3),(40,0,3),(41,1,3),(42,0,3),(43,1,3),(44,1,3),(45,0,3),(46,1,3),(47,0,3),(48,0,3),(49,0,3),(50,0,3),(51,0,3),(52,1,3),(53,0,3),(54,0,3),(55,0,3),(56,0,3),(57,0,3),(58,0,3),(59,0,3),(60,0,3),(61,0,3),(62,0,3),(63,1,3),(64,1,4),(65,2,4),(66,0,4),(67,3,4),(68,1,4),(69,2,4),(70,0,4),(71,3,4),(72,1,4),(73,2,4),(74,0,4),(75,3,4),(76,1,4),(77,2,4),(78,0,4),(79,3,4),(80,1,4),(81,2,4),(82,0,4),(83,3,4),(84,1,4),(85,2,4),(86,0,4),(87,3,4),(88,1,4),(89,2,4),(90,0,4),(91,3,4),(92,1,4),(93,2,4),(94,2,4),(95,0,4),(96,3,4),(97,1,4),(98,2,4),(99,0,4),(100,3,4),(101,1,4),(102,2,4),(103,0,4),(104,3,4),(105,1,4),(106,2,4),(107,0,4),(108,3,4),(109,1,4),(110,2,4),(111,0,4),(112,3,4),(113,1,4),(114,2,4),(115,0,4),(116,3,4),(117,1,4),(118,2,4),(119,0,4),(120,3,4),(121,1,4),(122,2,4),(123,0,4) on conflict(id) do update set answer=excluded.answer,options=excluded.options;
commit;

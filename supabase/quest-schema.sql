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

-- AI generation is private, quota-limited, asynchronous, and separate from the live storefront.
create table public.illustration_jobs (
 id uuid primary key,
 user_id uuid references public.profiles on delete set null,
 product_id uuid not null references public.products on delete restrict,
 session_hash text not null check(length(session_hash)=64),
 request_hash text not null check(length(request_hash)=64),
 config jsonb not null,
 source_path text not null,
 artwork_path text,
 status text not null default 'queued' check(status in ('queued','processing','ready','approved','failed','purging')),
 error_code text,
 width integer,
 height integer,
 created_at timestamptz not null default now(),
 started_at timestamptz,
 completed_at timestamptz
);
alter table public.illustration_jobs enable row level security;
revoke all on public.illustration_jobs from public,anon,authenticated;
grant select,insert,update,delete on public.illustration_jobs to service_role;
create index illustration_jobs_request_idx on public.illustration_jobs(request_hash,created_at);
create index illustration_jobs_created_idx on public.illustration_jobs(created_at);
alter table public.personalizations add column generation_id uuid unique references public.illustration_jobs on delete restrict;
alter table public.personalizations add column artwork_kind text not null default 'photo' check(artwork_kind in ('photo','ai'));
create function public.reserve_illustration(p_id uuid,p_user uuid,p_session text,p_request text,p_product uuid,p_config jsonb,p_source text,p_hour integer,p_daily integer) returns void language plpgsql security definer set search_path=public as $$
begin
 -- One transaction lock makes the global and per-request cost ceilings atomic.
 perform pg_advisory_xact_lock(1936741221,1);
 if p_hour not between 1 and 3 or p_daily not between 1 and 100 then raise exception 'Invalid illustration limits'; end if;
 if (select count(*) from illustration_jobs where request_hash=p_request and created_at>=now()-interval '1 hour')>=p_hour or (select count(*) from illustration_jobs where created_at>=date_trunc('day',now(),'UTC'))>=p_daily then raise exception 'Illustration limit reached'; end if;
 insert into illustration_jobs(id,user_id,session_hash,request_hash,product_id,config,source_path) values(p_id,p_user,p_session,p_request,p_product,p_config,p_source);
end $$;
revoke all on function public.reserve_illustration(uuid,uuid,text,text,uuid,jsonb,text,integer,integer) from public,anon,authenticated;
grant execute on function public.reserve_illustration(uuid,uuid,text,text,uuid,jsonb,text,integer,integer) to service_role;
create function public.approve_illustration(p_id uuid) returns uuid language plpgsql security definer set search_path=public as $$
declare job illustration_jobs; begin
 select * into job from illustration_jobs where id=p_id for update;
 if not found or job.created_at<now()-interval '7 days' or job.status not in ('ready','approved') or job.artwork_path is null then raise exception 'Illustration unavailable for approval'; end if;
 if job.status='approved' then
  if exists(select 1 from personalizations where generation_id=job.id and not deleting) then return job.id; end if;
  raise exception 'Illustration no longer available';
 end if;
 insert into personalizations(id,user_id,product_id,session_hash,request_hash,config,source_path,artwork_path,approved_at,generation_id,artwork_kind) values(job.id,job.user_id,job.product_id,job.session_hash,job.request_hash,job.config,job.source_path,job.artwork_path,now(),job.id,'ai');
 update illustration_jobs set status='approved' where id=job.id;
 return job.id;
end $$;
revoke all on function public.approve_illustration(uuid) from public,anon,authenticated;
grant execute on function public.approve_illustration(uuid) to service_role;
create function public.prepare_illustration_delete(p_id uuid) returns boolean language plpgsql security definer set search_path=public as $$
begin
 perform 1 from illustration_jobs where id=p_id and created_at<now()-interval '7 days' for update;
 if not found or exists(select 1 from personalizations where generation_id=p_id) then return false; end if;
 update illustration_jobs set status='purging' where id=p_id;return true;
end $$;
revoke all on function public.prepare_illustration_delete(uuid) from public,anon,authenticated;
grant execute on function public.prepare_illustration_delete(uuid) to service_role;
-- Preserve reservation locking and invalidate AI proof access when an unordered design is deleted.
create or replace function public.prepare_personalization_delete(p_id uuid) returns boolean language plpgsql security definer set search_path=public as $$
declare gid uuid; begin
 select generation_id into gid from personalizations where id=p_id for update;
 if not found then return false; end if;
 if exists(select 1 from order_items where personalization_id=p_id) or exists(select 1 from checkout_drafts where state='reserved' and items @> jsonb_build_array(jsonb_build_object('personalization_id',p_id))) then return false; end if;
 update personalizations set deleting=true where id=p_id;
 if gid is not null then update illustration_jobs set status='purging' where id=gid; end if;
 return true;
end $$;

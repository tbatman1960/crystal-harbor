create table public.print_exports(
 id uuid primary key default gen_random_uuid(),
 personalization_id uuid not null references public.personalizations on delete restrict,
 spec jsonb not null,
 spec_hash text not null check(length(spec_hash)=64),
 status text not null default 'queued' check(status in ('queued','processing','ready','failed','deleting')),
 attempt integer not null default 1 check(attempt between 1 and 3),
 requested_by uuid references public.profiles on delete set null,
 file_path text,
 proof_path text,
 manifest_path text,
 metrics jsonb,
 error_message text,
 reviewed_by uuid references public.profiles on delete set null,
 reviewed_at timestamptz,
 created_at timestamptz not null default now(),
 started_at timestamptz,
 completed_at timestamptz,
 unique(personalization_id,spec_hash)
);
alter table public.print_exports enable row level security;
revoke all on public.print_exports from public,anon,authenticated;
grant select,insert,update,delete on public.print_exports to service_role;
create index print_exports_created_idx on public.print_exports(created_at);
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('print-production-private','print-production-private',false,52428800,array['image/png','image/jpeg','image/tiff','image/svg+xml','application/json']);
-- RLS has no public policy: verified admin routes and service-only workers own access.
create function public.reserve_print_export(p_personalization uuid,p_spec jsonb,p_hash text,p_user uuid) returns uuid language plpgsql security definer set search_path=public as $$
declare existing print_exports; pid uuid; begin
 perform pg_advisory_xact_lock(1936741221,2);
 update print_exports set status='failed',error_message='Export timed out. Please retry.',completed_at=now() where status in ('queued','processing') and coalesce(started_at,created_at)<now()-interval '20 minutes';
 perform 1 from personalizations where id=p_personalization and not deleting for update;
 if not found then raise exception 'Approved artwork unavailable'; end if;
 if not exists(select 1 from profiles where id=p_user and is_admin) then raise exception 'Forbidden'; end if;
 select * into existing from print_exports where personalization_id=p_personalization and spec_hash=p_hash for update;
 if found and existing.status in ('ready','queued','processing') then return existing.id; end if;
 if found and existing.status='deleting' then raise exception 'Print file is being removed'; end if;
 if (select count(*) from print_exports where status in ('queued','processing'))>=2 then raise exception 'Two print files are already processing. Please wait.'; end if;
 if existing.id is not null then
  if existing.attempt>=3 then raise exception 'Print export retry limit reached. Remove this export before trying again.'; end if;
  update print_exports set status='queued',attempt=attempt+1,error_message=null,started_at=null,completed_at=null,reviewed_at=null,reviewed_by=null where id=existing.id;
  return existing.id;
 end if;
 insert into print_exports(personalization_id,spec,spec_hash,requested_by) values(p_personalization,p_spec,p_hash,p_user) returning id into pid;return pid;
end $$;
revoke all on function public.reserve_print_export(uuid,jsonb,text,uuid) from public,anon,authenticated;
grant execute on function public.reserve_print_export(uuid,jsonb,text,uuid) to service_role;
create function public.prepare_print_export_delete(p_id uuid) returns jsonb language plpgsql security definer set search_path=public as $$
declare row print_exports; begin
 select * into row from print_exports where id=p_id for update;
 if not found then raise exception 'Print file unavailable'; end if;
 if row.status in ('queued','processing') and coalesce(row.started_at,row.created_at)>now()-interval '20 minutes' then raise exception 'Print file is still processing'; end if;
 update print_exports set status='deleting' where id=p_id;
 return jsonb_build_object('file_path',row.file_path,'proof_path',row.proof_path,'manifest_path',row.manifest_path,'attempt',row.attempt,'format',row.spec->>'format');
end $$;
revoke all on function public.prepare_print_export_delete(uuid) from public,anon,authenticated;
grant execute on function public.prepare_print_export_delete(uuid) to service_role;
-- Keep approved source and print files together until an administrator removes the exports.
create or replace function public.prepare_personalization_delete(p_id uuid) returns boolean language plpgsql security definer set search_path=public as $$
declare gid uuid; begin
 select generation_id into gid from personalizations where id=p_id for update;
 if not found then return false; end if;
 if exists(select 1 from order_items where personalization_id=p_id) or exists(select 1 from checkout_drafts where state='reserved' and items @> jsonb_build_array(jsonb_build_object('personalization_id',p_id))) or exists(select 1 from print_exports where personalization_id=p_id) then return false; end if;
 update personalizations set deleting=true where id=p_id;
 if gid is not null then update illustration_jobs set status='purging' where id=gid; end if;
 return true;
end $$;

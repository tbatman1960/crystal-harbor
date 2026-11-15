
create table public.website_collaborators(
 email text primary key check(email=lower(trim(email)) and length(email)<=254 and position('@' in email)>1),
 active boolean not null default true,can_publish boolean not null default false,
 granted_by uuid references public.profiles on delete set null,updated_at timestamptz not null default now()
);
create table public.website_design(
 channel text primary key check(channel='photo-gift-studio'),draft_config jsonb not null default '{}',published_config jsonb not null default '{}',
 version integer not null default 0,published_version integer not null default 0,updated_by uuid references public.profiles on delete set null,
 published_by uuid references public.profiles on delete set null,updated_at timestamptz not null default now(),published_at timestamptz
);
insert into public.website_design(channel) values('photo-gift-studio');
create table public.website_design_history(
 id uuid primary key default gen_random_uuid(),channel text not null references public.website_design(channel),
 version integer not null,action text not null check(action in ('save','publish')),config jsonb not null,
 actor_id uuid references public.profiles on delete set null,actor_email text not null,note text not null default '',
 created_at timestamptz not null default now(),unique(channel,version)
);
create table public.website_assist_requests(
 id uuid primary key,user_id uuid references public.profiles on delete set null,created_at timestamptz not null default now(),
 state text not null default 'reserved' check(state in ('reserved','succeeded','failed'))
);
create index website_history_channel_idx on public.website_design_history(channel,created_at desc);
create index website_history_actor_idx on public.website_design_history(actor_id);
create index website_assist_user_idx on public.website_assist_requests(user_id,created_at);
create index website_assist_created_idx on public.website_assist_requests(created_at);
create index website_member_grant_idx on public.website_collaborators(granted_by);
alter table public.website_collaborators enable row level security;
alter table public.website_design enable row level security;
alter table public.website_design_history enable row level security;
alter table public.website_assist_requests enable row level security;
revoke all on public.website_collaborators,public.website_design,public.website_design_history,public.website_assist_requests from public,anon,authenticated;
grant select,insert,update,delete on public.website_collaborators,public.website_design,public.website_design_history,public.website_assist_requests to service_role;
create function public.website_design_action(p_action text,p_expected integer,p_config jsonb,p_actor uuid,p_email text,p_note text) returns jsonb language plpgsql security invoker set search_path=public as $$
declare d public.website_design;owner_access boolean;member public.website_collaborators;begin
 select coalesce(is_admin,false) into owner_access from public.profiles where id=p_actor;
 select * into member from public.website_collaborators where email=lower(p_email);
 if not coalesce(owner_access,false) and not coalesce(member.active,false) then raise exception 'Forbidden';end if;
 if p_action not in ('save','publish') then raise exception 'Invalid action';end if;
 if p_action='publish' and not coalesce(owner_access,false) and not coalesce(member.can_publish,false) then raise exception 'Publishing requires store admin permission';end if;
 select * into d from public.website_design where channel='photo-gift-studio' for update;
 if d.version<>p_expected then raise exception 'Design changed by another editor. Reload before saving.';end if;
 if p_action='save' then
  if jsonb_typeof(p_config)<>'object' or length(p_config::text)>20000 then raise exception 'Invalid design';end if;
  update public.website_design set draft_config=p_config,version=version+1,updated_by=p_actor,updated_at=now() where channel=d.channel returning * into d;
 else
  update public.website_design set published_config=draft_config,version=version+1,published_version=version+1,published_by=p_actor,updated_by=p_actor,published_at=now(),updated_at=now() where channel=d.channel returning * into d;
 end if;
 insert into public.website_design_history(channel,version,action,config,actor_id,actor_email,note) values(d.channel,d.version,p_action,d.draft_config,p_actor,lower(p_email),left(coalesce(p_note,''),300));
 return to_jsonb(d);
end $$;
revoke all on function public.website_design_action(text,integer,jsonb,uuid,text,text) from public,anon,authenticated;
grant execute on function public.website_design_action(text,integer,jsonb,uuid,text,text) to service_role;
create function public.reserve_website_assist(p_id uuid,p_actor uuid,p_email text) returns void language plpgsql security invoker set search_path=public as $$
begin
 if not exists(select 1 from public.profiles where id=p_actor and is_admin) and not exists(select 1 from public.website_collaborators where email=lower(p_email) and active) then raise exception 'Forbidden';end if;
 perform pg_advisory_xact_lock(1936741221,9);
 if exists(select 1 from public.website_assist_requests where id=p_id) then raise exception 'This request was already submitted';end if;
 if (select count(*) from public.website_assist_requests where user_id=p_actor and created_at>=now()-interval '1 hour')>=5 or (select count(*) from public.website_assist_requests where created_at>=date_trunc('day',now(),'UTC'))>=20 then raise exception 'Design assistant limit reached. Try again later.';end if;
 insert into public.website_assist_requests(id,user_id) values(p_id,p_actor);
end $$;
revoke all on function public.reserve_website_assist(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.reserve_website_assist(uuid,uuid,text) to service_role;

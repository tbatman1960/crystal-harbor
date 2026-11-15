-- Keep production presentation separate from the experimental photo-gift preview.
alter table public.website_design drop constraint website_design_channel_check;
alter table public.website_design add constraint website_design_channel_check check(channel in ('photo-gift-studio','storefront-production'));
insert into public.website_design(channel) values('storefront-production') on conflict do nothing;
create function public.production_website_design_action(p_action text,p_expected integer,p_config jsonb,p_actor uuid,p_email text,p_note text) returns jsonb language plpgsql security invoker set search_path=public as $$
declare d public.website_design;owner_access boolean;member public.website_collaborators;begin
 select coalesce(is_admin,false) into owner_access from public.profiles where id=p_actor;
 select * into member from public.website_collaborators where email=lower(p_email);
 if not coalesce(owner_access,false) and not coalesce(member.active,false) then raise exception 'Forbidden';end if;
 if p_action not in ('save','publish') then raise exception 'Invalid action';end if;
 if p_action='publish' and not coalesce(owner_access,false) and not coalesce(member.can_publish,false) then raise exception 'Publishing requires store admin permission';end if;
 select * into d from public.website_design where channel='storefront-production' for update;
 if d.channel is null then raise exception 'Design unavailable';end if;
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
revoke all on function public.production_website_design_action(text,integer,jsonb,uuid,text,text) from public,anon,authenticated;
grant execute on function public.production_website_design_action(text,integer,jsonb,uuid,text,text) to service_role;

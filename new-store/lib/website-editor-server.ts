
import 'server-only';
import {cache} from 'react';
import {cookies} from 'next/headers';
import {db,service,check} from './supabase';
import {defaultDesign,designSchema,type SiteDesign} from './site-design';
export async function websiteAccess(){
 const {data:{user},error}=await db().auth.getUser();
 if(error||!user)throw Error('Unauthorized');
 const {data:p,error:pe}=await db().from('profiles').select('is_admin').eq('id',user.id).single();check(pe);
 if(p?.is_admin)return {user,owner:true,canPublish:true};
 if(!user.email||!user.email_confirmed_at)throw Error('Forbidden');
 const {data:m,error:me}=await service().from('website_collaborators').select('active,can_publish').eq('email',user.email.toLowerCase()).maybeSingle();check(me);
 if(!m?.active)throw Error('Forbidden');
 return {user,owner:false,canPublish:!!m.can_publish};
}
export const readWebsiteDesign=cache(async():Promise<{config:SiteDesign;preview:boolean;active:boolean}>=>{
 if(!process.env.NEXT_PUBLIC_SUPABASE_URL)return {config:defaultDesign,preview:false,active:false};
 const {data,error}=await service().from('website_design').select('draft_config,published_config').eq('channel','photo-gift-studio').single();check(error);
 let preview=false;
 if(cookies().get('snuggle-design-preview')?.value==='1'){try{await websiteAccess();preview=true;}catch{/* Revoked/unsigned-in users only see published settings. */}}
 const parsed=designSchema.safeParse(preview?data?.draft_config:data?.published_config);
 return {config:parsed.success?parsed.data:defaultDesign,preview,active:Object.keys((preview?data?.draft_config:data?.published_config)||{}).length>0};
});

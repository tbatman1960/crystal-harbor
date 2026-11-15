import 'server-only';
import {db,service,check} from './supabase';
export async function catalogAccess(){
 const client=db();
 const {data:{user},error}=await client.auth.getUser();
 if(error||!user)throw Error('Unauthorized');
 const {data:p,error:pe}=await client.from('profiles').select('is_admin').eq('id',user.id).single();check(pe);
 if(p?.is_admin)return {client,user,owner:true,design:true};
 if(!user.email||!user.email_confirmed_at)throw Error('Forbidden');
 const {data:m,error:me}=await service().from('website_collaborators').select('active,role,catalog_active').eq('email',user.email.toLowerCase()).maybeSingle();check(me);
 const design=m?.role==='collaborator'&&m.active;
 if(!design&&!(m?.role==='products'&&m.catalog_active))throw Error('Forbidden');
 return {client,user,owner:false,design:!!design};
}
export async function catalogClient(){return (await catalogAccess()).client;}

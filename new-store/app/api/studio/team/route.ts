
import {NextResponse} from 'next/server';
import {z} from 'zod';
import {websiteAccess} from '@/lib/website-editor-server';
import {service,check} from '@/lib/supabase';
import {origin,failure} from '@/lib/http';
import {siteUrl} from '@/lib/site-url';
export async function GET(){try{const a=await websiteAccess();if(!a.owner)throw Error('Forbidden');const {data,error}=await service().from('website_collaborators').select('email,active,can_publish,updated_at').order('email');check(error);return NextResponse.json({members:data||[],login_url:siteUrl()+'/studio'},{headers:{'Cache-Control':'private,no-store'}})}catch(e){return failure(e)}}
export async function POST(req:Request){try{
 origin(req);const a=await websiteAccess();if(!a.owner)throw Error('Forbidden');
 const v=z.object({email:z.string().trim().email().max(254),active:z.boolean(),can_publish:z.boolean(),send_invitation:z.boolean().default(false)}).strict().parse(await req.json());
 const client=service(),email=v.email.toLowerCase();
 check((await client.from('website_collaborators').upsert({email,active:v.active,can_publish:v.can_publish,granted_by:a.user.id,updated_at:new Date().toISOString()})).error);
 let message=v.active?'Design access saved. This person must sign in with this verified email address.':'Design access revoked.';
 if(v.active&&v.send_invitation){const {error}=await client.auth.admin.inviteUserByEmail(email,{redirectTo:siteUrl()+'/auth/activate'});message+=error?' Invitation email could not be sent (an account may already exist). Share the editor link and have them sign in or reset their password.':' Invitation email sent.';}
 return NextResponse.json({message,login_url:siteUrl()+'/studio'});
}catch(e){return failure(e)}}

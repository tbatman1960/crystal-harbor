
import {NextResponse} from 'next/server';
import {z} from 'zod';
import {websiteAccess} from '@/lib/website-editor-server';
import {service,check} from '@/lib/supabase';
import {origin,failure} from '@/lib/http';
import {siteUrl} from '@/lib/site-url';
import {randomUUID} from 'node:crypto';
import {createEditorInvitation} from '@/lib/editor-invitation';
import {sendTransactionalEmail} from '@/lib/mail-transport';
import {settings} from '@/lib/data';
export async function GET(){try{const a=await websiteAccess();if(!a.owner)throw Error('Forbidden');const {data,error}=await service().from('website_collaborators').select('email,active,can_publish,role,catalog_active,updated_at').order('email');check(error);return NextResponse.json({members:(data||[]).map(m=>({...m,active:m.role==='products'?m.catalog_active:m.active})),login_url:siteUrl()+'/studio'},{headers:{'Cache-Control':'private,no-store'}})}catch(e){return failure(e)}}
export async function POST(req:Request){try{
 origin(req);const a=await websiteAccess();if(!a.owner)throw Error('Forbidden');
 const v=z.object({email:z.string().trim().email().max(254),active:z.boolean(),can_publish:z.boolean(),send_invitation:z.boolean().default(false),role:z.enum(['collaborator','products']).optional()}).strict().parse(await req.json());
 const client=service(),email=v.email.toLowerCase();
 const {data:existing,error:readError}=await client.from('website_collaborators').select('role').eq('email',email).maybeSingle();check(readError);
 const role=v.role||existing?.role||'collaborator';
 const destination=role==='products'?'/catalog':'/studio';
 check((await client.from('website_collaborators').upsert({email,role,active:v.active&&role==='collaborator',catalog_active:v.active&&role==='products',can_publish:role==='collaborator'&&v.can_publish,granted_by:a.user.id,updated_at:new Date().toISOString()})).error);
 let message=v.active?(role==='products'?'Product-only access saved.':'Collaborator access saved: website design and product management.'):'Access revoked.';
 if(v.active&&v.send_invitation){
  try{
   const s=await settings();
   const link=await createEditorInvitation(client.auth.admin,email,siteUrl(),destination);
   await sendTransactionalEmail({to:email,replyTo:s.store_email,defaultFrom:`${s.store_name} <${s.store_email}>`,subject:role==='products'?'Your SnuggleBug product access invitation':'Your SnuggleBug collaborator invitation',text:[
    role==='products'?'You have been invited to manage the SnuggleBug product catalog.':'You have been invited to edit the SnuggleBug website and manage its product catalog.',
    'Open this one-time link to choose a password and sign in:',link,
    'If you already have a SnuggleBug account, this link lets you set a new password. You can also sign in with your existing password at '+siteUrl()+'/auth?next='+destination,
    'After signing in you will have the permissions granted by the store owner. Orders, customers, payments and account permissions remain restricted to store administrators.',
    'If this link has expired, ask the store owner to send a new invitation. If you were not expecting this invitation, ignore this message.',
   ].join('\n\n'),dedupeKey:'website-invitation:'+randomUUID()});
   message+=' Invitation email sent. Use the newest email to set a password and open your workspace.';
  }catch{
   message+=' Invitation email could not be sent. Access is saved; retry sending the invitation, or ask an existing account holder to sign in at the editor link.';
  }
 }
 return NextResponse.json({message,login_url:siteUrl()+destination});
}catch(e){return failure(e)}}

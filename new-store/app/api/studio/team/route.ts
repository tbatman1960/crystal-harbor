
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
export async function GET(){try{const a=await websiteAccess();if(!a.owner)throw Error('Forbidden');const {data,error}=await service().from('website_collaborators').select('email,active,can_publish,updated_at').order('email');check(error);return NextResponse.json({members:data||[],login_url:siteUrl()+'/studio'},{headers:{'Cache-Control':'private,no-store'}})}catch(e){return failure(e)}}
export async function POST(req:Request){try{
 origin(req);const a=await websiteAccess();if(!a.owner)throw Error('Forbidden');
 const v=z.object({email:z.string().trim().email().max(254),active:z.boolean(),can_publish:z.boolean(),send_invitation:z.boolean().default(false)}).strict().parse(await req.json());
 const client=service(),email=v.email.toLowerCase();
 check((await client.from('website_collaborators').upsert({email,active:v.active,can_publish:v.can_publish,granted_by:a.user.id,updated_at:new Date().toISOString()})).error);
 let message=v.active?'Design access saved. This person must sign in with this verified email address.':'Design access revoked.';
 if(v.active&&v.send_invitation){
  try{
   const s=await settings();
   const link=await createEditorInvitation(client.auth.admin,email,siteUrl());
   await sendTransactionalEmail({to:email,replyTo:s.store_email,defaultFrom:`${s.store_name} <${s.store_email}>`,subject:'Your SnuggleBug Website Editor invitation',text:[
    'You have been invited to the SnuggleBug Website Editor.',
    'Open this one-time link to choose a password and sign in:',link,
    'If you already have a SnuggleBug account, this link lets you set a new password. You can also sign in with your existing password at '+siteUrl()+'/auth?next=/studio',
    'After signing in you will have the design permissions granted by the store owner. This does not grant access to store administration.',
    'If this link has expired, ask the store owner to send a new invitation. If you were not expecting this invitation, ignore this message.',
   ].join('\n\n'),dedupeKey:'website-invitation:'+randomUUID()});
   message+=' Invitation email sent. Use the newest email to set a password and open the Website Editor.';
  }catch{
   message+=' Invitation email could not be sent. Access is saved; retry sending the invitation, or ask an existing account holder to sign in at the editor link.';
  }
 }
 return NextResponse.json({message,login_url:siteUrl()+'/studio'});
}catch(e){return failure(e)}}

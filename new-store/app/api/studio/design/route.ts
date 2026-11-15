
import {NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {z} from 'zod';
import {websiteAccess} from '@/lib/website-editor-server';
import {designSchema,defaultDesign} from '@/lib/site-design';
import {service,check} from '@/lib/supabase';
import {origin,failure} from '@/lib/http';
import {PersonalizationError} from '@/lib/personalization/errors';
export const dynamic='force-dynamic';
export async function GET(){try{
 const a=await websiteAccess();const client=service();
 const {data:row,error}=await client.from('website_design').select('*').eq('channel','photo-gift-studio').single();check(error);if(!row)throw Error('Design unavailable');
 const {data:history,error:he}=await client.from('website_design_history').select('id,version,action,config,actor_email,note,created_at').eq('channel','photo-gift-studio').order('version',{ascending:false}).limit(30);check(he);
 const {data:products,error:pe}=await client.from('products').select('id,name,slug,design_slug,product_images(url,is_primary,sort_order)').eq('is_active',true).order('name');check(pe);
 return NextResponse.json({role:a.owner?'owner':'editor',can_publish:a.canPublish,assistant_ready:a.owner&&!!process.env.OPENAI_API_KEY,
 version:row.version,published_version:row.published_version,draft:designSchema.parse(row.draft_config||{}),published:designSchema.parse(row.published_config||{}),defaults:defaultDesign,history:history||[],products:products||[]},{headers:{'Cache-Control':'private,no-store'}});
}catch(e){return failure(e)}}
export async function POST(req:Request){try{
 origin(req);const a=await websiteAccess();
 const v=z.object({action:z.enum(['save','publish','preview']),version:z.number().int().nonnegative(),config:designSchema.optional(),note:z.string().trim().max(300).default('')}).strict().parse(await req.json());
 if(v.action==='preview'){cookies().set('snuggle-design-preview','1',{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/',maxAge:3600});return NextResponse.json({ok:true});}
 if(v.action==='publish'&&!a.canPublish)throw Error('Forbidden');
 if(v.action==='save'&&!v.config)throw new PersonalizationError('Provide a complete design before saving.');
 const {data,error}=await service().rpc('website_design_action',{p_action:v.action,p_expected:v.version,p_config:v.config||{},p_actor:a.user.id,p_email:a.user.email!,p_note:v.note});
 if(error?.message.includes('Design changed'))return NextResponse.json({error:'Another editor changed the draft. Reload before saving so their work is preserved.',code:'DESIGN_CONFLICT'},{status:409});check(error);
 if(v.action==='publish')cookies().delete('snuggle-design-preview');
 return NextResponse.json({version:data.version,published_version:data.published_version,draft:designSchema.parse(data.draft_config),published:designSchema.parse(data.published_config)},{headers:{'Cache-Control':'private,no-store'}});
}catch(e){return failure(e)}}
export async function DELETE(req:Request){try{origin(req);cookies().delete('snuggle-design-preview');return NextResponse.json({ok:true})}catch(e){return failure(e)}}

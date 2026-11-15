
import {NextResponse} from 'next/server';
import {z} from 'zod';
import {websiteAccess} from '@/lib/website-editor-server';
import {designSchema} from '@/lib/site-design';
import {service,check} from '@/lib/supabase';
import {origin,failure} from '@/lib/http';
import {WebsiteEditorError} from '@/lib/editor-error';
export const runtime='nodejs';
export async function POST(req:Request){let id:string|undefined;try{
 origin(req);const a=await websiteAccess();if(!a.owner)throw Error('Forbidden');
 const v=z.object({id:z.string().uuid(),prompt:z.string().trim().min(5).max(1500),current:designSchema}).strict().parse(await req.json());
 if(!process.env.OPENAI_API_KEY)throw new WebsiteEditorError('AI suggestions need an API connection. Manual design controls remain available.');
 const client=service();const reserve=await client.rpc('reserve_website_assist',{p_id:v.id,p_actor:a.user.id,p_email:a.user.email!});
 if(reserve.error)throw new WebsiteEditorError(reserve.error.message.includes('limit')?'AI suggestion limit reached. Try again later.':'This suggestion request could not start. Refresh the editor and try again.');id=v.id;
 const allowed=Object.keys(designSchema.innerType().shape);
 const response=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{Authorization:'Bearer '+process.env.OPENAI_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({
 model:process.env.WEBSITE_ASSIST_MODEL||'gpt-4.1-mini',response_format:{type:'json_object'},max_completion_tokens:1200,temperature:.3,
 messages:[{role:'system',content:'You propose safe website setting changes. Return JSON only: {"changes":{...changed settings only...},"summary":"brief explanation"}. Never output code, CSS, HTML, scripts or URLs. You cannot modify payments, prices, inventory, tax, shipping restrictions, authorization, photo consent or mandatory artwork approval. Unsupported requests must return changes={} and explain the limitation. Preserve current settings unless requested. Allowed keys: '+allowed.join(', ')+'. Colors: six-digit hex. font: classic|playful|rounded|clean. desktop_columns:1-4; mobile_columns:1-2. image_shape:portrait|square; image_fit:cover|contain; radius:0-32; spacing:compact|comfortable|airy; buttons:pill|soft; show_mascot,announcement_enabled:boolean. home_sections:unique array containing gallery and optional hero,how,sizes,shipping. design_order:existing design slugs, keep unchanged unless ordering requested. product_entry:details_first|size_first; checkout_layout:one_page|guided. Keep ink contrast at least 4.5 against both background and secondary.'},{role:'user',content:JSON.stringify({request:v.prompt,current:v.current})}]
 }),signal:AbortSignal.timeout(45000)});
 if(!response.ok)throw new WebsiteEditorError('AI suggestions are temporarily unavailable or this API key does not allow text models. You can use the manual controls.');
 const output=await response.json();let raw:unknown;try{raw=JSON.parse(output.choices?.[0]?.message?.content||'')}catch{throw new WebsiteEditorError('The assistant returned an unusable suggestion. Nothing was changed.');}
 const result=z.object({changes:designSchema.innerType().partial().strict(),summary:z.string().max(1200)}).strict().parse(raw);
 const proposal=designSchema.parse({...v.current,...result.changes});
 check((await client.from('website_assist_requests').update({state:'succeeded'}).eq('id',id)).error);
 return NextResponse.json({proposal,summary:result.summary,changed_keys:Object.keys(result.changes)},{headers:{'Cache-Control':'private,no-store'}});
}catch(e){if(id)await service().from('website_assist_requests').update({state:'failed'}).eq('id',id);return failure(e)}}

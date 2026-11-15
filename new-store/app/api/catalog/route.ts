import {NextResponse} from 'next/server';
import {z} from 'zod';
import {catalogClient} from '@/lib/catalog-access';
import {check} from '@/lib/supabase';
import {productSchema,categorySchema} from '@/lib/validation';
import {origin,failure} from '@/lib/http';
const input=z.discriminatedUnion('kind',[
 z.object({kind:z.literal('product'),value:productSchema}).strict(),
 z.object({kind:z.literal('category'),value:categorySchema}).strict(),
 z.object({kind:z.literal('delete'),value:z.object({table:z.enum(['products','categories']),id:z.string().uuid()}).strict()}).strict(),
]);
export async function POST(req:Request){try{
 origin(req);const client=await catalogClient();const v=input.parse(await req.json());
 if(v.kind==='product'){const {images,...p}=v.value;check((await client.rpc('save_product',{p_product:p,p_images:images})).error);}
 else if(v.kind==='category')check((await client.from('categories').upsert(v.value)).error);
 else check((await client.from(v.value.table).delete().eq('id',v.value.id)).error);
 return NextResponse.json({ok:true});
}catch(e){return failure(e)}}

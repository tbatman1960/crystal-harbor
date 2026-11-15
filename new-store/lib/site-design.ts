
import {z} from 'zod';
const hex=z.string().regex(/^#[0-9a-fA-F]{6}$/,'Use a six-digit hex color, e.g. #be2468');
const section=z.enum(['hero','sizes','gallery','how','shipping']);
export function luminance(hex:string){const c=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4));return c[0]*.2126+c[1]*.7152+c[2]*.0722;}
export function contrast(a:string,b:string){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
export function onColor(bg:string){return contrast('#ffffff',bg)>=contrast('#231527',bg)?'#ffffff':'#231527';}
export const designSchema=z.object({
 brand_name:z.string().trim().min(2).max(60).default('SnuggleBug'),
 primary:hex.default('#253b32'), background:hex.default('#faf8f2'), ink:hex.default('#253b32'), secondary:hex.default('#e3e9df'),
 font:z.enum(['classic','playful','rounded','clean']).default('classic'),
 desktop_columns:z.number().int().min(1).max(4).default(4),mobile_columns:z.number().int().min(1).max(2).default(2),
 image_shape:z.enum(['portrait','square']).default('portrait'),image_fit:z.enum(['cover','contain']).default('cover'),
 radius:z.number().int().min(0).max(32).default(16),spacing:z.enum(['compact','comfortable','airy']).default('comfortable'),
 buttons:z.enum(['pill','soft']).default('pill'),show_mascot:z.boolean().default(false),
 announcement_enabled:z.boolean().default(true),announcement:z.string().trim().max(140).default('READY-TO-SHIP FINDS FOR YOUR COZIEST DAYS.'),
 home_sections:z.array(section).min(1).max(5).default(['hero','sizes','gallery','how']),
 design_order:z.array(z.string().regex(/^[a-z0-9-]+$/).max(100)).max(50).default([]),
 product_entry:z.enum(['details_first','size_first']).default('details_first'),
 checkout_layout:z.enum(['one_page','guided']).default('one_page')
}).strict().superRefine((d,ctx)=>{
 if(!d.home_sections.includes('gallery')||new Set(d.home_sections).size!==d.home_sections.length)ctx.addIssue({code:'custom',path:['home_sections'],message:'Include the product gallery exactly once.'});
 if(new Set(d.design_order).size!==d.design_order.length)ctx.addIssue({code:'custom',path:['design_order'],message:'Do not repeat designs.'});
 if(contrast(d.ink,d.background)<4.5||contrast(d.ink,d.secondary)<4.5)ctx.addIssue({code:'custom',path:['ink'],message:'Choose darker text or lighter backgrounds so text remains readable (4.5:1 contrast).'});
});
export type SiteDesign=z.infer<typeof designSchema>;
export const defaultDesign:SiteDesign=designSchema.parse({});
export const designPresets:Record<string,SiteDesign>={
 classic:defaultDesign,
 playful:designSchema.parse({...defaultDesign,font:'playful',primary:'#be2468',background:'#fffaf6',ink:'#3c2448',secondary:'#f0e4fa'}),
 lavender:designSchema.parse({...defaultDesign,primary:'#71408e',secondary:'#eee4ff',background:'#fdf9ff',ink:'#382344'}),
 sunshine:designSchema.parse({...defaultDesign,primary:'#ad3d34',secondary:'#fff0ce',background:'#fffcf3',ink:'#4d302d'}),
 clean:designSchema.parse({...defaultDesign,font:'clean',primary:'#3b526e',secondary:'#edf2f7',background:'#ffffff',ink:'#253143',radius:12,buttons:'soft'})
};
export function designCss(d:SiteDesign){
 const display={classic:'Georgia,serif',playful:'SnuggleDisplay,Arial,sans-serif',rounded:'SnuggleBody,Arial,sans-serif',clean:'Arial,Helvetica,sans-serif'}[d.font];
 const body=d.font==='classic'?'Arial,Helvetica,sans-serif':d.font==='clean'?'Arial,Helvetica,sans-serif':'SnuggleBody,Arial,sans-serif';
 const gap={compact:12,comfortable:24,airy:36}[d.spacing];
 return `
 .storefront{background:${d.background}!important;color:${d.ink}!important;font-family:${body}}
 .storefront h1,.storefront h2,.storefront h3,.storefront .font-serif{font-family:${display}!important}
 .storefront [class*='text-ink']{color:${d.ink}!important}
 .storefront .hero-panel{background:${d.secondary}!important}
 .storefront header{background:${d.background}!important}
 .storefront footer,.storefront .notice{background:${d.secondary}!important;color:${d.ink}!important}
 .storefront .btn,.storefront .btn:hover,.storefront .season-announcement{background:${d.primary}!important;color:${onColor(d.primary)}!important}
 .storefront .btn{border-radius:${d.buttons==='pill'?999:12}px!important}
 .storefront .panel,.storefront .product-photo{border-radius:${d.radius}px!important}
 .storefront .product-gallery{grid-template-columns:repeat(${d.desktop_columns},minmax(0,1fr))!important;gap:${gap}px!important}
 .storefront .product-photo{aspect-ratio:${d.image_shape==='portrait'?'4/5':'1/1'}!important}
 .storefront .product-photo img,.storefront .detail-photo img{object-fit:${d.image_fit}!important}
 @media(max-width:767px){.storefront .product-gallery{grid-template-columns:repeat(${d.mobile_columns},minmax(0,1fr))!important;gap:${Math.max(10,gap-6)}px!important}}
 `;
}
export function orderDesigns<T extends {product:{id:string;design_slug:string|null}}>(groups:T[],order:string[]){
 const position=new Map(order.map((key,index)=>[key,index]));
 return [...groups].sort((a,b)=>(position.get(a.product.design_slug||a.product.id)??Number.MAX_SAFE_INTEGER)-(position.get(b.product.design_slug||b.product.id)??Number.MAX_SAFE_INTEGER));
}

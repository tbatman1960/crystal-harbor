
import {z} from 'zod';
const hex=z.string().regex(/^#[0-9a-fA-F]{6}$/,'Use a six-digit hex color, e.g. #be2468');
const section=z.enum(['gallery','how','sizes','shipping','rewards']);
export function luminance(hex:string){const c=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4));return c[0]*.2126+c[1]*.7152+c[2]*.0722;}
export function contrast(a:string,b:string){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
export function onColor(bg:string){return contrast('#ffffff',bg)>=contrast('#231527',bg)?'#ffffff':'#231527';}
export const designSchema=z.object({
 brand_name:z.string().trim().min(2).max(60).default('SnuggleBug'),
 primary:hex.default('#be2468'), background:hex.default('#fffaf6'), ink:hex.default('#3c2448'), secondary:hex.default('#f0e4fa'),
 font:z.enum(['playful','rounded','clean']).default('playful'),
 desktop_columns:z.number().int().min(1).max(3).default(2),mobile_columns:z.number().int().min(1).max(2).default(1),
 image_shape:z.enum(['portrait','square']).default('portrait'),image_fit:z.enum(['cover','contain']).default('cover'),
 radius:z.number().int().min(0).max(32).default(24),spacing:z.enum(['compact','comfortable','airy']).default('comfortable'),
 buttons:z.enum(['pill','soft']).default('pill'),show_mascot:z.boolean().default(true),
 announcement_enabled:z.boolean().default(true),announcement:z.string().trim().max(140).default('Big smiles. Bigger snuggles. Made with your photo.'),
 home_sections:z.array(section).min(1).max(5).default(['gallery','how','sizes','shipping','rewards']),
 design_order:z.array(z.string().regex(/^[a-z0-9-]+$/).max(100)).max(50).default([]),
 product_entry:z.enum(['details_first','customize_first']).default('details_first'),
 size_selection:z.enum(['on_product','in_customizer']).default('on_product'),
 customizer_order:z.enum(['options_first','preview_first']).default('options_first'),
 checkout_layout:z.enum(['one_page','guided']).default('one_page')
}).strict().superRefine((d,ctx)=>{
 if(!d.home_sections.includes('gallery')||new Set(d.home_sections).size!==d.home_sections.length)ctx.addIssue({code:'custom',path:['home_sections'],message:'Include the product gallery exactly once.'});
 if(new Set(d.design_order).size!==d.design_order.length)ctx.addIssue({code:'custom',path:['design_order'],message:'Do not repeat designs.'});
 if(contrast(d.ink,d.background)<4.5||contrast(d.ink,d.secondary)<4.5)ctx.addIssue({code:'custom',path:['ink'],message:'Choose darker text or lighter backgrounds so text remains readable (4.5:1 contrast).'});
});
export type SiteDesign=z.infer<typeof designSchema>;
export const defaultDesign:SiteDesign=designSchema.parse({});
export const designPresets:Record<string,SiteDesign>={
 playful:defaultDesign,
 lavender:designSchema.parse({...defaultDesign,primary:'#71408e',secondary:'#eee4ff',background:'#fdf9ff',ink:'#382344'}),
 sunshine:designSchema.parse({...defaultDesign,primary:'#ad3d34',secondary:'#fff0ce',background:'#fffcf3',ink:'#4d302d'}),
 clean:designSchema.parse({...defaultDesign,font:'clean',primary:'#3b526e',secondary:'#edf2f7',background:'#ffffff',ink:'#253143',radius:12,buttons:'soft'})
};
export function designCss(d:SiteDesign){
 const display=d.font==='playful'?'SnuggleDisplay,Arial,sans-serif':d.font==='rounded'?'SnuggleBody,Arial,sans-serif':'Arial,Helvetica,sans-serif';
 const body=d.font==='clean'?'Arial,Helvetica,sans-serif':'SnuggleBody,Arial,sans-serif';
 const gap={compact:12,comfortable:24,airy:36}[d.spacing],radius=d.radius,onPrimary=onColor(d.primary),link=contrast(d.primary,d.background)>=4.5?d.primary:d.ink;
 return `
 .photo-studio{background:${d.background}!important;color:${d.ink}!important;font-family:${body}!important;--party-pink:${d.primary};--editor-primary:${d.primary};--editor-on-primary:${onPrimary}}
 .photo-studio h1,.photo-studio h2,.photo-studio h3,.photo-studio .font-serif,.photo-studio .fun-brand-letters,.photo-studio .fun-main-nav,.photo-studio .btn,.photo-studio .fun-make-yours,.photo-studio .landing-details summary{font-family:${display}!important}
 .photo-studio input,.photo-studio select,.photo-studio textarea,.photo-studio button,.photo-studio .fun-price,.photo-studio label{font-family:${body}!important}
 .photo-studio header{background:${d.background}!important}
 .photo-studio footer,.photo-studio .notice,.photo-studio .processing-card{background:${d.secondary}!important;color:${d.ink}!important}
 .photo-studio .btn,.photo-studio .btn:hover{background:${d.primary}!important;color:${onPrimary}!important;border-color:${d.primary}!important;border-radius:${d.buttons==='pill'?999:12}px!important;box-shadow:0 4px 0 ${d.ink}25!important}
 .photo-studio .btn:disabled{background:#887184!important;color:#fff!important}
 .photo-studio .season-announcement{background:${d.primary}!important;color:${onPrimary}!important}
 .photo-studio .fun-brand-letters{color:${d.ink}!important}.photo-studio .fun-brand-bug{color:${d.primary}!important}
 .photo-studio .fun-make-yours,.photo-studio .studio-label{color:${link}!important}
 .photo-studio .fun-main-nav a{color:${d.ink}!important}
 .photo-studio .fun-main-nav a[href='/customize'],.photo-studio .party-bag{background:${d.secondary}!important;color:${d.ink}!important}
 .photo-studio .fun-bug{display:${d.show_mascot?'block':'none'}!important}
 .photo-studio .landing-gallery{grid-template-columns:repeat(${d.desktop_columns},minmax(0,1fr))!important;gap:${gap}px!important}
 .photo-studio .landing-photo{aspect-ratio:${d.image_shape==='portrait'?'4/5':'1/1'}!important;border-radius:${Math.max(0,radius-2)}px ${Math.max(0,radius-2)}px 0 0!important}
 .photo-studio .landing-photo img{object-fit:${d.image_fit}!important}
 .photo-studio .landing-product,.photo-studio .panel,.photo-studio .studio-dialog,.photo-studio .history-card{border-radius:${radius}px!important}
 .photo-studio .landing-product{background:${d.secondary===defaultDesign.secondary?'var(--card-tint)':d.secondary}!important;border-color:${d.primary===defaultDesign.primary?'var(--card-line)':d.primary+'35'}!important}
 @media(max-width:600px){.photo-studio .landing-gallery{grid-template-columns:repeat(${d.mobile_columns},minmax(0,1fr))!important;gap:${Math.max(10,gap-6)}px!important}${d.mobile_columns===2?'.photo-studio .landing-product-caption{padding:10px!important}.photo-studio .landing-product-caption h2{font-size:15px!important}.photo-studio .fun-card-bottom{flex-wrap:wrap!important}':''}}
 @media(max-width:767px){.photo-studio .studio-customizer>div{order:${d.customizer_order==='preview_first'?1:2}}.photo-studio .studio-customizer>section{order:${d.customizer_order==='preview_first'?2:1}}}
 `;
}

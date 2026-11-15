
import {HappySparkle} from '@/components/brand-wordmark';
import {service,check} from '@/lib/supabase';
import {readWebsiteDesign} from '@/lib/website-editor-server';
import {money} from '@/lib/types';
import Link from 'next/link';
import Image from 'next/image';
import {catalog} from '@/lib/data';
import {catalogImage} from '@/lib/personalization/catalog-reference';
import {groupCatalog} from '@/lib/catalog-presentation';
export const dynamic='force-dynamic';
export default async function Home(){
 const {config:d}=await readWebsiteDesign();
 const products=process.env.NEXT_PUBLIC_SUPABASE_URL?await catalog():[];
 const designs=groupCatalog(products).sort((a,b)=>{const ai=d.design_order.indexOf(a.product.design_slug||a.product.id),bi=d.design_order.indexOf(b.product.design_slug||b.product.id);return (ai<0?999:ai)-(bi<0?999:bi)});
 const {data:offers,error}=process.env.NEXT_PUBLIC_SUPABASE_URL?await service().from('studio_settings').select('*').eq('id',1).single():{data:null,error:null};check(error);
 return <div className="gallery-landing"><h1 className="sr-only">Personalized photo blankets</h1>
 {d.home_sections.map(section=>{
 if(section==='gallery')return <section id="blankets" className="landing-gallery" aria-label="Choose your blanket design" key={section}>{designs.map(({product:p},i)=><article className="landing-product" key={p.id}><Link href={d.product_entry==='customize_first'?'/customize?product='+p.slug:'/products/'+p.slug}><div className="landing-photo"><Image src={catalogImage(p)||'/placeholder.svg'} alt={p.name} fill priority={i<2} sizes={d.mobile_columns===1?'(max-width:600px) 96vw, 49vw':'(max-width:600px) 48vw, 49vw'} className="object-cover"/><span className="fun-photo-sparkle"><HappySparkle/></span></div><div className="landing-product-caption"><h2>{p.name.replace(/^Personalized /,'')}</h2><div className="fun-card-bottom"><span className="fun-price">From {money(p.price_cents)}</span><span className="fun-make-yours">Make it yours →</span></div></div></Link></article>)}</section>;
 if(section==='rewards'&&!offers?.rewards_enabled)return null;
 return <section className="landing-details editor-home-detail" key={section} aria-label={section}><details><summary>{{how:'A little photo magic',sizes:'Blanket sizes & prices',shipping:'Shipping & delivery',rewards:'Earn a discount on your next order'}[section]}</summary>
 {section==='how'&&<><p>Choose a blanket and size, upload your photo, then review your personalized preview. Approve your favorite to add it to your bag.</p><Link className="link" href="/shop">Choose a blanket →</Link></>}
 {section==='sizes'&&<div className="landing-size-guide">{[[30,40,13],[40,50,19],[50,60,25],[60,80,32]].map(([w,h,p])=><div key={w}><svg viewBox="0 0 100 100" aria-hidden="true"><rect x={(100-w)/2} y={90-h} width={w} height={h} rx="3" fill="#e8bfd2" stroke="#b45c84"/></svg><strong>{w} × {h} in</strong><span>${p}</span></div>)}</div>}
 {section==='shipping'&&<p>$7 for the first blanket, plus $1 each additional. Mix designs and sizes, up to five blankets per order. Delivery is available outside Indiana.</p>}
 {section==='rewards'&&offers&&<p>Spend {money(offers.reward_threshold_cents)} on merchandise and earn {offers.reward_percent}% off a future order of {money(offers.reward_minimum_cents)} or more. Qualifying subtotal is after discounts and before shipping and tax. Your single-use coupon is emailed after payment, is valid for {offers.reward_valid_days} days, and requires the same email address.</p>}
 </details></section>
 })}
 {!designs.length&&<p className="notice">Our blanket collection is coming soon.</p>}
 <div className="landing-shopping-links"><span>Your face. Your favorite print. Your kind of cozy.</span><Link href="/shop" className="link">View all blankets →</Link></div>
 </div>
}

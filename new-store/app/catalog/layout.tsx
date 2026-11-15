import Link from 'next/link';
import {catalogAccess} from '@/lib/catalog-access';
export const dynamic='force-dynamic';
export const metadata={title:'Product management',robots:{index:false,follow:false}};
export default async function Layout({children}:{children:React.ReactNode}){
 let access;try{access=await catalogAccess()}catch(e){if(e instanceof Error&&['Unauthorized','Forbidden'].includes(e.message))return <section><h1>Product management</h1><p className="notice">Sign in with an email that has product access, or ask the store administrator to grant it.</p><Link className="btn" href="/auth?next=/catalog">Sign in</Link></section>;throw e;}
 return <div className="shell py-8"><h1 className="text-3xl">Product management</h1><p className="notice">Add and update product photos, descriptions, sizes, prices and availability. Saved catalog changes appear on the live website immediately.</p><nav className="flex flex-wrap gap-5 my-6" aria-label="Product management"><Link className="link" href="/catalog/products">Products</Link><Link className="link" href="/catalog/categories">Categories</Link>{access.design&&<Link className="link" href="/studio">Website editor</Link>}{access.owner&&<Link className="link" href="/admin">Store administration</Link>}<Link className="link" href="/">Storefront</Link></nav>{children}</div>;
}

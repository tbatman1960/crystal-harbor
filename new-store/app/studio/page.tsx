
import Link from 'next/link';
import {websiteAccess} from '@/lib/website-editor-server';
import {WebsiteEditor} from '@/components/website-editor';
export const dynamic='force-dynamic';
export const metadata={title:'Website editor',robots:{index:false,follow:false}};
export default async function Studio(){
 try{const a=await websiteAccess();return <div className="shell py-8"><WebsiteEditor owner={a.owner}/></div>}catch(e){
 const message=e instanceof Error?e.message:'';
 if(message!=='Unauthorized'&&message!=='Forbidden')throw e;
 return <div className="shell py-16"><h1>Website editor</h1><p className="my-5">{message==='Unauthorized'?'Sign in with the email your store administrator granted design access to.':'This account does not have design access. Ask the store administrator to add your verified email address.'}</p><Link className="btn" href="/auth?next=/studio">Sign in</Link><Link className="link ml-5" href="/">Back to store</Link></div>
 }
}

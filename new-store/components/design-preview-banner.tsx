
'use client';
import Link from 'next/link';
import {useState} from 'react';
export function DesignPreviewBanner(){const [error,setError]=useState('');return <aside className="design-preview-banner" role="status"><span>Private draft preview · Customers see the published design</span><Link href="/studio" className="link">Back to editor</Link><button className="link" onClick={async()=>{try{const r=await fetch('/api/studio/design',{method:'DELETE'});if(!r.ok)throw Error('Could not exit preview. Sign in to the editor again.');window.location.reload()}catch(e){setError((e as Error).message)}}}>Exit preview</button>{error&&<span>{error}</span>}</aside>}

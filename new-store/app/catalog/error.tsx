'use client';
export default function ErrorPage({reset}:{reset:()=>void}){return <section className="shell py-12"><h1>Product management is unavailable</h1><p role="alert">Sign in with an account that has product access, or try again.</p><a className="link mr-5" href="/auth?next=/catalog">Sign in</a><button className="btn" onClick={reset}>Try again</button></section>}

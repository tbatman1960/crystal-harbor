import type { Metadata } from 'next';
import Link from 'next/link';
import { settings } from '@/lib/data';
import { Analytics } from '@/components/analytics';
import { CartProvider, CartCount } from '@/components/cart-provider';
import './globals.css';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || 'http://localhost:3000'),
  title: {
    default: 'SnuggleBug · A little comfort. A lot of character.',
    template: '%s · SnuggleBug',
  },
  description:
    'Printed blankets in cozy sizes, playful character designs, and seasonal finds. Find your next favorite at SnuggleBug.',
};
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const store = process.env.NEXT_PUBLIC_SUPABASE_URL ? await settings() : null;
  return (
    <html lang="en">
      <body>
        <CartProvider>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:p-4"
          >
            Skip to content
          </a>
          <Analytics id={store?.ga4_id || null} />
          <div className="bg-ink px-4 py-2 text-center text-xs tracking-widest text-white">
            READY-TO-SHIP FINDS FOR YOUR COZIEST DAYS.
          </div>
          <header className="border-b border-ink/10">
            <div className="shell flex min-h-24 flex-wrap items-center justify-between gap-4 py-5">
              <Link className="font-serif text-2xl tracking-tight" href="/">
                {store?.store_name || 'SnuggleBug'}
                <span className="block text-[9px] font-sans uppercase tracking-[.3em]">
                  a little comfort, a lot of character
                </span>
              </Link>
              <nav
                aria-label="Main navigation"
                className="flex items-center gap-5 text-sm"
              >
                <Link href="/shop">Shop</Link>
                <Link href="/about" className="hidden sm:block">
                  Our story
                </Link>
                <Link href="/account">Account</Link>
                <Link
                  href="/cart"
                  className="rounded-full border border-ink/20 px-4 py-2"
                >
                  Bag (<CartCount />)
                </Link>
              </nav>
            </div>
          </header>
          <main id="main" className="min-h-[65vh]">
            {children}
          </main>
          <footer className="mt-20 border-t border-ink/15 bg-sage/40 py-12">
            <div className="shell grid gap-8 sm:grid-cols-3">
              <div>
                <p className="font-serif text-2xl">
                  {store?.store_name || 'SnuggleBug'}
                </p>
                <p className="mt-3 text-sm">
                  For big imaginations and little everyday comforts.
                </p>
              </div>
              <nav
                aria-label="Footer"
                className="flex flex-col items-start gap-3 text-sm"
              >
                <Link href="/shop">Explore the collection</Link>
                <Link href="/about">Our story</Link>
                <Link href="/contact">Contact & shipping</Link>
                <Link href="/policies">Returns & privacy</Link>
              </nav>
              <div className="text-sm">
                <p>Secure checkout with Stripe</p>
                <p className="mt-2">Carefully packed. Shipped with USPS.</p>
                <p className="mt-5 text-ink/70">
                  © {new Date().getFullYear()}{' '}
                  {store?.store_name || 'SnuggleBug'}
                </p>
              </div>
            </div>
          </footer>
        </CartProvider>
      </body>
    </html>
  );
}

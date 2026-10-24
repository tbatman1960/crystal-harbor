import Link from 'next/link';
import { admin } from '@/lib/supabase';
export const dynamic = 'force-dynamic';
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await admin();
  return (
    <div className="shell py-8">
      <div className="mb-8 border-b border-ink/20 pb-5">
        <p className="eyebrow mb-5 text-clay">Store studio</p>
        <nav
          className="flex flex-wrap gap-x-6 gap-y-4 text-sm"
          aria-label="Store administration"
        >
          {[
            ['', 'Overview'],
            ['products', 'Products'],
            ['categories', 'Categories'],
            ['orders', 'Orders'],
            ['personalizations', 'Artwork'],
            ['customers', 'Customers'],
            ['settings', 'Settings'],
          ].map(([path, name]) => (
            <Link key={path} className="link" href={`/admin/${path}`}>
              {name}
            </Link>
          ))}
        </nav>
      </div>
      {children}
    </div>
  );
}

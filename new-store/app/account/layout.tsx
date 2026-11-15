import Link from 'next/link';
import { account } from '@/lib/account';
import { Logout } from '@/components/ui';
export const dynamic = 'force-dynamic';
export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await account();
  return (
    <div className="shell py-10">
      <nav aria-label="Account" className="mb-10 flex flex-wrap gap-5 text-sm">
        <Link className="link" href="/account">
          My orders
        </Link>
        <Link className="link" href="/account/profile">
          Profile & address
        </Link>
        <Link className="link" href="/designs">
          My saved designs
        </Link>
        {profile.is_admin && (
          <Link className="link" href="/admin">
            Manage store
          </Link>
        )}
        <Logout />
      </nav>
      {children}
    </div>
  );
}

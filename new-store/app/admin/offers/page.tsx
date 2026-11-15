import { admin } from '@/lib/supabase';
import { OffersAdmin } from '@/components/studio-admin';
export default async function Offers() {
  await admin();
  return <OffersAdmin />;
}

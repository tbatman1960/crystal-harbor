import { admin } from '@/lib/supabase';
import { ReviewsAdmin } from '@/components/studio-admin';
export default async function Reviews() {
  await admin();
  return <ReviewsAdmin />;
}

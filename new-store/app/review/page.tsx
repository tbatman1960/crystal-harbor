import { z } from 'zod';
import { ReviewForm } from '@/components/review-form';
import { verifyReviewToken } from '@/lib/review-token';
export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Review your blanket',
  robots: { index: false, follow: false },
};
export default function Review({
  searchParams,
}: {
  searchParams: { item?: string; token?: string };
}) {
  const signed = searchParams.token
    ? verifyReviewToken(
        searchParams.token,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
      )
    : null;
  const id = signed || searchParams.item;
  return (
    <div className="shell py-12">
      <h1>How did we do?</h1>
      <p className="mt-4">Share your experience after your order ships.</p>
      {id && z.string().uuid().safeParse(id).success ? (
        <ReviewForm itemId={id} token={searchParams.token} />
      ) : (
        <p className="notice">
          Open the review link in your order email or signed-in order history.
        </p>
      )}
    </div>
  );
}

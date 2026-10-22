import Link from 'next/link';
export default function NotFound() {
  return (
    <div className="shell py-20">
      <p className="eyebrow">404</p>
      <h1 className="my-6">A little off the path</h1>
      <p className="mb-8">We couldn’t find that page or product.</p>
      <Link className="btn" href="/shop">
        Back to the collection
      </Link>
    </div>
  );
}

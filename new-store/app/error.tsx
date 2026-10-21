'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="shell py-20">
      <h1 className="text-4xl">Something went wrong</h1>
      <p className="my-6">
        We couldn’t load this page. Please try again in a moment.
      </p>
      <button className="btn" onClick={reset}>
        Try again
      </button>
    </div>
  );
}

export default function Loading() {
  return (
    <div className="shell py-20" role="status" aria-live="polite">
      <p className="eyebrow animate-pulse">Gathering good things…</p>
      <div className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            className="aspect-[4/5] animate-pulse rounded-xl bg-sage"
            key={i}
          />
        ))}
      </div>
    </div>
  );
}

/** Original SnuggleBug lettering and a tiny happy bug; never a generated customer image. */
export function BrandWordmark({ name = 'SnuggleBug' }: { name?: string }) {
  const snuggle = name.replace(/\s/g, '').toLowerCase() === 'snugglebug';
  return (
    <span className="fun-brand" aria-label={name}>
      <span className="fun-brand-letters">
        {snuggle ? (
          <>
            <span>Snuggle</span>
            <span className="fun-brand-bug">Bug</span>
          </>
        ) : (
          name
        )}
      </span>
      <svg className="fun-bug" viewBox="0 0 58 62" aria-hidden="true">
        <path
          d="M22 18Q13 7 9 13M34 18Q43 6 48 13"
          fill="none"
          stroke="#49304e"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="9" cy="13" r="3" fill="#e8357b" />
        <circle cx="48" cy="13" r="3" fill="#e8357b" />
        <path
          d="M28 31Q8 13 4 33Q2 53 24 51M30 31Q50 13 54 33Q56 53 34 51"
          fill="#ffcb60"
          stroke="#49304e"
          strokeWidth="2"
        />
        <ellipse
          cx="29"
          cy="40"
          rx="12"
          ry="18"
          fill="#f5a5c7"
          stroke="#49304e"
          strokeWidth="2"
        />
        <circle
          cx="29"
          cy="24"
          r="13"
          fill="#fff4dc"
          stroke="#49304e"
          strokeWidth="2"
        />
        <circle cx="24" cy="23" r="1.7" fill="#49304e" />
        <circle cx="34" cy="23" r="1.7" fill="#49304e" />
        <path
          d="M25 29Q29 33 33 29M23 44h12"
          fill="none"
          stroke="#49304e"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="14" cy="35" r="3" fill="#e86a9c" />
        <circle cx="44" cy="35" r="3" fill="#e86a9c" />
      </svg>
    </span>
  );
}
export function HappySparkle() {
  return (
    <svg viewBox="0 0 36 36" aria-hidden="true">
      <path
        d="M18 2Q19 16 34 18Q19 20 18 34Q16 20 2 18Q16 16 18 2Z"
        fill="#ffd36f"
        stroke="#613b72"
        strokeWidth="1.5"
      />
    </svg>
  );
}

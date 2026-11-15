'use client';
import { money } from '@/lib/types';
export function SizeSelector({
  sizes,
  selected,
  onSelect,
}: {
  sizes: { id: string; size_label: string | null; price_cents: number }[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-3 font-semibold">Choose your blanket size</legend>
      <div className="size-visual-grid">
        {sizes.map((s) => {
          const dims = (s.size_label || '').match(/(\d+)\s*[×x]\s*(\d+)/);
          const w = Number(dims?.[1] || 30),
            h = Number(dims?.[2] || 40);
          return (
            <button
              type="button"
              key={s.id}
              aria-pressed={selected === s.id}
              onClick={() => onSelect(s.id)}
              className="size-visual"
            >
              <svg viewBox="0 0 100 100" aria-hidden="true">
                <path d="M6 88h88" stroke="#d8d2dc" />
                <rect
                  x={(100 - w) / 2}
                  y={88 - h}
                  width={w}
                  height={h}
                  rx="3"
                  fill={selected === s.id ? '#cf216b' : '#eadfe8'}
                  stroke="#9f1d53"
                />
                <path
                  d={`M${(100 - w) / 2 + 5} ${93 - h}h${w - 10}v${h - 10}h-${w - 10}Z`}
                  fill="none"
                  stroke="white"
                  strokeDasharray="2 2"
                />
              </svg>
              <strong>
                {w} × {h} in
              </strong>
              <span>{money(s.price_cents)}</span>
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-ink/60">
        Blanket rectangles are shown in proportion. Dimensions are in inches.
      </p>
    </fieldset>
  );
}

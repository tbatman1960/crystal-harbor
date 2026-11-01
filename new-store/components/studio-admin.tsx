'use client';
import { useEffect, useState } from 'react';
import { money } from '@/lib/types';
type Offer = {
  rewards_enabled: boolean;
  reward_threshold_cents: number;
  reward_percent: number;
  reward_minimum_cents: number;
  reward_valid_days: number;
};
type Coupon = {
  id: string;
  code: string;
  email: string;
  percent: number;
  minimum_cents: number;
  active: boolean;
  expires_at: string;
  redeemed_order_id: string | null;
};
type Review = {
  id: string;
  display_name: string;
  rating: number;
  title: string;
  body: string;
  status: string;
  admin_reply: string | null;
};
async function call(path: string, method = 'GET', body?: unknown) {
  const r = await fetch(path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const d = await r.json();
  if (!r.ok) throw Error(d.error || 'Request failed');
  return d;
}
export function OffersAdmin() {
  const [settings, setSettings] = useState<Offer | null>(null),
    [coupons, setCoupons] = useState<Coupon[]>([]),
    [error, setError] = useState(''),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false);
  async function load() {
    try {
      const d = await call('/api/admin/studio');
      setSettings(d.settings);
      setCoupons(d.coupons);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  return (
    <>
      <h1>Offers & rewards</h1>
      <p className="mt-3">
        Customers earn an email-bound, single-use coupon for their next order
        after a qualifying paid purchase. Thresholds exclude shipping and tax
        and use the subtotal after discounts.
      </p>
      {error && (
        <p role="alert" className="notice">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="notice">
          {message}
        </p>
      )}
      {!settings ? (
        <p role="status">Loading offers…</p>
      ) : (
        <form
          className="panel mt-6 max-w-xl space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError('');
            try {
              await call('/api/admin/studio', 'PUT', settings);
              setMessage('Reward settings saved.');
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <h2 className="text-xl">Automatic next-order reward</h2>
          <label className="studio-check">
            <input
              type="checkbox"
              checked={settings.rewards_enabled}
              onChange={(e) =>
                setSettings({ ...settings, rewards_enabled: e.target.checked })
              }
            />
            Enable rewards
          </label>
          {(
            [
              [
                'reward_threshold_cents',
                'Qualifying merchandise subtotal ($)',
                100,
              ],
              ['reward_percent', 'Discount (%)', 1],
              ['reward_minimum_cents', 'Next-order minimum ($)', 100],
              ['reward_valid_days', 'Coupon validity (days)', 1],
            ] as const
          ).map(([key, label, scale]) => (
            <label key={key}>
              {label}
              <input
                type="number"
                min={1}
                max={
                  key === 'reward_percent'
                    ? 50
                    : key === 'reward_valid_days'
                      ? 365
                      : 10000
                }
                step={scale === 100 ? '.01' : 1}
                value={settings[key] / scale}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    [key]: Math.round(Number(e.target.value) * scale),
                  })
                }
              />
            </label>
          ))}
          <button className="btn" disabled={busy}>
            Save reward settings
          </button>
        </form>
      )}
      <form
        className="panel mt-6 max-w-xl space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError('');
          const f = new FormData(e.currentTarget);
          try {
            const d = await call('/api/admin/studio', 'POST', {
              email: f.get('email'),
              percent: Number(f.get('percent')),
              minimum_cents: Math.round(Number(f.get('minimum')) * 100),
              valid_days: Number(f.get('days')),
            });
            setMessage(
              `Coupon created: ${d.code}. Share it privately with the customer.`,
            );
            await load();
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <h2 className="text-xl">Create a coupon manually</h2>
        <label>
          Customer email
          <input type="email" name="email" required />
        </label>
        <label>
          Discount (%)
          <input
            type="number"
            name="percent"
            min={1}
            max={50}
            defaultValue={10}
            required
          />
        </label>
        <label>
          Minimum subtotal ($)
          <input
            type="number"
            name="minimum"
            min={1}
            step=".01"
            defaultValue={40}
            required
          />
        </label>
        <label>
          Valid for (days)
          <input
            type="number"
            name="days"
            min={1}
            max={365}
            defaultValue={30}
            required
          />
        </label>
        <button className="btn" disabled={busy}>
          Create coupon
        </button>
      </form>
      <h2 className="text-2xl mt-8">Recent coupons</h2>
      <div className="grid gap-4 mt-4 md:grid-cols-2">
        {coupons.map((c) => (
          <article key={c.id} className="panel break-all">
            <p className="font-bold">{c.code}</p>
            <p className="text-sm mt-2">
              {c.email} · {c.percent}% off · minimum {money(c.minimum_cents)}
            </p>
            <p className="text-sm">
              {c.redeemed_order_id ? 'Used' : c.active ? 'Active' : 'Disabled'}{' '}
              · expires {new Date(c.expires_at).toLocaleDateString()}
            </p>
            {!c.redeemed_order_id && (
              <button
                className="link mt-3"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await call('/api/admin/studio', 'PATCH', {
                      id: c.id,
                      active: !c.active,
                    });
                    await load();
                  } catch (e) {
                    setError((e as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {c.active ? 'Disable' : 'Enable'}
              </button>
            )}
          </article>
        ))}
      </div>
    </>
  );
}
export function ReviewsAdmin() {
  const [items, setItems] = useState<Review[] | null>(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState('');
  useEffect(() => {
    call('/api/admin/reviews')
      .then((d) => setItems(d.reviews))
      .catch((e) => setError(e.message));
  }, []);
  return (
    <>
      <h1>Customer reviews</h1>
      <p className="mt-3">
        Only verified purchases can be reviewed. Publish or hide reviews
        consistently regardless of rating; do not change a customer’s words.
      </p>
      {error && (
        <p role="alert" className="notice">
          {error}
        </p>
      )}
      {!items ? (
        <p role="status">Loading reviews…</p>
      ) : !items.length ? (
        <p className="notice">No reviews submitted yet.</p>
      ) : (
        <div className="grid gap-5 mt-6 md:grid-cols-2">
          {items.map((i) => (
            <form
              className="panel space-y-3"
              key={i.id}
              onSubmit={async (e) => {
                e.preventDefault();
                setBusy(i.id);
                const f = new FormData(e.currentTarget);
                try {
                  await call('/api/admin/reviews', 'PATCH', {
                    id: i.id,
                    status: f.get('status'),
                    admin_reply: f.get('reply') || null,
                  });
                  setItems(
                    items.map((x) =>
                      x.id === i.id
                        ? {
                            ...x,
                            status: String(f.get('status')),
                            admin_reply: String(f.get('reply')),
                          }
                        : x,
                    ),
                  );
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy('');
                }
              }}
            >
              <p>
                {i.rating} / 5 · {i.display_name} · {i.status}
              </p>
              <h2 className="text-xl">{i.title}</h2>
              <p className="whitespace-pre-line">{i.body}</p>
              <label>
                Publication status
                <select name="status" defaultValue={i.status}>
                  <option value="pending">Pending</option>
                  <option value="published">Published</option>
                  <option value="hidden">Hidden</option>
                </select>
              </label>
              <label>
                Store reply (optional)
                <textarea
                  name="reply"
                  defaultValue={i.admin_reply || ''}
                  maxLength={1000}
                />
              </label>
              <button className="btn" disabled={busy === i.id}>
                Save review status
              </button>
            </form>
          ))}
        </div>
      )}
    </>
  );
}

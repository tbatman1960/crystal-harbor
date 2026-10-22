'use client';
import { useState } from 'react';
import type { Settings } from '@/lib/types';
import { api, Notice, Submit } from './ui';
export function SettingsForm({ settings: s }: { settings: Settings }) {
  const [v, setV] = useState(s);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);
  const texts = [
    ['store_name', 'Store name'],
    ['store_email', 'Customer support email'],
    ['admin_alert_email', 'New order alert email'],
    ['ga4_id', 'Google Analytics 4 ID (optional)'],
  ] as const;
  const nums = [
    ['tax_rate_indiana', 'Indiana tax rate (0.08 = 8%)'],
    [
      'free_shipping_threshold_cents',
      'Free shipping threshold (cents; blank disables)',
    ],
  ] as const;
  return (
    <form
      className="panel mt-8 max-w-4xl space-y-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setPending(true);
        setError('');
        setMessage('');
        try {
          await api('/api/admin', { kind: 'settings', value: v });
          setMessage('Store settings saved.');
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setPending(false);
        }
      }}
    >
      <div className="field-grid">
        {texts.map(([key, label]) => (
          <label key={key}>
            {label}
            <input
              type={key.includes('email') ? 'email' : 'text'}
              required={key !== 'ga4_id'}
              value={v[key] || ''}
              onChange={(e) =>
                setV({
                  ...v,
                  [key]:
                    key === 'ga4_id' ? e.target.value || null : e.target.value,
                })
              }
            />
          </label>
        ))}
        {nums.map(([key, label]) => (
          <label key={key}>
            {label}
            <input
              type="number"
              step={key.includes('rate') ? 0.001 : 1}
              min={0}
              max={key.includes('rate') ? 1 : undefined}
              required={key !== 'free_shipping_threshold_cents'}
              value={v[key] ?? ''}
              onChange={(e) =>
                setV({
                  ...v,
                  [key]:
                    e.target.value === '' &&
                    key === 'free_shipping_threshold_cents'
                      ? null
                      : Number(e.target.value),
                })
              }
            />
          </label>
        ))}
      </div>
      <Notice error={error} message={message} />
      <Submit pending={pending}>Save store settings</Submit>
    </form>
  );
}

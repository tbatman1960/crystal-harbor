'use client';
import { useEffect, useRef, useState } from 'react';
import type { Address } from '@/lib/types';
import { US_STATES } from '@/lib/us-states';
import { api } from './ui';
export const emptyAddress: Address = {
  name: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postal_code: '',
  country: 'US',
};
type Place = { city: string; state: string };
type Suggestion = { id: string; label: string };
const fields = [
  ['name', 'Full name', 'name'],
  ['line1', 'Street address', 'address-line1'],
  ['line2', 'Apartment, suite, etc. (optional)', 'address-line2'],
  ['city', 'City', 'address-level2'],
  ['state', 'State', 'address-level1'],
  ['postal_code', 'ZIP code', 'postal-code'],
] as const;
export function AddressFields({
  value,
  onChange,
  prefix = 'shipping',
}: {
  value: Address;
  onChange: (a: Address) => void;
  prefix?: string;
}) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [zipMessage, setZipMessage] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [text, setText] = useState('');
  const [configured, setConfigured] = useState(false);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const latest = useRef(value);
  latest.current = value;
  const change = useRef(onChange);
  change.current = onChange;
  const session = useRef('');
  const stateField = useRef<HTMLSelectElement>(null);
  useEffect(() => {
    session.current = crypto.randomUUID();
  }, []);
  useEffect(() => {
    setNotice('');
  }, [value.line1, value.line2, value.city, value.state, value.postal_code]);
  useEffect(() => {
    const zip = value.postal_code.slice(0, 5);
    setPlaces([]);
    setZipMessage('');
    if (!/^\d{5}$/.test(zip)) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const d = await api('/api/address', { action: 'zip', zip });
        if (cancelled) return;
        const options: Place[] = d.places || [];
        setPlaces(options);
        const current = latest.current;
        if (current.postal_code.slice(0, 5) !== zip) return;
        if (options.length) {
          const first = options[0];
          change.current({
            ...current,
            city: current.city || first.city,
            state: current.state || first.state,
          });
          setZipMessage(
            `ZIP ${zip}: ${options.map((p) => `${p.city}, ${p.state}`).join(' / ')}`,
          );
        }
      } catch (e) {
        if (!cancelled) setZipMessage((e as Error).message);
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [value.postal_code]);
  const mismatch =
    places.length > 0 &&
    !!value.state &&
    !places.some((p) => p.state === value.state);
  const cityMismatch =
    places.length > 0 &&
    !!value.city &&
    !places.some(
      (p) => p.city.toLowerCase() === value.city.trim().toLowerCase(),
    );
  useEffect(() => {
    stateField.current?.setCustomValidity(
      mismatch ? 'The selected state does not match this ZIP code.' : '',
    );
  }, [mismatch]);
  useEffect(() => {
    if (text.trim().length < 4) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const d = await api('/api/address', {
          action: 'suggest',
          text,
          session: session.current,
        });
        if (!cancelled) {
          setConfigured(!!d.configured);
          setSuggestions(d.suggestions || []);
        }
      } catch {
        if (!cancelled) setSuggestions([]);
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [text]);
  async function choose(item: Suggestion) {
    setSuggestions([]);
    setText('');
    setBusy(true);
    try {
      const d = await api('/api/address', {
        action: 'details',
        id: item.id,
        session: session.current,
      });
      if (d.address.country !== 'US')
        throw new Error('Please choose a US address.');
      change.current({
        ...latest.current,
        ...d.address,
        line2: latest.current.line2,
      });
      session.current = crypto.randomUUID();
      setNotice(
        'Address selected. Add an apartment or suite if needed, then verify the address.',
      );
    } catch (e) {
      setNotice((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="field-grid">
      {fields.map(([key, label, autocomplete]) => (
        <div
          key={key}
          className={key === 'line1' || key === 'line2' ? 'sm:col-span-2' : ''}
        >
          <label htmlFor={`${prefix}-${key}`}>{label}</label>
          {key === 'state' ? (
            <select
              ref={stateField}
              id={`${prefix}-${key}`}
              name={`${prefix}-${key}`}
              autoComplete={`${prefix} ${autocomplete}`}
              required
              value={value.state}
              onChange={(e) => onChange({ ...value, state: e.target.value })}
            >
              <option value="">Select a state</option>
              {US_STATES.map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
          ) : (
            <input
              id={`${prefix}-${key}`}
              autoComplete={`${prefix} ${autocomplete}`}
              name={`${prefix}-${key}`}
              required={key !== 'line2'}
              maxLength={
                key === 'postal_code' ? 10 : key === 'name' ? 100 : 150
              }
              inputMode={key === 'postal_code' ? 'numeric' : undefined}
              pattern={
                key === 'postal_code' ? '[0-9]{5}(-[0-9]{4})?' : undefined
              }
              value={value[key] || ''}
              onChange={(e) => {
                onChange({ ...value, [key]: e.target.value });
                if (key === 'line1') setText(e.target.value);
              }}
            />
          )}
          {key === 'line1' && suggestions.length > 0 && (
            <ul
              aria-label="Suggested street addresses"
              className="mt-2 rounded-lg border border-ink/20 bg-white shadow-sm"
            >
              {suggestions.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className="w-full p-3 text-left text-sm hover:bg-sage"
                    onClick={() => void choose(item)}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
      <div className="space-y-2 text-sm sm:col-span-2">
        <p role="status">{zipMessage}</p>
        {mismatch && (
          <p role="alert" className="text-red-800">
            State does not match this ZIP code. Choose {places[0].state} or
            correct the ZIP.
          </p>
        )}
        {cityMismatch && !mismatch && (
          <p>
            Check the city against the ZIP lookup above. An accepted postal city
            alias may differ.
          </p>
        )}
        {configured && (
          <button
            type="button"
            className="link"
            disabled={
              busy ||
              !value.line1 ||
              !value.city ||
              !value.state ||
              !value.postal_code
            }
            onClick={async () => {
              setBusy(true);
              try {
                const d = await api('/api/address', {
                  action: 'validate',
                  address: value,
                });
                setNotice(
                  d.message || 'Review your address before continuing.',
                );
              } catch (e) {
                setNotice((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? 'Checking address…' : 'Verify delivery address'}
          </button>
        )}
        {notice && <p role="status">{notice}</p>}
        <p className="text-ink/70">
          United States shipping only. ZIP lookup checks city and state; it does
          not confirm street delivery.{' '}
          {configured
            ? 'Street suggestions and delivery checks use Google Maps.'
            : 'You can enter your street address manually.'}
        </p>
      </div>
    </div>
  );
}

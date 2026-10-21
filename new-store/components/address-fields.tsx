'use client';
import type { Address } from '@/lib/types';
export const emptyAddress: Address = {
  name: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postal_code: '',
  country: 'US',
};
const fields = [
  ['name', 'Full name', 'name'],
  ['line1', 'Street address', 'address-line1'],
  ['line2', 'Apartment, suite, etc. (optional)', 'address-line2'],
  ['city', 'City', 'address-level2'],
  ['state', 'State (two-letter code)', 'address-level1'],
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
  return (
    <div className="field-grid">
      {fields.map(([key, label, autocomplete]) => (
        <label
          key={key}
          className={key === 'line1' || key === 'line2' ? 'sm:col-span-2' : ''}
        >
          {label}
          <input
            autoComplete={`${prefix} ${autocomplete}`}
            name={`${prefix}-${key}`}
            required={key !== 'line2'}
            maxLength={key === 'state' ? 2 : key === 'postal_code' ? 10 : 150}
            pattern={
              key === 'state'
                ? '[A-Z]{2}'
                : key === 'postal_code'
                  ? '[0-9]{5}(-[0-9]{4})?'
                  : undefined
            }
            value={value[key] || ''}
            onChange={(e) =>
              onChange({
                ...value,
                [key]:
                  key === 'state'
                    ? e.target.value.toUpperCase()
                    : e.target.value,
              })
            }
          />
        </label>
      ))}
      <p className="text-sm text-ink/70 sm:col-span-2">
        United States shipping only.
      </p>
    </div>
  );
}

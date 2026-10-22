'use client';
import { useState } from 'react';
import { AddressFields, emptyAddress } from './address-fields';
import { api, Notice, Submit } from './ui';
import type { Address } from '@/lib/types';
export function ProfileForm({
  initialName,
  address,
}: {
  initialName: string;
  address?: Address;
}) {
  const [name, setName] = useState(initialName);
  const [value, setValue] = useState(address || emptyAddress);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);
  return (
    <form
      className="panel mt-8 max-w-2xl space-y-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setPending(true);
        setError('');
        setMessage('');
        try {
          await api(
            '/api/profile',
            { full_name: name, default_shipping_address: value },
            'PUT',
          );
          setMessage('Your profile has been saved.');
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setPending(false);
        }
      }}
    >
      <label>
        Your name
        <input
          required
          maxLength={100}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <h2 className="text-2xl">Default shipping address</h2>
      <AddressFields value={value} onChange={setValue} />
      <Notice error={error} message={message} />
      <Submit pending={pending}>Save profile</Submit>
    </form>
  );
}

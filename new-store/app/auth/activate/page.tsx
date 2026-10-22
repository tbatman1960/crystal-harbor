'use client';
import { useEffect, useState } from 'react';
import { api, Notice, Submit } from '@/components/ui';
export default function Activate() {
  const [token, setToken] = useState('');
  const [type, setType] = useState('invite');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const value = params.get('token');
    setType(params.get('type') === 'recovery' ? 'recovery' : 'invite');
    window.history.replaceState(null, '', window.location.pathname);
    if (value) setToken(value);
    else setError('Open your complete invitation link to set up your account.');
  }, []);
  return <section className="mx-auto max-w-md space-y-6 py-12">
    <h1 className="text-3xl font-semibold">Set up your account</h1>
    <p>Choose a password for your SnuggleBug account.</p>
    <Notice error={error} />
    <form className="space-y-4" onSubmit={async e => {
      e.preventDefault(); setError('');
      if (password !== confirmation) { setError('Passwords must match.'); return; }
      setPending(true);
      try { await api('/api/auth/activate', { token, password, type }); window.location.replace('/admin'); }
      catch (e) { setError((e as Error).message); setPending(false); }
    }}>
      <label className="block">New password<input className="mt-1 block w-full" type="password" autoComplete="new-password" minLength={12} maxLength={100} required value={password} onChange={e => setPassword(e.target.value)} /></label>
      <p className="text-sm">Use at least 12 characters.</p>
      <label className="block">Confirm password<input className="mt-1 block w-full" type="password" autoComplete="new-password" minLength={12} maxLength={100} required value={confirmation} onChange={e => setConfirmation(e.target.value)} /></label>
      <Submit pending={pending || !token}>Set password and sign in</Submit>
    </form>
  </section>;
}

'use client';
import Link from 'next/link';
import { useState } from 'react';
import { api, Notice, Submit } from './ui';
export function AuthForm({
  mode,
  error: initial,
}: {
  mode: string;
  error?: string;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(initial || '');
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);
  const title =
    mode === 'register'
      ? 'Make yourself at home'
      : mode === 'reset'
        ? 'Reset your password'
        : mode === 'update'
          ? 'Choose a new password'
          : 'Welcome back';
  return (
    <div className="shell max-w-lg py-16">
      <p className="eyebrow mb-4 text-clay">Your SnuggleBug account</p>
      <h1 className="text-4xl">{title}</h1>
      <form
        className="mt-8 space-y-5"
        onSubmit={async (e) => {
          e.preventDefault();
          setPending(true);
          setError('');
          try {
            await api('/api/auth', {
              mode,
              email: mode === 'update' ? undefined : email,
              password: mode === 'reset' ? undefined : password,
            });
            if (mode === 'login' || mode === 'update')
              window.location.href = '/account';
            else
              setMessage(
                mode === 'register'
                  ? 'Check your email to confirm your account.'
                  : 'If an account exists, a reset link is on its way.',
              );
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setPending(false);
          }
        }}
      >
        {mode !== 'update' && (
          <label>
            Email
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
        )}
        {mode !== 'reset' && (
          <label>
            Password
            <input
              type="password"
              autoComplete={
                mode === 'login' ? 'current-password' : 'new-password'
              }
              required
              minLength={8}
              maxLength={100}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <span className="mt-2 block text-xs text-ink/70">
              At least 8 characters
            </span>
          </label>
        )}
        <Notice error={error} message={message} />
        <Submit pending={pending}>
          {mode === 'login'
            ? 'Sign in'
            : mode === 'register'
              ? 'Create account'
              : mode === 'update'
                ? 'Save password'
                : 'Send reset link'}
        </Submit>
      </form>
      <div className="mt-8 flex flex-wrap gap-5 text-sm">
        <Link className="link" href="/auth?mode=login">
          Sign in
        </Link>
        <Link className="link" href="/auth?mode=register">
          Create an account
        </Link>
        <Link className="link" href="/auth?mode=reset">
          Forgot password?
        </Link>
      </div>
    </div>
  );
}

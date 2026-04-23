'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      })
      setSubmitted(true)
    } catch (error) {
      console.error('Error:', error)
      setSubmitted(true) // Still show success to not reveal info
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="section-padding bg-background-50 min-h-screen">
      <div className="container mx-auto">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <span className="font-script text-4xl text-primary-600 tracking-wide">
              DearPast
            </span>
          </Link>
        </div>

        <div className="max-w-md mx-auto">
          <div className="card p-8">
            <h1 className="font-display font-bold text-2xl text-primary-600 mb-2 text-center">
              Reset Your Password
            </h1>

            {submitted ? (
              <div className="text-center">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <p className="text-green-800">
                    If an account exists with that email address, you'll receive a password reset link shortly. Check your inbox (and spam folder).
                  </p>
                </div>
                <p className="text-secondary-600 text-sm mb-4">
                  The link will expire in 1 hour.
                </p>
                <Link
                  href="/auth/login"
                  className="text-accent-coral-500 hover:text-accent-lime-500 font-semibold transition-colors duration-200"
                >
                  ← Back to Sign In
                </Link>
              </div>
            ) : (
              <>
                <p className="text-secondary-600 text-center mb-6">
                  Enter your email address and we'll send you a link to reset your password.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="input-field"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      autoFocus
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full"
                  >
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </form>

                <div className="text-center mt-6">
                  <Link
                    href="/auth/login"
                    className="text-secondary-600 hover:text-primary-600 transition-colors duration-200 text-sm"
                  >
                    ← Back to Sign In
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import Link from 'next/link'
import { loginCustomer, LoginData } from '@/lib/auth'
import { useAuthStore } from '@/store/authStore'

interface LoginFormProps {
  redirectTo?: string
  showRegisterLink?: boolean
}

export default function LoginForm({ redirectTo = '/', showRegisterLink = true }: LoginFormProps) {
  const [error, setError] = useState('')
  const router = useRouter()
  const { login, setLoading, isLoading } = useAuthStore()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginData>()

  const onSubmit = async (data: LoginData) => {
    setError('')
    setLoading(true)

    try {
      const result = await loginCustomer(data)

      if (result.error) {
        setError(result.error)
      } else if (result.user) {
        login(result.user)
        router.push(redirectTo)
      }
    } catch (err) {
      setError('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="card p-8">
        <div className="text-center mb-6">
          <h2 className="font-display font-bold text-2xl text-primary-600 mb-2">
            Welcome Back
          </h2>
          <p className="text-secondary-600">Sign in to your account</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              className="input-field"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              })}
            />
            {errors.email && <p className="form-error">{errors.email.message}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="input-field"
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters',
                },
              })}
            />
            {errors.password && <p className="form-error">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="btn-primary w-full"
          >
            {isSubmitting || isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/auth/forgot-password"
            className="text-accent-coral-500 hover:text-accent-coral-600 text-sm"
          >
            Forgot your password?
          </Link>
        </div>

        {showRegisterLink && (
          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-secondary-600 mb-4">Don't have an account?</p>
            <Link href="/auth/register" className="btn-outline w-full">
              Create Account
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
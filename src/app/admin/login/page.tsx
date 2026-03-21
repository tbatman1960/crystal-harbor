'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import Link from 'next/link'
import { loginAdmin, AdminLoginData } from '@/lib/admin'
import { useAdminStore } from '@/store/adminStore'

export default function AdminLoginPage() {
  const [error, setError] = useState('')
  const router = useRouter()
  const { login, setLoading, isLoading } = useAdminStore()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AdminLoginData>()

  const onSubmit = async (data: AdminLoginData) => {
    setError('')
    setLoading(true)

    try {
      const result = await loginAdmin(data)

      if (result.error) {
        setError(result.error)
      } else if (result.user) {
        login(result.user)
        router.push('/admin')
      }
    } catch (err) {
      setError('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-block mb-6">
            <div className="font-display font-bold text-2xl text-primary-600">
              Crys<span className="text-accent-lime-500">tal</span> Har<span className="text-accent-coral-500">bor</span>
            </div>
          </Link>
          <h2 className="font-display font-bold text-3xl text-neutral-800">
            Admin Portal
          </h2>
          <p className="mt-2 text-secondary-600">
            Sign in to access the admin dashboard
          </p>
        </div>

        <div className="card p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                className="input-field"
                placeholder="admin@crystalharbor.com"
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
            <p className="text-xs text-secondary-500">
              Default credentials: admin@crystalharbor.com / admin123
            </p>
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/"
            className="text-secondary-600 hover:text-primary-600 transition-colors duration-200"
          >
            ← Back to Website
          </Link>
        </div>
      </div>
    </div>
  )
}
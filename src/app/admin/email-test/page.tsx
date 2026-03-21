'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { EnvelopeIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface TestEmailForm {
  email: string
}

export default function EmailTestPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<TestEmailForm>()

  const onSubmit = async (data: TestEmailForm) => {
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ to: data.email }),
      })

      const result = await response.json()

      if (response.ok) {
        setResult({
          success: true,
          message: result.message || 'Test email sent successfully!'
        })
      } else {
        setResult({
          success: false,
          message: result.error || 'Failed to send test email'
        })
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Network error occurred. Please try again.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary-600">Email System Test</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6 max-w-2xl">
        <div className="flex items-center mb-6">
          <EnvelopeIcon className="h-8 w-8 text-primary-600 mr-4" />
          <div>
            <h2 className="text-xl font-semibold text-primary-600">Test Email Configuration</h2>
            <p className="text-secondary-600">Send a test email to verify your SMTP settings are working correctly.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Test Email Address *
            </label>
            <input
              type="email"
              {...register('email', { 
                required: 'Email address is required',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Please enter a valid email address'
                }
              })}
              className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-accent-lime-500 focus:border-accent-lime-500"
              placeholder="your-email@example.com"
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`
              w-full flex items-center justify-center px-6 py-3 rounded-lg font-medium transition-all duration-200
              ${isLoading
                ? 'bg-secondary-300 text-secondary-500 cursor-not-allowed'
                : 'bg-accent-coral-600 text-white hover:bg-accent-coral-700 hover:shadow-lg transform hover:scale-[1.02]'
              }
            `}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-secondary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending Test Email...
              </>
            ) : (
              <>
                <EnvelopeIcon className="h-5 w-5 mr-2" />
                Send Test Email
              </>
            )}
          </button>
        </form>

        {result && (
          <div className={`mt-6 p-4 rounded-lg border ${
            result.success 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center">
              {result.success ? (
                <CheckCircleIcon className="h-5 w-5 mr-2 text-green-600" />
              ) : (
                <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-red-600" />
              )}
              <span className="font-medium">
                {result.success ? 'Success!' : 'Error'}
              </span>
            </div>
            <p className="mt-2">{result.message}</p>
          </div>
        )}
      </div>

      {/* SMTP Configuration Guide */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-primary-600 mb-4">Email Configuration Guide</h3>
        
        <div className="space-y-6">
          {/* Namecheap PrivateEmail Setup */}
          <div>
            <h4 className="font-semibold text-secondary-800 mb-2">📧 Namecheap PrivateEmail (Your Current Setup)</h4>
            <div className="bg-secondary-50 p-4 rounded-lg">
              <p className="text-sm text-secondary-700 mb-3">
                Update your <code className="bg-white px-2 py-1 rounded text-accent-coral-600">.env.local</code> file:
              </p>
              <pre className="bg-neutral-800 text-green-400 p-3 rounded text-xs overflow-x-auto">
{`# Namecheap PrivateEmail Configuration
SMTP_HOST=mail.privatemail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=orders@crystalharbortc.com
SMTP_PASS=your-email-password
SMTP_FROM=Crystal Harbor Trading Company <orders@crystalharbortc.com>`}
              </pre>
              <p className="text-xs text-secondary-600 mt-2">
                💡 Use the same password you use to check email on your iPhone
              </p>
            </div>
          </div>

          {/* Microsoft 365 Alternative */}
          <div>
            <h4 className="font-semibold text-secondary-800 mb-2">📮 Microsoft 365 / Outlook Business (Alternative)</h4>
            <div className="bg-secondary-50 p-4 rounded-lg">
              <p className="text-sm text-secondary-700 mb-3">
                If using Microsoft 365 business email:
              </p>
              <pre className="bg-neutral-800 text-green-400 p-3 rounded text-xs overflow-x-auto">
{`SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=orders@crystalharbortc.com
SMTP_PASS=your-email-password
SMTP_FROM=Crystal Harbor Trading Company <orders@crystalharbortc.com>`}
              </pre>
              <p className="text-xs text-secondary-600 mt-2">
                💡 May require App Password if 2FA is enabled
              </p>
            </div>
          </div>

          {/* SendGrid Setup */}
          <div>
            <h4 className="font-semibold text-secondary-800 mb-2">🚀 SendGrid (Alternative Production Option)</h4>
            <div className="bg-secondary-50 p-4 rounded-lg">
              <p className="text-sm text-secondary-700 mb-3">
                For production use with better deliverability:
              </p>
              <pre className="bg-neutral-800 text-green-400 p-3 rounded text-xs overflow-x-auto">
{`SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
SMTP_FROM=Crystal Harbor Trading Company <orders@crystalharbortc.com>`}
              </pre>
              <p className="text-xs text-secondary-600 mt-2">
                💡 Sign up at sendgrid.com for 100 free emails/day
              </p>
            </div>
          </div>

          {/* Current Status */}
          <div>
            <h4 className="font-semibold text-secondary-800 mb-2">📊 Current Status</h4>
            <div className="bg-secondary-50 p-4 rounded-lg">
              <p className="text-sm text-secondary-700">
                {process.env.SMTP_USER ? (
                  <span className="text-green-600 font-medium">✅ SMTP Configuration Detected</span>
                ) : (
                  <span className="text-orange-600 font-medium">⚠️ No SMTP Configuration (emails will be logged only)</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
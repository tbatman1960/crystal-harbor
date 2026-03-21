'use client'

import { useState } from 'react'
import { EnvelopeIcon } from '@heroicons/react/24/outline'
import { isValidEmail } from '@/lib/email-capture'

interface NewsletterSignupProps {
  source: 'footer' | 'popup'
  onSuccess?: (email: string, discountCode?: string) => void
  showDiscountOffer?: boolean
  className?: string
}

export default function NewsletterSignup({ 
  source, 
  onSuccess, 
  showDiscountOffer = false,
  className = ''
}: NewsletterSignupProps) {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim()) {
      setMessage('Please enter your email address')
      return
    }

    if (!isValidEmail(email)) {
      setMessage('Please enter a valid email address')
      return
    }

    setIsSubmitting(true)
    setMessage('')

    try {
      const response = await fetch('/api/subscribe-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          source: source
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setIsSuccess(true)
        setMessage(showDiscountOffer && data.discountCode 
          ? `Success! Your discount code: ${data.discountCode}` 
          : 'Thank you for subscribing!'
        )
        setEmail('')
        
        if (onSuccess) {
          onSuccess(email, data.discountCode)
        }
      } else {
        setMessage(data.error || 'Something went wrong. Please try again.')
      }
    } catch (err) {
      console.error('Newsletter signup error:', err)
      setMessage('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess && source === 'popup') {
    return (
      <div className={`text-center ${className}`}>
        <div className="text-6xl mb-4">🎉</div>
        <h3 className="text-2xl font-bold text-primary-600 mb-2">Welcome to Crystal Harbor!</h3>
        {showDiscountOffer && (
          <div className="bg-accent-lime-100 border border-accent-lime-300 rounded-lg p-4 mb-4">
            <p className="text-accent-lime-800 font-semibold">
              {message}
            </p>
            <p className="text-sm text-accent-lime-700 mt-1">
              Use this code at checkout for 10% off your first order!
            </p>
          </div>
        )}
        <p className="text-secondary-600">
          Check your email for updates and special offers.
        </p>
      </div>
    )
  }

  return (
    <div className={className}>
      {source === 'footer' && (
        <h3 className="font-semibold text-lg mb-4 text-white">
          Stay Updated
        </h3>
      )}
      
      {source === 'popup' && showDiscountOffer && (
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-primary-600 mb-2">
            Get 10% Off Your First Order!
          </h3>
          <p className="text-secondary-600">
            Enter your email to receive your discount code and stay updated on new products.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 relative">
            <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              disabled={isSubmitting}
              className={`
                w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 transition-colors
                ${source === 'footer' 
                  ? 'border-secondary-600 bg-neutral-700 text-white placeholder-secondary-400 focus:ring-accent-lime-500 focus:border-accent-lime-500'
                  : 'border-secondary-300 bg-white text-secondary-900 placeholder-secondary-500 focus:ring-accent-coral-500 focus:border-accent-coral-500'
                }
                ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            />
          </div>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className={`
              px-6 py-2 font-medium rounded-lg transition-all duration-200 flex-shrink-0
              ${source === 'footer'
                ? 'bg-accent-lime-600 text-white hover:bg-accent-lime-700 focus:ring-accent-lime-500'
                : 'bg-accent-coral-600 text-white hover:bg-accent-coral-700 focus:ring-accent-coral-500'
              }
              focus:outline-none focus:ring-2 focus:ring-offset-2
              ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg transform hover:scale-105'}
              disabled:transform-none disabled:shadow-none
            `}
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Subscribing...
              </span>
            ) : (
              'Subscribe'
            )}
          </button>
        </div>

        {message && (
          <div className={`text-sm p-3 rounded-lg ${
            isSuccess 
              ? 'bg-green-100 text-green-700 border border-green-200' 
              : 'bg-red-100 text-red-700 border border-red-200'
          }`}>
            {message}
          </div>
        )}
      </form>

      {source === 'footer' && (
        <p className="text-xs text-secondary-400 mt-3">
          Get updates on new products and special offers. Unsubscribe anytime.
        </p>
      )}
    </div>
  )
}
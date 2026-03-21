'use client'

import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface ShippingAddress {
  first_name: string
  last_name: string
  email: string
  phone: string
  address_line_1: string
  address_line_2?: string
  city: string
  state: string
  postal_code: string
  country: string
}

interface StripePaymentProps {
  amount: number
  shippingAddress: ShippingAddress
  onSuccess: (paymentIntentId: string) => void
  onError: (error: string) => void
  isProcessing: boolean
}

function PaymentForm({ amount, shippingAddress, onSuccess, onError, isProcessing }: StripePaymentProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const stripe = useStripe()
  const elements = useElements()

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    
    if (!stripe || !elements || isProcessing) return

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) return

    setIsSubmitting(true)
    onError('')

    try {
      // Create payment intent on the server
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Convert to cents
          shipping_address: shippingAddress,
        }),
      })

      const { client_secret, error } = await response.json()

      if (error) {
        onError(error)
        return
      }

      // Confirm payment
      const result = await stripe.confirmCardPayment(client_secret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: `${shippingAddress.first_name} ${shippingAddress.last_name}`,
            email: shippingAddress.email,
            phone: shippingAddress.phone,
            address: {
              line1: shippingAddress.address_line_1,
              line2: shippingAddress.address_line_2 || undefined,
              city: shippingAddress.city,
              state: shippingAddress.state,
              postal_code: shippingAddress.postal_code,
              country: shippingAddress.country,
            },
          },
        },
      })

      if (result.error) {
        onError(result.error.message || 'Payment failed')
      } else if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
        onSuccess(result.paymentIntent.id)
      }
    } catch (err) {
      onError('An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#374151',
        '::placeholder': {
          color: '#9CA3AF',
        },
      },
      invalid: {
        color: '#EF4444',
      },
    },
    hidePostalCode: true, // We collect this separately
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-neutral-700 mb-3">
          Card Information
        </label>
        <div className="p-4 border-2 border-gray-300 rounded-lg focus-within:border-primary-500 transition-colors duration-200">
          <CardElement options={cardElementOptions} />
        </div>
        <p className="text-xs text-secondary-500 mt-2">
          Your payment information is encrypted and secure
        </p>
      </div>

      <div className="bg-background-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-secondary-600">Order Total</span>
          <span className="font-bold text-lg text-primary-600">${amount.toFixed(2)}</span>
        </div>
        <p className="text-xs text-secondary-600">
          Payment will be processed securely through Stripe
        </p>
      </div>

      <button
        type="submit"
        disabled={!stripe || isSubmitting || isProcessing}
        className="btn-primary w-full text-lg py-4"
      >
        {isSubmitting || isProcessing ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="loading-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
            <span>Processing Payment...</span>
          </div>
        ) : (
          `Complete Order - $${amount.toFixed(2)}`
        )}
      </button>

      <div className="text-center">
        <div className="flex items-center justify-center space-x-4 text-xs text-secondary-500">
          <span>🔒 Secure Payment</span>
          <span>•</span>
          <span>SSL Encrypted</span>
          <span>•</span>
          <span>Powered by Stripe</span>
        </div>
      </div>
    </form>
  )
}

export default function StripePayment(props: StripePaymentProps) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm {...props} />
    </Elements>
  )
}
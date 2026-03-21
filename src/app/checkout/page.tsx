'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { useCartStore } from '@/store/cartStore'
import LoginForm from '@/components/auth/LoginForm'
import CheckoutForm from '@/components/checkout/CheckoutForm'
import OrderSummary from '@/components/checkout/OrderSummary'
import { trackBeginCheckout } from '@/lib/analytics'

export default function CheckoutPage() {
  const [mounted, setMounted] = useState(false)
  const [checkoutMode, setCheckoutMode] = useState<'select' | 'guest' | 'member'>('select')
  const { isAuthenticated, user } = useAuthStore()
  const { items } = useCartStore()
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    
    // If user is already authenticated, go straight to member checkout
    if (isAuthenticated) {
      setCheckoutMode('member')
    }
  }, [isAuthenticated])

  // Redirect if cart is empty (but not if an order was just completed)
  useEffect(() => {
    if (mounted && items.length === 0) {
      // Check if an order was just completed
      const orderCompleted = sessionStorage.getItem('orderCompleted')
      if (!orderCompleted) {
        router.push('/cart')
      }
    }
  }, [mounted, items.length, router])

  // Track begin checkout event for analytics
  useEffect(() => {
    if (mounted && items.length > 0) {
      const cartItems = items.map(item => ({
        item_id: item.product_id,
        item_name: item.product_name,
        item_category: item.category_slug,
        quantity: item.quantity,
        price: item.unit_price
      }))
      
      const totalValue = items.reduce((sum, item) => sum + item.line_total, 0)
      
      trackBeginCheckout(cartItems, totalValue)
    }
  }, [mounted, items])

  if (!mounted) {
    return (
      <div className="section-padding bg-background-50 min-h-screen">
        <div className="container mx-auto">
          <div className="text-center py-12">
            <div className="loading-pulse">Loading checkout...</div>
          </div>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return null // Will redirect via useEffect
  }

  return (
    <div className="section-padding bg-background-50 min-h-screen">
      <div className="container mx-auto max-w-6xl">
        <h1 className="font-display font-bold text-3xl text-primary-600 mb-8">
          Checkout
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            {checkoutMode === 'select' && (
              <div className="card p-8">
                <h2 className="font-display font-semibold text-2xl text-primary-600 mb-6">
                  How would you like to checkout?
                </h2>
                
                <div className="space-y-4">
                  <button
                    onClick={() => setCheckoutMode('member')}
                    className="w-full p-6 border-2 border-gray-200 rounded-lg hover:border-accent-lime-500 transition-colors duration-200 text-left"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-accent-lime-100 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-accent-lime-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-neutral-700">Sign In</h3>
                        <p className="text-secondary-600">Access your account to track orders and save information</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setCheckoutMode('guest')}
                    className="w-full p-6 border-2 border-gray-200 rounded-lg hover:border-accent-coral-500 transition-colors duration-200 text-left"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-accent-coral-100 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-accent-coral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-neutral-700">Guest Checkout</h3>
                        <p className="text-secondary-600">Quick checkout without creating an account</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {checkoutMode === 'member' && !isAuthenticated && (
              <div className="card p-8">
                <div className="mb-6">
                  <button
                    onClick={() => setCheckoutMode('select')}
                    className="text-accent-coral-500 hover:text-accent-coral-600 text-sm font-medium mb-4"
                  >
                    ← Back to checkout options
                  </button>
                  <h2 className="font-display font-semibold text-2xl text-primary-600">
                    Sign In
                  </h2>
                </div>
                <LoginForm redirectTo="/checkout" showRegisterLink={true} />
              </div>
            )}

            {((checkoutMode === 'member' && isAuthenticated) || checkoutMode === 'guest') && (
              <CheckoutForm 
                mode={checkoutMode}
                user={isAuthenticated ? user : null}
                onBack={() => setCheckoutMode('select')}
              />
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <OrderSummary />
          </div>
        </div>
      </div>
    </div>
  )
}
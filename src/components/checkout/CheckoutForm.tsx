'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { useCartStore } from '@/store/cartStore'
import { AuthUser } from '@/lib/auth'
import { createOrder } from '@/lib/orders'
import { supabase } from '@/lib/supabase'
import { calculateShipping } from '@/lib/shipping'
import StripePayment from './StripePayment'
import MobilePaymentMethods from '@/components/mobile/MobilePaymentMethods'
import { getDeviceInfo } from '@/lib/mobile-detection'

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

interface CheckoutFormProps {
  mode: 'guest' | 'member'
  user: AuthUser | null
  onBack: () => void
}

export default function CheckoutForm({ mode, user, onBack }: CheckoutFormProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')
  const [shippingData, setShippingData] = useState<ShippingAddress | null>(null)
  const [customerData, setCustomerData] = useState<any>(null)
  const { items, subtotal, clearCart } = useCartStore()
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<ShippingAddress>({
    defaultValues: {
      country: 'US'
    }
  })

  // Calculate sophisticated shipping
  const shippingCalc = calculateShipping(items.map(item => ({
    product_name: item.product_name,
    category_slug: item.category_slug,
    quantity: item.quantity,
    unit_price: item.unit_price,
    line_total: item.line_total
  })))
  
  const shippingCost = shippingCalc.cost
  const total = subtotal + shippingCost

  // Load customer's saved address for pre-filling
  useEffect(() => {
    if (mode === 'member' && user?.id) {
      loadCustomerData()
    }
  }, [mode, user?.id])

  const loadCustomerData = async () => {
    if (!user?.id) return

    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error loading customer data:', error)
        return
      }

      setCustomerData(data)
      
      // Pre-fill form with saved data
      reset({
        first_name: data.first_name || user.firstName || '',
        last_name: data.last_name || user.lastName || '',
        email: user.email || '',
        phone: data.phone || user.phone || '',
        address_line_1: data.address_line_1 || '',
        address_line_2: data.address_line_2 || '',
        city: data.city || '',
        state: data.state || '',
        postal_code: data.postal_code || '',
        country: data.country || 'US'
      })
    } catch (error) {
      console.error('Error loading customer data:', error)
    }
  }

  const onShippingSubmit = async (data: ShippingAddress) => {
    setError('')
    setShippingData(data)
    
    // Check if user is logged in and data has changed from saved data
    if (mode === 'member' && user?.id && customerData) {
      const hasChanged = 
        data.first_name !== (customerData.first_name || '') ||
        data.last_name !== (customerData.last_name || '') ||
        data.phone !== (customerData.phone || '') ||
        data.address_line_1 !== (customerData.address_line_1 || '') ||
        data.address_line_2 !== (customerData.address_line_2 || '') ||
        data.city !== (customerData.city || '') ||
        data.state !== (customerData.state || '') ||
        data.postal_code !== (customerData.postal_code || '') ||
        data.country !== (customerData.country || 'US')
      
      if (hasChanged) {
        const saveAsDefault = confirm(
          'You\'ve updated your information. Would you like to save these changes as your new default shipping information?'
        )
        
        if (saveAsDefault) {
          try {
            // Update customer profile with new information
            const { error } = await supabase
              .from('customers')
              .update({
                first_name: data.first_name,
                last_name: data.last_name,
                phone: data.phone,
                address_line_1: data.address_line_1,
                address_line_2: data.address_line_2 || null,
                city: data.city,
                state: data.state,
                postal_code: data.postal_code,
                country: data.country,
                updated_at: new Date().toISOString()
              })
              .eq('id', user.id)
            
            if (error) {
              console.error('Error updating customer profile:', error)
            } else {
              console.log('Customer profile updated successfully')
              // Update local customer data
              setCustomerData({
                ...customerData,
                ...data
              })
            }
          } catch (error) {
            console.error('Error saving profile updates:', error)
          }
        }
      }
    }
    
    setCurrentStep(2)
  }

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    if (!shippingData) return

    setIsProcessing(true)
    setError('')

    try {
      const orderData = {
        customer_id: mode === 'member' && user ? user.id : null,
        guest_email: mode === 'guest' ? shippingData.email : null,
        shipping_address: shippingData,
        items: items.map(item => ({
          product_id: item.product_id,
          product_name: item.product_name,
          selected_size: item.selected_size,
          selected_color: item.selected_color,
          quantity: item.quantity,
          unit_price: item.unit_price,
          line_total: item.line_total,
          tier_applied: item.tier_applied,
          custom_text: item.custom_text,
          uploaded_file: item.uploaded_file
        })),
        subtotal,
        shipping_cost: shippingCost,
        total_amount: total,
        stripe_payment_intent_id: paymentIntentId,
        special_instructions: ''
      }

      const result = await createOrder(orderData)

      if (result.success && result.order) {
        console.log('Order created successfully:', result.order.order_number)
        
        // Redirect to success page first, then clear cart
        const successUrl = `/checkout/success?order=${result.order.order_number}`
        console.log('Redirecting to:', successUrl)
        
        // Set a flag to prevent double-processing
        sessionStorage.setItem('orderCompleted', result.order.order_number)
        
        try {
          // Use replace instead of push to prevent back navigation to checkout
          router.replace(successUrl)
          
          // Clear cart after a short delay to ensure redirect happens first
          setTimeout(() => {
            clearCart()
          }, 500)
          
          // Fallback redirect in case Next.js router fails
          setTimeout(() => {
            if (window.location.pathname !== '/checkout/success') {
              console.log('Router redirect may have failed, using window.location')
              window.location.replace(successUrl)
            }
          }, 1500)
        } catch (routerError) {
          console.error('Router replace failed, using window.location:', routerError)
          window.location.replace(successUrl)
          // Clear cart after redirect
          setTimeout(() => clearCart(), 100)
        }
      } else {
        console.error('Order creation failed:', result.error)
        setError(result.error || 'Failed to create order')
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleMobilePaymentSuccess = async (paymentData: any) => {
    console.log('Mobile payment successful:', paymentData)
    
    // For mobile payments, we'll create a mock payment intent ID
    const mobilePaymentId = `mobile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Process the same as regular payment
    await handlePaymentSuccess(mobilePaymentId)
  }

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center space-x-4 mb-8">
        <div className={`flex items-center space-x-2 ${currentStep >= 1 ? 'text-accent-lime-600' : 'text-secondary-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
            currentStep >= 1 ? 'bg-accent-lime-100' : 'bg-secondary-100'
          }`}>
            1
          </div>
          <span className="font-medium">Shipping</span>
        </div>
        
        <div className={`w-12 h-0.5 ${currentStep >= 2 ? 'bg-accent-lime-300' : 'bg-secondary-200'}`}></div>
        
        <div className={`flex items-center space-x-2 ${currentStep >= 2 ? 'text-accent-coral-600' : 'text-secondary-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
            currentStep >= 2 ? 'bg-accent-coral-100' : 'bg-secondary-100'
          }`}>
            2
          </div>
          <span className="font-medium">Payment</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Step 1: Shipping Information */}
      {currentStep === 1 && (
        <div className="card p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display font-semibold text-2xl text-primary-600">
              Shipping Information
            </h2>
            <button
              onClick={onBack}
              className="text-accent-coral-500 hover:text-accent-coral-600 text-sm font-medium"
            >
              ← Back
            </button>
          </div>

          <form onSubmit={handleSubmit(onShippingSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-group">
                <label htmlFor="first_name" className="form-label">
                  First Name *
                </label>
                <input
                  id="first_name"
                  type="text"
                  className="input-field"
                  {...register('first_name', { required: 'First name is required' })}
                />
                {errors.first_name && <p className="form-error">{errors.first_name.message}</p>}
              </div>

              <div className="form-group">
                <label htmlFor="last_name" className="form-label">
                  Last Name *
                </label>
                <input
                  id="last_name"
                  type="text"
                  className="input-field"
                  {...register('last_name', { required: 'Last name is required' })}
                />
                {errors.last_name && <p className="form-error">{errors.last_name.message}</p>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email Address *
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
              <label htmlFor="phone" className="form-label">
                Phone Number *
              </label>
              <input
                id="phone"
                type="tel"
                className="input-field"
                placeholder="(555) 123-4567"
                {...register('phone', { required: 'Phone number is required' })}
              />
              {errors.phone && <p className="form-error">{errors.phone.message}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="address_line_1" className="form-label">
                Address Line 1 *
              </label>
              <input
                id="address_line_1"
                type="text"
                className="input-field"
                placeholder="Street address"
                {...register('address_line_1', { required: 'Address is required' })}
              />
              {errors.address_line_1 && <p className="form-error">{errors.address_line_1.message}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="address_line_2" className="form-label">
                Address Line 2
              </label>
              <input
                id="address_line_2"
                type="text"
                className="input-field"
                placeholder="Apartment, suite, etc."
                {...register('address_line_2')}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="form-group">
                <label htmlFor="city" className="form-label">
                  City *
                </label>
                <input
                  id="city"
                  type="text"
                  className="input-field"
                  {...register('city', { required: 'City is required' })}
                />
                {errors.city && <p className="form-error">{errors.city.message}</p>}
              </div>

              <div className="form-group">
                <label htmlFor="state" className="form-label">
                  State *
                </label>
                <input
                  id="state"
                  type="text"
                  className="input-field"
                  placeholder="CA"
                  {...register('state', { required: 'State is required' })}
                />
                {errors.state && <p className="form-error">{errors.state.message}</p>}
              </div>

              <div className="form-group">
                <label htmlFor="postal_code" className="form-label">
                  ZIP Code *
                </label>
                <input
                  id="postal_code"
                  type="text"
                  className="input-field"
                  {...register('postal_code', { required: 'ZIP code is required' })}
                />
                {errors.postal_code && <p className="form-error">{errors.postal_code.message}</p>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="country" className="form-label">
                Country *
              </label>
              <select
                id="country"
                className="input-field"
                {...register('country', { required: 'Country is required' })}
              >
                <option value="US">United States</option>
              </select>
              {errors.country && <p className="form-error">{errors.country.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full"
            >
              {isSubmitting ? 'Validating...' : 'Continue to Payment'}
            </button>
          </form>
        </div>
      )}

      {/* Step 2: Payment */}
      {currentStep === 2 && shippingData && (
        <div className="card p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display font-semibold text-2xl text-primary-600">
              Payment Information
            </h2>
            <button
              onClick={() => setCurrentStep(1)}
              className="text-accent-coral-500 hover:text-accent-coral-600 text-sm font-medium"
            >
              ← Edit Shipping
            </button>
          </div>

          <div className="mb-6 p-4 bg-background-50 rounded-lg">
            <h3 className="font-semibold text-sm text-neutral-700 mb-2">Shipping To:</h3>
            <p className="text-sm text-secondary-600">
              {shippingData.first_name} {shippingData.last_name}<br />
              {shippingData.address_line_1}<br />
              {shippingData.address_line_2 && `${shippingData.address_line_2}\n`}
              {shippingData.city}, {shippingData.state} {shippingData.postal_code}
            </p>
          </div>

          {/* Development: Skip Payment Option */}
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-semibold text-yellow-800 mb-2">🚧 Development Mode</h4>
            <p className="text-yellow-700 text-sm mb-3">
              Skip payment for testing purposes. This creates the order without processing payment.
            </p>
            <button
              onClick={() => handlePaymentSuccess('dev_test_payment_' + Date.now())}
              disabled={isProcessing}
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded transition-colors duration-200 w-full"
            >
              {isProcessing ? 'Creating Order...' : 'Skip Payment (Test Order)'}
            </button>
          </div>

          {/* Mobile Payment Methods */}
          <div className="mb-6">
            <MobilePaymentMethods
              amount={total}
              onApplePaySuccess={handleMobilePaymentSuccess}
              onGooglePaySuccess={handleMobilePaymentSuccess}
              onError={(error) => setError(error)}
              disabled={isProcessing}
            />
          </div>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-4 text-sm text-gray-500">or pay with card</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          <div className="mt-6">
            <StripePayment
              amount={total}
              shippingAddress={shippingData}
              onSuccess={handlePaymentSuccess}
              onError={(error) => setError(error)}
              isProcessing={isProcessing}
            />
          </div>
        </div>
      )}
    </div>
  )
}
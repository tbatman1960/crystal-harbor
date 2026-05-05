'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { useCartStore } from '@/store/cartStore'
import { AuthUser } from '@/lib/auth'
// Order creation via API route (not direct import) to avoid RLS issues
import { calculateSalesTax } from '@/lib/sales-tax'
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

interface ShippingOption {
  method_id: string
  name: string
  description?: string
  cost: number | null
  estimated_delivery: string
  type: string
  carrier?: string
  service_code?: string
  is_mock?: boolean
  is_fallback?: boolean
  needs_zip?: boolean
  packages?: Array<{
    package_type: string
    utilization: number
    weight: number
    dimensions: string
  }>
  breakdown?: Array<{
    package_name: string
    cost: number
    weight: number
  }>
  total_units?: number
  total_packages?: number
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

  // Shipping options state
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([])
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null)
  const [loadingShipping, setLoadingShipping] = useState(false)
  const [shippingError, setShippingError] = useState('')

  const shippingCost = selectedShipping?.cost ?? 0

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<ShippingAddress>({
    defaultValues: {
      country: 'US'
    }
  })

  const watchedZip = watch('postal_code')
  const watchedState = watch('state')

  // Calculate tax based on shipping address state
  const taxResult = calculateSalesTax({
    subtotal,
    shipping_cost: shippingCost,
    shipping_address: {
      state: watchedState || '',
      postal_code: watchedZip || '',
      country: 'US',
    }
  })
  const taxAmount = taxResult.tax_amount
  const total = subtotal + shippingCost + taxAmount

  // Load customer's saved address for pre-filling
  useEffect(() => {
    if (mode === 'member' && user?.id) {
      loadCustomerData()
    }
  }, [mode, user?.id])

  const loadCustomerData = async () => {
    if (!user?.id) return

    try {
      const res = await fetch(`/api/customer/profile?customer_id=${user.id}`)
      if (!res.ok) {
        console.error('Error loading customer data')
        return
      }
      const { customer: data } = await res.json()
      if (!data) return

      setCustomerData(data)
      
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

  // Fetch shipping options when zip code changes (debounced)
  const fetchShippingOptions = useCallback(async (zip: string) => {
    if (!zip || zip.length < 5) {
      setShippingOptions([])
      setSelectedShipping(null)
      return
    }

    setLoadingShipping(true)
    setShippingError('')

    try {
      const res = await fetch('/api/shipping/available', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity,
            line_total: item.line_total,
          })),
          destination_zip: zip,
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to fetch shipping options')
      }

      const data = await res.json()
      const packingSummary = data.packing_summary || {}
      const opts: ShippingOption[] = (data.options || []).map((opt: ShippingOption) => ({
        ...opt,
        total_units: packingSummary.total_units,
        total_packages: packingSummary.total_packages,
      }))
      setShippingOptions(opts)

      // Auto-select the cheapest option only if nothing is currently selected
      // (preserves user's choice if shipping re-fetches for same zip)
      const selectable = opts.filter(o => o.cost !== null)
      if (selectable.length > 0 && !selectedShipping) {
        setSelectedShipping(selectable[0])
      } else if (selectable.length > 0 && selectedShipping) {
        // If user had a selection, try to match it in the new results
        const match = selectable.find(o => 
          o.method_id === selectedShipping.method_id && 
          o.service_code === selectedShipping.service_code
        )
        if (match) {
          setSelectedShipping(match)
        } else {
          // Previous selection no longer available — fall back to cheapest
          setSelectedShipping(selectable[0])
        }
      }
    } catch (err) {
      console.error('Shipping fetch error:', err)
      setShippingError('Could not load shipping options. A default rate will be applied.')
      // Fallback
      const fallback: ShippingOption = {
        method_id: 'fallback',
        name: 'Standard Shipping',
        cost: 9.99,
        estimated_delivery: '5-7 business days',
        type: 'flat_rate',
        is_fallback: true,
      }
      setShippingOptions([fallback])
      setSelectedShipping(fallback)
    } finally {
      setLoadingShipping(false)
    }
  }, [items])

  // Debounce zip code changes — only fetch on Step 1 (shipping form)
  useEffect(() => {
    if (currentStep !== 1) return
    if (!watchedZip || watchedZip.length < 5) return
    const timer = setTimeout(() => {
      fetchShippingOptions(watchedZip)
    }, 600)
    return () => clearTimeout(timer)
  }, [watchedZip, fetchShippingOptions, currentStep])

  const onShippingSubmit = async (data: ShippingAddress) => {
    setError('')

    // Ensure a shipping method is selected
    if (!selectedShipping || selectedShipping.cost === null) {
      setError('Please select a shipping method')
      return
    }

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
            const res = await fetch('/api/customer/profile', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                customer_id: user.id,
                first_name: data.first_name,
                last_name: data.last_name,
                phone: data.phone,
                address_line_1: data.address_line_1,
                address_line_2: data.address_line_2 || null,
                city: data.city,
                state: data.state,
                postal_code: data.postal_code,
                country: data.country,
              })
            })
            
            if (res.ok) {
              setCustomerData({ ...customerData, ...data })
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
        shipping_method: selectedShipping?.name || 'Standard Shipping',
        shipping_details: selectedShipping ? {
          method_id: selectedShipping.method_id,
          service_name: selectedShipping.name,
          cost: selectedShipping.cost,
          estimated_delivery: selectedShipping.estimated_delivery,
          description: selectedShipping.description,
          type: selectedShipping.type,
          is_mock: selectedShipping.is_mock,
          is_fallback: selectedShipping.is_fallback,
          packages: selectedShipping.packages || [],
          carrier: selectedShipping.carrier,
          service_code: selectedShipping.service_code,
          created_at: new Date().toISOString()
        } : null,
        tax_amount: taxAmount,
        total_amount: total,
        stripe_payment_intent_id: paymentIntentId,
        special_instructions: ''
      }

      const orderRes = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      })
      const result = await orderRes.json()

      if (result.success && result.order) {
        console.log('Order created successfully:', result.order.order_number)
        
        const successUrl = `/checkout/success?order=${result.order.order_number}`
        sessionStorage.setItem('orderCompleted', result.order.order_number)
        
        try {
          router.replace(successUrl)
          setTimeout(() => { clearCart() }, 500)
          setTimeout(() => {
            if (window.location.pathname !== '/checkout/success') {
              window.location.replace(successUrl)
            }
          }, 1500)
        } catch (routerError) {
          console.error('Router replace failed:', routerError)
          window.location.replace(successUrl)
          setTimeout(() => clearCart(), 100)
        }
      } else {
        setError(result.error || 'Failed to create order')
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleMobilePaymentSuccess = async (paymentData: any) => {
    const mobilePaymentId = `mobile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
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
                <label htmlFor="first_name" className="form-label">First Name *</label>
                <input id="first_name" type="text" className="input-field"
                  {...register('first_name', { required: 'First name is required' })} />
                {errors.first_name && <p className="form-error">{errors.first_name.message}</p>}
              </div>
              <div className="form-group">
                <label htmlFor="last_name" className="form-label">Last Name *</label>
                <input id="last_name" type="text" className="input-field"
                  {...register('last_name', { required: 'Last name is required' })} />
                {errors.last_name && <p className="form-error">{errors.last_name.message}</p>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">Email Address *</label>
              <input id="email" type="email" className="input-field"
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email address' },
                })} />
              {errors.email && <p className="form-error">{errors.email.message}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="phone" className="form-label">Phone Number *</label>
              <input id="phone" type="tel" className="input-field" placeholder="(317) 997-5503"
                {...register('phone', { required: 'Phone number is required' })} />
              {errors.phone && <p className="form-error">{errors.phone.message}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="address_line_1" className="form-label">Address Line 1 *</label>
              <input id="address_line_1" type="text" className="input-field" placeholder="Street address"
                {...register('address_line_1', { required: 'Address is required' })} />
              {errors.address_line_1 && <p className="form-error">{errors.address_line_1.message}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="address_line_2" className="form-label">Address Line 2</label>
              <input id="address_line_2" type="text" className="input-field" placeholder="Apartment, suite, etc."
                {...register('address_line_2')} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="form-group">
                <label htmlFor="city" className="form-label">City *</label>
                <input id="city" type="text" className="input-field"
                  {...register('city', { required: 'City is required' })} />
                {errors.city && <p className="form-error">{errors.city.message}</p>}
              </div>
              <div className="form-group">
                <label htmlFor="state" className="form-label">State *</label>
                <input id="state" type="text" className="input-field" placeholder="CA"
                  {...register('state', { required: 'State is required' })} />
                {errors.state && <p className="form-error">{errors.state.message}</p>}
              </div>
              <div className="form-group">
                <label htmlFor="postal_code" className="form-label">ZIP Code *</label>
                <input id="postal_code" type="text" className="input-field"
                  {...register('postal_code', { required: 'ZIP code is required' })} />
                {errors.postal_code && <p className="form-error">{errors.postal_code.message}</p>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="country" className="form-label">Country *</label>
              <select id="country" className="input-field"
                {...register('country', { required: 'Country is required' })}>
                <option value="US">United States</option>
              </select>
            </div>

            {/* Shipping Method Selection */}
            <div className="border-t border-gray-200 pt-6 mt-6">
              <h3 className="font-display font-semibold text-lg text-primary-600 mb-4">
                Shipping Method
              </h3>

              {loadingShipping && (
                <div className="flex items-center space-x-3 py-4">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
                  <span className="text-secondary-600 text-sm">Calculating shipping options...</span>
                </div>
              )}

              {shippingError && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-4 text-sm">
                  {shippingError}
                </div>
              )}

              {!loadingShipping && shippingOptions.length === 0 && (
                <p className="text-secondary-500 text-sm py-2">
                  Enter your ZIP code above to see available shipping options.
                </p>
              )}

              {!loadingShipping && shippingOptions.length > 0 && (
                <div className="space-y-3">
                  {shippingOptions.map((option, idx) => (
                    <label
                      key={`${option.method_id}-${option.service_code || idx}`}
                      className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedShipping?.method_id === option.method_id && 
                        selectedShipping?.service_code === option.service_code
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      } ${option.cost === null ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name="shipping_method"
                          disabled={option.cost === null}
                          checked={
                            selectedShipping?.method_id === option.method_id &&
                            selectedShipping?.service_code === option.service_code
                          }
                          onChange={() => option.cost !== null && setSelectedShipping(option)}
                          className="h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                        />
                        <div>
                          <div className="font-medium text-gray-900 text-sm">
                            {option.name}
                            {option.is_mock && (
                              <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">
                                Estimated
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {option.estimated_delivery}
                            {option.description && ` • ${option.description}`}
                          </div>
                        </div>
                      </div>
                      <div className="font-semibold text-gray-900">
                        {option.cost === null
                          ? '—'
                          : option.cost === 0
                            ? 'FREE'
                            : `$${option.cost.toFixed(2)}`
                        }
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Order Totals */}
            {selectedShipping && selectedShipping.cost !== null && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal ({items.reduce((sum, i) => sum + i.quantity, 0)} items)</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>

                {/* Shipping Breakdown */}
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping ({selectedShipping.name})</span>
                  <span className="font-medium">{shippingCost === 0 ? 'FREE' : `$${shippingCost.toFixed(2)}`}</span>
                </div>
                {(selectedShipping.packages || selectedShipping.breakdown) && (
                  <div className="ml-4 pl-3 border-l-2 border-gray-200 space-y-1 text-xs text-gray-500">
                    {selectedShipping.total_units != null && (
                      <div className="flex justify-between">
                        <span>📦 Packing units</span>
                        <span>{selectedShipping.total_units} units</span>
                      </div>
                    )}
                    {selectedShipping.total_packages != null && (
                      <div className="flex justify-between">
                        <span>📋 Packages required</span>
                        <span>{selectedShipping.total_packages} package{selectedShipping.total_packages !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                    {selectedShipping.packages && selectedShipping.packages.map((pkg, i) => (
                      <div key={i} className="flex justify-between">
                        <span>
                          Box {i + 1}: {pkg.package_type} ({pkg.dimensions}, {pkg.weight.toFixed(1)} lbs)
                        </span>
                        {selectedShipping.breakdown && selectedShipping.breakdown[i] && (
                          <span>${selectedShipping.breakdown[i].cost.toFixed(2)}</span>
                        )}
                      </div>
                    ))}
                    {selectedShipping.total_packages != null && (
                      <div className="flex justify-between">
                        <span>🏷️ Shipping labels</span>
                        <span>{selectedShipping.total_packages} label{selectedShipping.total_packages !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>
                )}

                {taxAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax ({(taxResult.tax_rate * 100).toFixed(0)}% {taxResult.tax_jurisdiction})</span>
                    <span className="font-medium">${taxAmount.toFixed(2)}</span>
                  </div>
                )}
                {watchedState && taxAmount === 0 && watchedState !== 'IN' && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax</span>
                    <span className="text-gray-500 text-xs">No tax (out of state)</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2 mt-2">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="font-bold text-lg text-primary-600">${total.toFixed(2)}</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !selectedShipping || selectedShipping.cost === null}
              className="btn-primary w-full"
            >
              {isSubmitting ? 'Validating...' : `Continue to Payment — $${total.toFixed(2)}`}
            </button>

            <div className="flex items-center justify-center space-x-4 mt-4">
              <Link href="/products" className="text-sm text-accent-coral-500 hover:text-accent-coral-600 font-medium">
                ← Continue Shopping
              </Link>
              <span className="text-gray-300">|</span>
              <button
                type="button"
                onClick={() => { clearCart(); router.push('/products') }}
                className="text-sm text-red-500 hover:text-red-600 font-medium"
              >
                Clear Cart
              </button>
            </div>
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
              {shippingData.address_line_2 && <>{shippingData.address_line_2}<br /></>}
              {shippingData.city}, {shippingData.state} {shippingData.postal_code}
            </p>
            {selectedShipping && (
              <div className="text-sm text-secondary-600 mt-2 pt-2 border-t border-gray-200 space-y-1">
                <div className="flex justify-between">
                  <span>Subtotal ({items.reduce((sum, i) => sum + i.quantity, 0)} items):</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping ({selectedShipping.name}):</span>
                  <span>{shippingCost === 0 ? 'FREE' : `$${shippingCost.toFixed(2)}`}</span>
                </div>
                {/* Shipping Breakdown */}
                {(selectedShipping.packages || selectedShipping.breakdown) && (
                  <div className="ml-3 pl-3 border-l-2 border-gray-200 space-y-0.5 text-xs text-gray-500">
                    {selectedShipping.total_units != null && (
                      <div className="flex justify-between">
                        <span>📦 Packing units</span>
                        <span>{selectedShipping.total_units} units</span>
                      </div>
                    )}
                    {selectedShipping.total_packages != null && (
                      <div className="flex justify-between">
                        <span>📋 Packages</span>
                        <span>{selectedShipping.total_packages} package{selectedShipping.total_packages !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                    {selectedShipping.packages && selectedShipping.packages.map((pkg, i) => (
                      <div key={i} className="flex justify-between">
                        <span>
                          Box {i + 1}: {pkg.package_type} ({pkg.weight.toFixed(1)} lbs)
                        </span>
                        {selectedShipping.breakdown && selectedShipping.breakdown[i] && (
                          <span>${selectedShipping.breakdown[i].cost.toFixed(2)}</span>
                        )}
                      </div>
                    ))}
                    {selectedShipping.total_packages != null && (
                      <div className="flex justify-between">
                        <span>🏷️ Shipping labels</span>
                        <span>{selectedShipping.total_packages} label{selectedShipping.total_packages !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>
                )}
                {taxAmount > 0 && (
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>${taxAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-gray-900 pt-1 border-t">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <p className="text-xs text-gray-500">{selectedShipping.estimated_delivery}</p>
              </div>
            )}
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

          <div className="flex items-center justify-center space-x-4 mt-6">
            <Link href="/products" className="text-sm text-accent-coral-500 hover:text-accent-coral-600 font-medium">
              ← Continue Shopping
            </Link>
            <span className="text-gray-300">|</span>
            <button
              type="button"
              onClick={() => { clearCart(); router.push('/products') }}
              className="text-sm text-red-500 hover:text-red-600 font-medium"
            >
              Clear Cart
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

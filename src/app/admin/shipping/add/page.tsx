'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm, useFieldArray } from 'react-hook-form'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { useAdminStore } from '@/store/adminStore'
import { createShippingMethod, ShippingMethod, WeightTier } from '@/lib/shipping-methods'

interface ShippingMethodFormData {
  name: string
  description: string
  method_type: 'flat_rate' | 'weight_based' | 'calculated' | 'free'
  flat_rate_cost: number | null
  weight_tiers: WeightTier[]
  carrier_code: string
  service_code: string
  min_order_for_free_shipping: number | null
  estimated_days_min: number
  estimated_days_max: number
  active: boolean
  display_order: number
}

export default function AddShippingMethodPage() {
  const { isAuthenticated } = useAdminStore()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm<ShippingMethodFormData>({
    defaultValues: {
      name: '',
      description: '',
      method_type: 'flat_rate',
      flat_rate_cost: null,
      weight_tiers: [{ max_weight: 2, cost: 8.99, name: 'Light Package' }],
      carrier_code: '',
      service_code: '',
      min_order_for_free_shipping: null,
      estimated_days_min: 5,
      estimated_days_max: 7,
      active: true,
      display_order: 1
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'weight_tiers'
  })

  const watchedMethodType = watch('method_type')

  const onSubmit = async (data: ShippingMethodFormData) => {
    setSaving(true)
    setMessage(null)

    try {
      // Clean up data based on method type
      const methodData: Omit<ShippingMethod, 'id' | 'created_at' | 'updated_at'> = {
        name: data.name,
        description: data.description || null,
        method_type: data.method_type,
        flat_rate_cost: data.method_type === 'flat_rate' ? data.flat_rate_cost : null,
        weight_tiers: data.method_type === 'weight_based' ? data.weight_tiers : null,
        carrier_code: data.method_type === 'calculated' ? data.carrier_code || null : null,
        service_code: data.method_type === 'calculated' ? data.service_code || null : null,
        min_order_for_free_shipping: data.min_order_for_free_shipping,
        estimated_days_min: data.estimated_days_min,
        estimated_days_max: data.estimated_days_max,
        active: data.active,
        display_order: data.display_order
      }

      const result = await createShippingMethod(methodData)

      if (result.success) {
        setMessage({ type: 'success', text: 'Shipping method created successfully!' })
        setTimeout(() => {
          router.push('/admin/shipping')
        }, 1500)
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to create shipping method' })
      }
    } catch (error) {
      console.error('Error creating shipping method:', error)
      setMessage({ type: 'error', text: 'An unexpected error occurred' })
    } finally {
      setSaving(false)
    }
  }

  const addWeightTier = () => {
    const lastTier = fields[fields.length - 1]
    const newMaxWeight = lastTier ? lastTier.max_weight + 5 : 5
    const newCost = lastTier ? lastTier.cost + 5 : 8.99
    
    append({ 
      max_weight: newMaxWeight, 
      cost: newCost, 
      name: `Package ${fields.length + 1}` 
    })
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <Link href="/admin/login" className="text-blue-600 hover:underline">
            Please log in to access the admin panel
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/shipping"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Shipping Methods
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Add Shipping Method</h1>
        <p className="text-gray-600 mt-1">Create a new shipping option for your customers</p>
      </div>

      {/* Status Message */}
      {message && (
        <div className={`mb-4 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Form */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="form-label">Method Name *</label>
              <input
                type="text"
                {...register('name', { required: 'Method name is required' })}
                className="input-field"
                placeholder="e.g., Standard Shipping, Express Delivery"
              />
              {errors.name && (
                <p className="form-error">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="form-label">Method Type *</label>
              <select
                {...register('method_type', { required: 'Method type is required' })}
                className="input-field"
              >
                <option value="flat_rate">Flat Rate</option>
                <option value="weight_based">Weight Based</option>
                <option value="calculated">Calculated (API)</option>
                <option value="free">Free Shipping</option>
              </select>
            </div>
          </div>

          <div>
            <label className="form-label">Description</label>
            <textarea
              {...register('description')}
              className="input-field"
              rows={3}
              placeholder="Optional description for customers"
            />
          </div>

          {/* Method Type Specific Fields */}
          {watchedMethodType === 'flat_rate' && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-4">Flat Rate Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Shipping Cost *</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('flat_rate_cost', { 
                      required: 'Shipping cost is required for flat rate',
                      min: { value: 0, message: 'Cost must be 0 or greater' }
                    })}
                    className="input-field"
                    placeholder="8.99"
                  />
                  {errors.flat_rate_cost && (
                    <p className="form-error">{errors.flat_rate_cost.message}</p>
                  )}
                </div>

                <div>
                  <label className="form-label">Free Shipping Threshold</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('min_order_for_free_shipping')}
                    className="input-field"
                    placeholder="75.00 (optional)"
                  />
                  <p className="text-xs text-gray-500 mt-1">Order amount for free shipping</p>
                </div>
              </div>
            </div>
          )}

          {watchedMethodType === 'weight_based' && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-medium text-green-900 mb-4">Weight-Based Tiers</h3>
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-end space-x-4 bg-white p-3 rounded border">
                    <div className="flex-1">
                      <label className="form-label">Max Weight (lbs)</label>
                      <input
                        type="number"
                        step="0.1"
                        {...register(`weight_tiers.${index}.max_weight`, {
                          required: 'Max weight is required',
                          min: { value: 0.1, message: 'Weight must be greater than 0' }
                        })}
                        className="input-field"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="form-label">Cost ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        {...register(`weight_tiers.${index}.cost`, {
                          required: 'Cost is required',
                          min: { value: 0, message: 'Cost must be 0 or greater' }
                        })}
                        className="input-field"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="form-label">Tier Name</label>
                      <input
                        type="text"
                        {...register(`weight_tiers.${index}.name`)}
                        className="input-field"
                        placeholder="e.g., Light Package"
                      />
                    </div>
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="btn-outline text-red-600 border-red-300 hover:bg-red-50 px-3 py-2"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addWeightTier}
                  className="btn-outline w-full"
                >
                  Add Weight Tier
                </button>
              </div>
            </div>
          )}

          {watchedMethodType === 'calculated' && (
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-medium text-purple-900 mb-4">Calculated Shipping Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Carrier Code</label>
                  <select
                    {...register('carrier_code')}
                    className="input-field"
                  >
                    <option value="">Select Carrier</option>
                    <option value="ups">UPS</option>
                    <option value="fedex">FedEx</option>
                    <option value="usps">USPS</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Service Code</label>
                  <input
                    type="text"
                    {...register('service_code')}
                    className="input-field"
                    placeholder="e.g., ground, express, priority"
                  />
                </div>
              </div>
              <p className="text-xs text-purple-600 mt-2">
                Note: ShipStation integration is not yet implemented. This will use API calculation when available.
              </p>
            </div>
          )}

          {/* Delivery Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="form-label">Minimum Delivery Days *</label>
              <input
                type="number"
                {...register('estimated_days_min', {
                  required: 'Minimum days is required',
                  min: { value: 1, message: 'Must be at least 1 day' }
                })}
                className="input-field"
                placeholder="5"
              />
              {errors.estimated_days_min && (
                <p className="form-error">{errors.estimated_days_min.message}</p>
              )}
            </div>

            <div>
              <label className="form-label">Maximum Delivery Days *</label>
              <input
                type="number"
                {...register('estimated_days_max', {
                  required: 'Maximum days is required',
                  min: { value: 1, message: 'Must be at least 1 day' }
                })}
                className="input-field"
                placeholder="7"
              />
              {errors.estimated_days_max && (
                <p className="form-error">{errors.estimated_days_max.message}</p>
              )}
            </div>
          </div>

          {/* Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="form-label">Display Order</label>
              <input
                type="number"
                {...register('display_order')}
                className="input-field"
                placeholder="1"
              />
              <p className="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                {...register('active')}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label className="ml-2 text-sm text-gray-900">
                Active (available to customers)
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <Link
              href="/admin/shipping"
              className="btn-outline"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary"
            >
              {saving ? 'Creating...' : 'Create Shipping Method'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
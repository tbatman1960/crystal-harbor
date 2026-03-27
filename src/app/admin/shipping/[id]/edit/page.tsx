'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm, useFieldArray } from 'react-hook-form'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { useAdminStore } from '@/store/adminStore'

interface WeightTier {
  max_weight: number
  cost: number
  name: string
}

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

interface EditShippingMethodPageProps {
  params: { id: string }
}

export default function EditShippingMethodPage({ params }: EditShippingMethodPageProps) {
  const { isAuthenticated } = useAdminStore()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
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
      display_order: 1,
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'weight_tiers' })
  const watchedMethodType = watch('method_type')

  useEffect(() => {
    if (isAuthenticated) loadMethod()
  }, [isAuthenticated])

  const loadMethod = async () => {
    try {
      const res = await fetch('/api/admin/shipping-methods')
      const data = await res.json()
      const method = (data.shipping_methods || []).find((m: any) => m.id === params.id)

      if (!method) {
        setMessage({ type: 'error', text: 'Shipping method not found' })
        setPageLoading(false)
        return
      }

      reset({
        name: method.name || '',
        description: method.description || '',
        method_type: method.method_type || 'flat_rate',
        flat_rate_cost: method.flat_rate_cost,
        weight_tiers: method.weight_tiers?.length ? method.weight_tiers : [{ max_weight: 2, cost: 8.99, name: 'Light Package' }],
        carrier_code: method.carrier_code || '',
        service_code: method.service_code || '',
        min_order_for_free_shipping: method.min_order_for_free_shipping,
        estimated_days_min: method.estimated_days_min || 5,
        estimated_days_max: method.estimated_days_max || 7,
        active: method.active ?? true,
        display_order: method.display_order || 1,
      })
    } catch (error) {
      console.error('Error loading shipping method:', error)
      setMessage({ type: 'error', text: 'Failed to load shipping method' })
    } finally {
      setPageLoading(false)
    }
  }

  const onSubmit = async (data: ShippingMethodFormData) => {
    setSaving(true)
    setMessage(null)

    try {
      const payload = {
        id: params.id,
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
        display_order: data.display_order,
      }

      const res = await fetch('/api/admin/shipping-methods', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        setMessage({ type: 'success', text: 'Shipping method updated!' })
        setTimeout(() => router.push('/admin/shipping'), 1500)
      } else {
        const errData = await res.json()
        setMessage({ type: 'error', text: errData.error || 'Failed to update' })
      }
    } catch (error) {
      console.error('Error updating shipping method:', error)
      setMessage({ type: 'error', text: 'An unexpected error occurred' })
    } finally {
      setSaving(false)
    }
  }

  const addWeightTier = () => {
    const lastTier = fields[fields.length - 1]
    append({
      max_weight: lastTier ? lastTier.max_weight + 5 : 5,
      cost: lastTier ? lastTier.cost + 5 : 8.99,
      name: `Package ${fields.length + 1}`,
    })
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <Link href="/admin/login" className="text-blue-600 hover:underline">Please log in</Link>
        </div>
      </div>
    )
  }

  if (pageLoading) {
    return (
      <div className="p-6"><div className="animate-pulse"><div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div><div className="h-64 bg-gray-200 rounded"></div></div></div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href="/admin/shipping" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
          <ArrowLeftIcon className="h-5 w-5 mr-2" /> Back to Shipping Methods
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit Shipping Method</h1>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-white shadow-sm rounded-lg p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="form-label">Method Name *</label>
              <input type="text" {...register('name', { required: 'Name is required' })} className="input-field" />
              {errors.name && <p className="form-error">{errors.name.message}</p>}
            </div>
            <div>
              <label className="form-label">Method Type *</label>
              <select {...register('method_type')} className="input-field">
                <option value="flat_rate">Flat Rate</option>
                <option value="weight_based">Weight Based</option>
                <option value="calculated">Calculated (Carrier API)</option>
                <option value="free">Free Shipping</option>
              </select>
            </div>
          </div>

          <div>
            <label className="form-label">Description</label>
            <textarea {...register('description')} className="input-field" rows={3} />
          </div>

          {/* Flat Rate Config */}
          {watchedMethodType === 'flat_rate' && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-4">Flat Rate Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Shipping Cost *</label>
                  <input type="number" step="0.01" {...register('flat_rate_cost', { required: 'Cost is required' })} className="input-field" />
                </div>
                <div>
                  <label className="form-label">Free Shipping Threshold</label>
                  <input type="number" step="0.01" {...register('min_order_for_free_shipping')} className="input-field" placeholder="Optional" />
                </div>
              </div>
            </div>
          )}

          {/* Weight Based Config */}
          {watchedMethodType === 'weight_based' && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-medium text-green-900 mb-4">Weight-Based Tiers</h3>
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-end space-x-4 bg-white p-3 rounded border">
                    <div className="flex-1">
                      <label className="form-label">Max Weight (lbs)</label>
                      <input type="number" step="0.1" {...register(`weight_tiers.${index}.max_weight`)} className="input-field" />
                    </div>
                    <div className="flex-1">
                      <label className="form-label">Cost ($)</label>
                      <input type="number" step="0.01" {...register(`weight_tiers.${index}.cost`)} className="input-field" />
                    </div>
                    <div className="flex-1">
                      <label className="form-label">Tier Name</label>
                      <input type="text" {...register(`weight_tiers.${index}.name`)} className="input-field" />
                    </div>
                    {fields.length > 1 && (
                      <button type="button" onClick={() => remove(index)} className="btn-outline text-red-600 border-red-300 hover:bg-red-50 px-3 py-2">
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={addWeightTier} className="btn-outline w-full">Add Weight Tier</button>
              </div>
            </div>
          )}

          {/* Carrier Calculated Config */}
          {watchedMethodType === 'calculated' && (
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-medium text-purple-900 mb-4">Carrier API Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Carrier</label>
                  <select {...register('carrier_code')} className="input-field">
                    <option value="">Select Carrier</option>
                    <option value="usps">USPS</option>
                    <option value="ups">UPS (coming soon)</option>
                    <option value="fedex">FedEx (coming soon)</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Service Code</label>
                  <input type="text" {...register('service_code')} className="input-field" placeholder="e.g., priority, ground" />
                </div>
              </div>
              <p className="text-xs text-purple-600 mt-2">
                USPS rates are calculated via API. If credentials aren't configured, estimated rates are shown.
              </p>
            </div>
          )}

          {/* Delivery Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="form-label">Min Delivery Days *</label>
              <input type="number" {...register('estimated_days_min', { required: true, min: 1 })} className="input-field" />
            </div>
            <div>
              <label className="form-label">Max Delivery Days *</label>
              <input type="number" {...register('estimated_days_max', { required: true, min: 1 })} className="input-field" />
            </div>
          </div>

          {/* Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="form-label">Display Order</label>
              <input type="number" {...register('display_order')} className="input-field" />
            </div>
            <div className="flex items-center pt-6">
              <input type="checkbox" {...register('active')} className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
              <label className="ml-2 text-sm text-gray-900">Active (available to customers)</label>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t">
            <Link href="/admin/shipping" className="btn-outline">Cancel</Link>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

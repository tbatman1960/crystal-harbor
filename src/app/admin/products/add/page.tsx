'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { ArrowLeftIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useAdminStore } from '@/store/adminStore'

interface ProductFormData {
  name: string
  description: string
  category_id: string
  base_price: string
  material: string
  active: boolean
  enable_volume_pricing: boolean
  weight_lbs: string
  length_inches: string
  width_inches: string
  height_inches: string
  sizes: string[]
  colors: string[]
  shipping_methods: string[]
}

interface Category {
  id: string
  name: string
}

interface ShippingMethod {
  id: string
  name: string
  description: string | null
  method_type: string
  active: boolean
}

export default function AddProductPage() {
  const { isAuthenticated } = useAdminStore()
  const [categories, setCategories] = useState<Category[]>([])
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [newSize, setNewSize] = useState('')
  const [newColor, setNewColor] = useState('')
  
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    getValues
  } = useForm<ProductFormData>({
    defaultValues: {
      name: '',
      description: '',
      category_id: '',
      base_price: '',
      material: '',
      active: true,
      enable_volume_pricing: true,
      weight_lbs: '',
      length_inches: '',
      width_inches: '',
      height_inches: '',
      sizes: [],
      colors: [],
      shipping_methods: []
    }
  })

  const watchedSizes = watch('sizes')
  const watchedColors = watch('colors')
  const watchedShippingMethods = watch('shipping_methods')
  const watchedVolumePricing = watch('enable_volume_pricing')
  const watchedBasePrice = watch('base_price')

  useEffect(() => {
    if (isAuthenticated) {
      loadData()
    }
  }, [isAuthenticated])

  const loadData = async () => {
    try {
      const [categoriesRes, shippingData] = await Promise.all([
        fetch('/api/admin/categories').then(res => res.json()),
        fetch('/api/admin/shipping-methods').then(res => res.json())
      ])
      
      setCategories(categoriesRes.categories || [])
      setShippingMethods(shippingData.shipping_methods || [])
    } catch (error) {
      console.error('Error loading data:', error)
      setMessage({ type: 'error', text: 'Failed to load categories and shipping methods' })
    } finally {
      setLoading(false)
    }
  }

  const addSize = () => {
    if (newSize.trim() && !watchedSizes.includes(newSize.trim())) {
      setValue('sizes', [...watchedSizes, newSize.trim()])
      setNewSize('')
    }
  }

  const removeSize = (sizeToRemove: string) => {
    setValue('sizes', watchedSizes.filter(size => size !== sizeToRemove))
  }

  const addColor = () => {
    if (newColor.trim() && !watchedColors.includes(newColor.trim())) {
      setValue('colors', [...watchedColors, newColor.trim()])
      setNewColor('')
    }
  }

  const removeColor = (colorToRemove: string) => {
    setValue('colors', watchedColors.filter(color => color !== colorToRemove))
  }

  const toggleShippingMethod = (methodId: string) => {
    const current = watchedShippingMethods
    if (current.includes(methodId)) {
      setValue('shipping_methods', current.filter(id => id !== methodId))
    } else {
      setValue('shipping_methods', [...current, methodId])
    }
  }

  const onSubmit = async (data: ProductFormData) => {
    setSaving(true)
    setMessage(null)
    
    try {
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: 'Product created successfully!' })
        setTimeout(() => {
          router.push('/admin/products')
        }, 1500)
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to create product' })
      }
    } catch (error) {
      console.error('Error creating product:', error)
      setMessage({ type: 'error', text: 'Failed to create product' })
    } finally {
      setSaving(false)
    }
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

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/products"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Products
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
        <p className="text-gray-600 mt-1">Create a new product for your catalog</p>
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
              <label className="form-label">Product Name *</label>
              <input
                type="text"
                {...register('name', { required: 'Product name is required' })}
                className="input-field"
                placeholder="e.g., Custom T-Shirt"
              />
              {errors.name && (
                <p className="form-error">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="form-label">Category *</label>
              <select
                {...register('category_id', { required: 'Category is required' })}
                className="input-field"
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.category_id && (
                <p className="form-error">{errors.category_id.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="form-label">Description</label>
            <textarea
              {...register('description')}
              className="input-field"
              rows={4}
              placeholder="Product description for customers"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="form-label">Base Price *</label>
              <input
                type="number"
                step="0.01"
                {...register('base_price', { 
                  required: 'Base price is required',
                  min: { value: 0, message: 'Price must be greater than 0' }
                })}
                className="input-field"
                placeholder="18.99"
              />
              {errors.base_price && (
                <p className="form-error">{errors.base_price.message}</p>
              )}
            </div>

            <div>
              <label className="form-label">Material</label>
              <input
                type="text"
                {...register('material')}
                className="input-field"
                placeholder="e.g., Cotton/Polyester Blend"
              />
            </div>
          </div>

          {/* Pricing Mode */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-medium text-gray-900">Volume Pricing</h3>
                <p className="text-xs text-gray-500">Auto-generate quantity discount tiers from the base price</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('enable_volume_pricing')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {watchedVolumePricing && watchedBasePrice && parseFloat(watchedBasePrice) > 0 ? (
              <div className="bg-blue-50 rounded-lg p-3 space-y-2">
                <p className="text-xs font-medium text-blue-800 mb-2">Preview — tiers auto-calculated from ${parseFloat(watchedBasePrice).toFixed(2)} base price:</p>
                {[
                  { name: 'Tier 1', qty: '1–49', discount: 0 },
                  { name: 'Tier 2', qty: '50–249', discount: 18 },
                  { name: 'Tier 3', qty: '250+', discount: 32 },
                ].map(t => {
                  const price = Math.round(parseFloat(watchedBasePrice) * (1 - t.discount / 100) * 100) / 100
                  return (
                    <div key={t.name} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">{t.qty} units</span>
                      <span className="font-medium">
                        ${price.toFixed(2)}/ea
                        {t.discount > 0 && <span className="text-green-600 ml-2">({t.discount}% off)</span>}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : watchedVolumePricing ? (
              <p className="text-xs text-gray-400 italic">Enter a base price to see tier preview</p>
            ) : (
              <p className="text-xs text-gray-400 italic">Disabled — product will use flat base price only</p>
            )}
          </div>

          {/* Weight & Dimensions */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-1">Shipping Weight &amp; Dimensions</h3>
            <p className="text-xs text-gray-500 mb-3">Used for weight-based and carrier-calculated shipping rates</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="form-label">Weight (lbs)</label>
                <input type="number" step="0.01" min="0" {...register('weight_lbs')} className="input-field" placeholder="0.5" />
              </div>
              <div>
                <label className="form-label">Length (in)</label>
                <input type="number" step="0.1" min="0" {...register('length_inches')} className="input-field" placeholder="10" />
              </div>
              <div>
                <label className="form-label">Width (in)</label>
                <input type="number" step="0.1" min="0" {...register('width_inches')} className="input-field" placeholder="8" />
              </div>
              <div>
                <label className="form-label">Height (in)</label>
                <input type="number" step="0.1" min="0" {...register('height_inches')} className="input-field" placeholder="1" />
              </div>
            </div>
          </div>

          {/* Product Options */}
          <div className="space-y-6">
            {/* Sizes */}
            <div>
              <label className="form-label">Available Sizes</label>
              <div className="flex items-center space-x-2 mb-3">
                <input
                  type="text"
                  value={newSize}
                  onChange={(e) => setNewSize(e.target.value)}
                  className="input-field flex-1"
                  placeholder="Enter size (e.g., S, M, L, XL)"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addSize()
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={addSize}
                  className="btn-primary px-3 py-2"
                  disabled={!newSize.trim()}
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {watchedSizes.map((size, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                  >
                    {size}
                    <button
                      type="button"
                      onClick={() => removeSize(size)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Colors */}
            <div>
              <label className="form-label">Available Colors</label>
              <div className="flex items-center space-x-2 mb-3">
                <input
                  type="text"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  className="input-field flex-1"
                  placeholder="Enter color (e.g., Red, Blue, White)"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addColor()
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={addColor}
                  className="btn-primary px-3 py-2"
                  disabled={!newColor.trim()}
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {watchedColors.map((color, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                  >
                    {color}
                    <button
                      type="button"
                      onClick={() => removeColor(color)}
                      className="ml-2 text-green-600 hover:text-green-800"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Shipping Methods */}
            <div>
              <label className="form-label">Available Shipping Methods</label>
              <p className="text-sm text-gray-500 mb-3">
                Select which shipping methods are available for this product
              </p>
              
              <div className="space-y-3">
                {shippingMethods
                  .filter(method => method.active)
                  .map(method => (
                  <label
                    key={method.id}
                    className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={watchedShippingMethods.includes(method.id)}
                      onChange={() => toggleShippingMethod(method.id)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div className="ml-3 flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {method.name}
                      </div>
                      {method.description && (
                        <div className="text-sm text-gray-500">
                          {method.description}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 capitalize">
                      {method.method_type.replace('_', ' ')}
                    </span>
                  </label>
                ))}
              </div>
              
              {shippingMethods.filter(m => m.active).length === 0 && (
                <p className="text-sm text-gray-500 italic">
                  No active shipping methods available. 
                  <Link href="/admin/shipping" className="text-blue-600 hover:underline ml-1">
                    Create shipping methods
                  </Link>
                </p>
              )}
            </div>
          </div>

          {/* Settings */}
          <div className="flex items-center">
            <input
              type="checkbox"
              {...register('active')}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label className="ml-2 text-sm text-gray-900">
              Active (visible to customers)
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <Link
              href="/admin/products"
              className="btn-outline"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary"
            >
              {saving ? 'Creating...' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

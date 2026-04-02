'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PhotoIcon, PlusIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface OptionValue {
  value: string
  price_adjustment: number
}

interface CustomOptionGroup {
  type: string
  values: OptionValue[]
}

interface EditProductPageProps {
  params: {
    id: string
  }
}

export default function EditProductPage({ params }: EditProductPageProps) {
  const router = useRouter()
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    base_price: '',
    material: '',
    active: true,
    image_url: '',
    weight_lbs: '',
    length_inches: '',
    width_inches: '',
    height_inches: '',
    size_class: 'small',
    shipping_method: 'flat_rate',
  })
  const [sizeClasses, setSizeClasses] = useState<Array<{ name: string; label: string }>>([])

  const [sizes, setSizes] = useState<string[]>([])
  const [colors, setColors] = useState<string[]>([])
  const [newSize, setNewSize] = useState('')
  const [newColor, setNewColor] = useState('')
  const [customOptionGroups, setCustomOptionGroups] = useState<CustomOptionGroup[]>([])
  const [newOptionType, setNewOptionType] = useState('')
  const [newOptionValues, setNewOptionValues] = useState<Record<string, string>>({})
  const [newOptionPrices, setNewOptionPrices] = useState<Record<string, string>>({})
  const [photos, setPhotos] = useState<string[]>([])
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [pricingTiers, setPricingTiers] = useState<any[]>([])
  const [regeneratingTiers, setRegeneratingTiers] = useState(false)

  useEffect(() => {
    loadCategories()
    loadProduct()
    loadSizeClasses()
  }, [])

  const loadSizeClasses = async () => {
    try {
      const res = await fetch('/api/admin/shipping/size-classes')
      const data = await res.json()
      if (data.size_classes) setSizeClasses(data.size_classes)
    } catch (error) {
      console.error('Error loading size classes:', error)
    }
  }

  const loadCategories = async () => {
    try {
      const res = await fetch('/api/admin/categories')
      const data = await res.json()
      if (data.categories) {
        setCategories(data.categories)
      }
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const loadProduct = async () => {
    try {
      const res = await fetch(`/api/admin/products/${params.id}`)
      if (!res.ok) {
        setError('Product not found')
        setPageLoading(false)
        return
      }
      const data = await res.json()
      const product = data.product

      setFormData({
        name: product.name || '',
        description: product.description || '',
        category_id: product.category_id || '',
        base_price: product.base_price?.toString() || '',
        material: product.material || '',
        active: product.active ?? true,
        image_url: product.image_url || '',
        weight_lbs: product.weight_lbs?.toString() || '',
        length_inches: product.length_inches?.toString() || '',
        width_inches: product.width_inches?.toString() || '',
        height_inches: product.height_inches?.toString() || '',
        size_class: product.size_class || 'small',
        shipping_method: product.shipping_method || 'flat_rate',
      })

      setSizes(product.sizes?.map((s: any) => s.value) || [])
      setColors(product.colors?.map((c: any) => c.value) || [])
      setPricingTiers(product.pricing_tiers || [])

      // Load custom options
      if (product.custom_options && typeof product.custom_options === 'object') {
        const groups: CustomOptionGroup[] = Object.entries(product.custom_options).map(
          ([type, values]: [string, any]) => ({
            type,
            values: (values as any[]).map((v: any) => ({
              value: v.value,
              price_adjustment: v.price_adjustment || 0
            }))
          })
        )
        setCustomOptionGroups(groups)
      }

      if (product.image_url) {
        setPhotos([product.image_url])
      }
    } catch (error) {
      console.error('Error loading product:', error)
      setError('Failed to load product')
    } finally {
      setPageLoading(false)
    }
  }

  const addSize = () => {
    const trimmed = newSize.trim()
    if (trimmed && !sizes.includes(trimmed)) {
      setSizes([...sizes, trimmed])
      setNewSize('')
    }
  }

  const removeSize = (size: string) => {
    setSizes(sizes.filter(s => s !== size))
  }

  const addColor = () => {
    const trimmed = newColor.trim()
    if (trimmed && !colors.includes(trimmed)) {
      setColors([...colors, trimmed])
      setNewColor('')
    }
  }

  const removeColor = (color: string) => {
    setColors(colors.filter(c => c !== color))
  }

  const addOptionType = () => {
    const trimmed = newOptionType.trim()
    if (!trimmed) return
    const reserved = ['size', 'color']
    if (reserved.includes(trimmed.toLowerCase())) {
      setError('Size and Color are built-in options. Use the fields above.')
      return
    }
    if (customOptionGroups.some(g => g.type.toLowerCase() === trimmed.toLowerCase())) {
      setError(`Option type "${trimmed}" already exists.`)
      return
    }
    setCustomOptionGroups([...customOptionGroups, { type: trimmed, values: [] }])
    setNewOptionType('')
    setError('')
  }

  const removeOptionType = (type: string) => {
    setCustomOptionGroups(customOptionGroups.filter(g => g.type !== type))
    const updatedValues = { ...newOptionValues }
    const updatedPrices = { ...newOptionPrices }
    delete updatedValues[type]
    delete updatedPrices[type]
    setNewOptionValues(updatedValues)
    setNewOptionPrices(updatedPrices)
  }

  const addOptionValue = (type: string) => {
    const val = (newOptionValues[type] || '').trim()
    if (!val) return
    const price = parseFloat(newOptionPrices[type] || '0') || 0
    setCustomOptionGroups(customOptionGroups.map(g => {
      if (g.type !== type) return g
      if (g.values.some(v => v.value.toLowerCase() === val.toLowerCase())) return g
      return { ...g, values: [...g.values, { value: val, price_adjustment: price }] }
    }))
    setNewOptionValues({ ...newOptionValues, [type]: '' })
    setNewOptionPrices({ ...newOptionPrices, [type]: '' })
  }

  const removeOptionValue = (type: string, value: string) => {
    setCustomOptionGroups(customOptionGroups.map(g => {
      if (g.type !== type) return g
      return { ...g, values: g.values.filter(v => v.value !== value) }
    }))
  }

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a PNG, JPG, or WEBP image file')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be under 10MB')
      return
    }

    setUploadingPhoto(true)
    try {
      const newPhotoUrl = `/images/products/${Date.now()}-${file.name}`
      setPhotos(prev => [...prev, newPhotoUrl])
      if (!formData.image_url) {
        setFormData(prev => ({ ...prev, image_url: newPhotoUrl }))
      }
      alert('Photo uploaded successfully! (Note: Storage upload not yet configured)')
    } catch (error) {
      console.error('Error uploading photo:', error)
      alert('Error uploading photo')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleSetMainPhoto = (photoUrl: string) => {
    setFormData(prev => ({ ...prev, image_url: photoUrl }))
  }

  const handleDeletePhoto = (photoUrl: string) => {
    if (confirm('Are you sure you want to delete this photo?')) {
      setPhotos(prev => prev.filter(url => url !== photoUrl))
      if (formData.image_url === photoUrl) {
        const remainingPhotos = photos.filter(url => url !== photoUrl)
        setFormData(prev => ({
          ...prev,
          image_url: remainingPhotos.length > 0 ? remainingPhotos[0] : ''
        }))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/admin/products/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          category_id: formData.category_id,
          base_price: formData.base_price,
          material: formData.material,
          active: formData.active,
          weight_lbs: formData.weight_lbs || null,
          length_inches: formData.length_inches || null,
          width_inches: formData.width_inches || null,
          height_inches: formData.height_inches || null,
          sizes,
          colors,
          custom_options: customOptionGroups.reduce((acc, g) => {
            if (g.values.length > 0) acc[g.type] = g.values
            return acc
          }, {} as Record<string, OptionValue[]>),
          size_class: formData.size_class,
          shipping_method: formData.shipping_method,
        })
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to update product')
        return
      }

      router.push('/admin/products')
    } catch (error) {
      console.error('Error updating product:', error)
      setError('Error updating product')
    } finally {
      setLoading(false)
    }
  }

  if (pageLoading) {
    return (
      <div className="section-padding">
        <div className="text-center py-12">
          <div className="loading-pulse">Loading product...</div>
        </div>
      </div>
    )
  }

  if (error && !formData.name) {
    return (
      <div className="section-padding">
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={() => router.back()} className="btn-secondary">Go Back</button>
        </div>
      </div>
    )
  }

  return (
    <div className="section-padding">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-bold text-3xl text-primary-600 mb-2">
            Edit Product
          </h1>
          <p className="text-secondary-600">
            Modify product details and settings
          </p>
        </div>
        <button
          onClick={() => router.back()}
          className="btn-secondary"
        >
          Cancel
        </button>
      </div>

      <div className="max-w-2xl">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="card p-8 space-y-6">
          <div className="form-group">
            <label className="form-label">Product Name *</label>
            <input
              type="text"
              className="input-field"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="input-field"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Product Photos Management */}
          <div className="form-group">
            <label className="form-label">Product Photos</label>
            <div className="space-y-4">
              {photos.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {photos.map((photoUrl, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={photoUrl}
                          alt={`Product photo ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE4IiBmaWxsPSIjOWNhM2FmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2U8L3RleHQ+PC9zdmc+';
                          }}
                        />
                        {formData.image_url === photoUrl && (
                          <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                            Main
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center space-x-2">
                          {formData.image_url !== photoUrl && (
                            <button
                              type="button"
                              onClick={() => handleSetMainPhoto(photoUrl)}
                              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs"
                            >
                              Set Main
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeletePhoto(photoUrl)}
                            className="bg-red-500 hover:bg-red-600 text-white p-1 rounded"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-center mt-1 text-gray-600">
                        Photo {index + 1}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div className="text-center">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="photo-upload"
                    disabled={uploadingPhoto}
                  />
                  <label
                    htmlFor="photo-upload"
                    className={`cursor-pointer flex flex-col items-center ${
                      uploadingPhoto ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {uploadingPhoto ? (
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4" />
                    ) : (
                      <PlusIcon className="w-8 h-8 text-gray-400 mb-4" />
                    )}
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      {uploadingPhoto ? 'Uploading...' : 'Add Product Photo'}
                    </p>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, WEBP up to 10MB
                    </p>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select
                className="input-field"
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                required
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Base Price *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  className="input-field pl-8"
                  value={formData.base_price}
                  onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Material</label>
            <input
              type="text"
              className="input-field"
              value={formData.material}
              onChange={(e) => setFormData({ ...formData, material: e.target.value })}
              placeholder="e.g., Cotton, Polyester, Vinyl"
            />
          </div>

          {/* Volume Pricing Tiers */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-medium text-gray-900">Volume Pricing Tiers</h3>
                <p className="text-xs text-gray-500">Quantity-based discounts (0%, 18%, 32% off base price)</p>
              </div>
              <button
                type="button"
                disabled={regeneratingTiers || !formData.base_price}
                onClick={async () => {
                  if (!confirm('This will replace all existing pricing tiers with auto-calculated ones based on the current base price. Continue?')) return
                  setRegeneratingTiers(true)
                  try {
                    const res = await fetch(`/api/admin/products/${params.id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        ...{
                          name: formData.name,
                          description: formData.description,
                          category_id: formData.category_id,
                          base_price: formData.base_price,
                          material: formData.material,
                          active: formData.active,
                          weight_lbs: formData.weight_lbs || null,
                          length_inches: formData.length_inches || null,
                          width_inches: formData.width_inches || null,
                          height_inches: formData.height_inches || null,
                          sizes, colors,
                        },
                        regenerate_pricing_tiers: true,
                      })
                    })
                    if (res.ok) {
                      const data = await res.json()
                      setPricingTiers(data.product?.pricing_tiers || [])
                    }
                  } catch (e) { console.error(e) }
                  finally { setRegeneratingTiers(false) }
                }}
                className="text-sm btn-secondary"
              >
                {regeneratingTiers ? 'Generating...' : pricingTiers.length > 0 ? 'Regenerate Tiers' : 'Generate Tiers'}
              </button>
            </div>

            {pricingTiers.length > 0 ? (
              <div className="space-y-2">
                {pricingTiers
                  .sort((a: any, b: any) => a.min_quantity - b.min_quantity)
                  .map((tier: any) => (
                  <div key={tier.id} className="flex items-center justify-between bg-gray-50 rounded p-3 text-sm">
                    <span className="text-gray-700">
                      {tier.min_quantity}–{tier.max_quantity || '∞'} units
                    </span>
                    <span className="font-medium">
                      ${tier.price_per_unit.toFixed(2)}/ea
                      {tier.discount_percentage > 0 && (
                        <span className="text-green-600 ml-2">({tier.discount_percentage}% off)</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">No pricing tiers — product uses flat base price. Click &quot;Generate Tiers&quot; to add volume discounts.</p>
            )}
          </div>

          {/* Weight & Dimensions */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">Shipping Weight &amp; Dimensions</h3>
            <p className="text-xs text-gray-500 mb-4">Required for weight-based and carrier-calculated shipping rates.</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="form-group">
                <label className="form-label">Weight (lbs)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="input-field"
                  value={formData.weight_lbs}
                  onChange={(e) => setFormData({ ...formData, weight_lbs: e.target.value })}
                  placeholder="0.5"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Length (in)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  className="input-field"
                  value={formData.length_inches}
                  onChange={(e) => setFormData({ ...formData, length_inches: e.target.value })}
                  placeholder="10"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Width (in)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  className="input-field"
                  value={formData.width_inches}
                  onChange={(e) => setFormData({ ...formData, width_inches: e.target.value })}
                  placeholder="8"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Height (in)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  className="input-field"
                  value={formData.height_inches}
                  onChange={(e) => setFormData({ ...formData, height_inches: e.target.value })}
                  placeholder="1"
                />
              </div>
            </div>
          </div>

          {/* Shipping */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">Shipping</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Size Class</label>
                <select
                  className="input-field"
                  value={formData.size_class}
                  onChange={(e) => setFormData({ ...formData, size_class: e.target.value })}
                >
                  {sizeClasses.length > 0 ? (
                    sizeClasses.map(sc => (
                      <option key={sc.name} value={sc.name}>{sc.label}</option>
                    ))
                  ) : (
                    <>
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                    </>
                  )}
                </select>
                <p className="text-xs text-gray-500 mt-1">Determines which flat rate shipping tiers apply</p>
              </div>
              <div className="form-group">
                <label className="form-label">Shipping Method</label>
                <select
                  className="input-field"
                  value={formData.shipping_method}
                  onChange={(e) => setFormData({ ...formData, shipping_method: e.target.value })}
                >
                  <option value="flat_rate">Flat Rate</option>
                  <option value="usps">USPS</option>
                  <option value="fedex" disabled>FedEx (coming soon)</option>
                  <option value="ups" disabled>UPS (coming soon)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">How shipping cost is calculated for this product</p>
              </div>
            </div>
          </div>

          {/* Sizes */}
          <div className="form-group">
            <label className="form-label">Sizes</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {sizes.map((size) => (
                <span key={size} className="inline-flex items-center bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                  {size}
                  <button type="button" onClick={() => removeSize(size)} className="ml-2 hover:text-blue-600">
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                className="input-field flex-1"
                value={newSize}
                onChange={(e) => setNewSize(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSize(); } }}
                placeholder="Add a size (e.g., S, M, L, XL)"
              />
              <button type="button" onClick={addSize} className="btn-secondary">Add</button>
            </div>
          </div>

          {/* Colors */}
          <div className="form-group">
            <label className="form-label">Colors</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {colors.map((color) => (
                <span key={color} className="inline-flex items-center bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full">
                  {color}
                  <button type="button" onClick={() => removeColor(color)} className="ml-2 hover:text-green-600">
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                className="input-field flex-1"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addColor(); } }}
                placeholder="Add a color (e.g., Red, Blue, Black)"
              />
              <button type="button" onClick={addColor} className="btn-secondary">Add</button>
            </div>
          </div>

          {/* Custom Options */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-1">Custom Options</h3>
            <p className="text-xs text-gray-500 mb-4">Add custom option types beyond Size and Color. Each value can have an optional price adjustment.</p>

            {customOptionGroups.map((group) => (
              <div key={group.type} className="mb-4 bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-800">{group.type}</h4>
                  <button
                    type="button"
                    onClick={() => removeOptionType(group.type)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Remove Option
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  {group.values.map((v) => (
                    <span
                      key={v.value}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800"
                    >
                      {v.value}
                      {v.price_adjustment !== 0 && (
                        <span className="ml-1 text-purple-600">
                          ({v.price_adjustment > 0 ? '+' : ''}${v.price_adjustment.toFixed(2)})
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeOptionValue(group.type, v.value)}
                        className="ml-2 text-purple-600 hover:text-purple-800"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newOptionValues[group.type] || ''}
                    onChange={(e) => setNewOptionValues({ ...newOptionValues, [group.type]: e.target.value })}
                    className="input-field flex-1"
                    placeholder={`Add a ${group.type} value`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); addOptionValue(group.type) }
                    }}
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={newOptionPrices[group.type] || ''}
                    onChange={(e) => setNewOptionPrices({ ...newOptionPrices, [group.type]: e.target.value })}
                    className="input-field w-28"
                    placeholder="$ +/-"
                  />
                  <button
                    type="button"
                    onClick={() => addOptionValue(group.type)}
                    className="btn-secondary px-3 py-2"
                  >
                    <PlusIcon className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">Price adjustment: positive to add, negative to subtract, blank for $0</p>
              </div>
            ))}

            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newOptionType}
                onChange={(e) => setNewOptionType(e.target.value)}
                className="input-field flex-1"
                placeholder="New option type name (e.g., Finish, Font, Rush)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); addOptionType() }
                }}
              />
              <button
                type="button"
                onClick={addOptionType}
                className="btn-secondary px-4 py-2"
                disabled={!newOptionType.trim()}
              >
                Add Option Type
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              />
              <span>Active (visible to customers)</span>
            </label>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-4 border-t">
            <button
              type="button"
              onClick={() => router.back()}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Updating...' : 'Update Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

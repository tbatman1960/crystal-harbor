'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PhotoIcon, PlusIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline'

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
  })
  const [sizes, setSizes] = useState<string[]>([])
  const [colors, setColors] = useState<string[]>([])
  const [newSize, setNewSize] = useState('')
  const [newColor, setNewColor] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  useEffect(() => {
    loadCategories()
    loadProduct()
  }, [])

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
      })

      setSizes(product.sizes?.map((s: any) => s.value) || [])
      setColors(product.colors?.map((c: any) => c.value) || [])

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
          colors
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

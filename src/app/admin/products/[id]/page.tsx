'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCategories } from '@/lib/products'
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
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    base_price: '',
    material: '',
    active: true,
    image_url: ''
  })
  const [photos, setPhotos] = useState<string[]>([])
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  useEffect(() => {
    loadCategories()
    loadProduct()
  }, [])

  const loadCategories = async () => {
    try {
      const data = await getCategories()
      setCategories(data)
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const loadProduct = async () => {
    // TODO: Implement product loading by ID
    console.log('Loading product with ID:', params.id)
    // For now, just set some dummy data
    setFormData({
      name: 'Sample Product',
      description: 'This is a sample product description',
      category_id: '',
      base_price: '19.99',
      material: 'Cotton',
      active: true,
      image_url: '/images/products/sample-product.jpg'
    })
    // Mock existing photos
    setPhotos([
      '/images/products/sample-product.jpg',
      '/images/products/sample-product-alt.jpg'
    ])
  }

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a PNG, JPG, or WEBP image file')
      return
    }

    // Validate file size (10MB max for product photos)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be under 10MB')
      return
    }

    setUploadingPhoto(true)
    
    try {
      // TODO: Implement actual file upload to storage
      // For now, simulate upload with a placeholder URL
      const newPhotoUrl = `/images/products/${Date.now()}-${file.name}`
      
      // Add to photos array
      setPhotos(prev => [...prev, newPhotoUrl])
      
      // If this is the first photo, set it as the main image
      if (!formData.image_url) {
        setFormData(prev => ({ ...prev, image_url: newPhotoUrl }))
      }
      
      alert('Photo uploaded successfully! (Note: This is a demo - actual upload would save to storage)')
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
      
      // If this was the main image, set the first remaining photo as main
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
    
    try {
      // TODO: Implement product update API
      alert('Product update API not implemented yet. This would update: ' + formData.name)
      router.push('/admin/products')
    } catch (error) {
      console.error('Error updating product:', error)
      alert('Error updating product')
    } finally {
      setLoading(false)
    }
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
              {/* Current Photos Display */}
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
                            // Replace with placeholder if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE4IiBmaWxsPSIjOWNhM2FmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2U8L3RleHQ+PC9zdmc+';
                          }}
                        />
                        
                        {/* Main Photo Indicator */}
                        {formData.image_url === photoUrl && (
                          <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                            Main
                          </div>
                        )}
                        
                        {/* Photo Actions */}
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

              {/* Upload New Photo */}
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
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Photo Tips:</strong>
                </p>
                <ul className="text-xs text-blue-700 mt-1 space-y-1">
                  <li>• Use high-resolution images (at least 800x600px)</li>
                  <li>• Square or landscape orientation works best</li>
                  <li>• The "Main" photo appears in product listings</li>
                  <li>• Additional photos show in the product gallery</li>
                </ul>
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

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Development Note</h4>
            <p className="text-yellow-700 text-sm">
              This form is set up but the backend APIs for loading and updating products are not yet implemented. 
              Product ID: {params.id}
            </p>
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
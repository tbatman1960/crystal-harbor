'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
// Products and categories fetched via API routes (not direct Supabase) due to RLS
import { 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  PhotoIcon
} from '@heroicons/react/24/outline'

export default function AdminProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    category: '',
    search: '',
    status: 'all'
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        fetch('/api/admin/products'),
        fetch('/api/admin/categories')
      ])
      const productsData = await productsRes.json()
      const categoriesData = await categoriesRes.json()
      setProducts(productsData.products || [])
      setCategories(categoriesData.categories || [])
    } catch (error) {
      console.error('Error loading products:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter(product => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      if (!product.name.toLowerCase().includes(searchLower)) return false
    }
    
    if (filters.category && product.category_id !== filters.category) {
      return false
    }
    
    if (filters.status === 'active' && !product.active) return false
    if (filters.status === 'inactive' && product.active) return false
    
    return true
  })

  return (
    <div className="section-padding">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-bold text-3xl text-primary-600 mb-2">
            Products
          </h1>
          <p className="text-secondary-600">
            Manage your product catalog ({products.length} products)
          </p>
        </div>
        <button 
          onClick={() => router.push('/admin/products/add')}
          className="btn-primary flex items-center space-x-2"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Filters */}
      <div className="card p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="w-5 h-5 text-secondary-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search products..."
                className="input-field pl-10"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="input-field min-w-0 w-auto"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="input-field min-w-0 w-auto"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="card p-12 text-center">
          <div className="loading-pulse">Loading products...</div>
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div key={product.id} className="card p-6">
              {/* Product Image */}
              <div className="aspect-square bg-gray-100 rounded-lg mb-4 overflow-hidden relative group">
                {product.image_url ? (
                  <div className="relative w-full h-full">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Replace with placeholder if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE4IiBmaWxsPSIjOWNhM2FmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+';
                      }}
                    />
                    {/* Photo Count Indicator */}
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                      📷 1 photo
                    </div>
                    {/* Photo Management Hint */}
                    <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                      <div className="text-white text-sm text-center">
                        <div className="bg-blue-500 rounded-full p-2 mb-2 mx-auto w-fit">
                          📸
                        </div>
                        <div>Click Edit to<br/>manage photos</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary-100 to-secondary-200 group-hover:from-secondary-200 group-hover:to-secondary-300 transition-all duration-200">
                    <div className="text-center">
                      <div className="text-secondary-400 text-4xl mb-2">📷</div>
                      <div className="text-xs text-secondary-500">No photos</div>
                    </div>
                    {/* Add Photo Hint */}
                    <div className="absolute inset-0 bg-blue-500 bg-opacity-80 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                      <div className="text-white text-sm text-center">
                        <div className="text-2xl mb-2">➕</div>
                        <div>Click Edit to<br/>add photos</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-neutral-700">{product.name}</h3>
                    {!product.active && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
                        Inactive
                      </span>
                    )}
                  </div>
                </div>
                
                {product.category && (
                  <div className="text-sm text-accent-lime-600 font-medium mb-1">
                    {product.category.name}
                  </div>
                )}
                
                {product.description && (
                  <p className="text-sm text-secondary-600 mb-2 line-clamp-2">
                    {product.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-secondary-500">Starting at</span>
                    <div className="font-semibold text-lg text-neutral-700">
                      ${product.base_price.toFixed(2)}
                    </div>
                  </div>
                  
                  {product.material && (
                    <div className="text-xs text-secondary-500">
                      {product.material}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <button 
                  onClick={() => window.open(`/products/${product.category?.slug}/${product.slug}`, '_blank')}
                  className="text-accent-coral-500 hover:text-accent-coral-600 transition-colors duration-200"
                  title="View Product"
                >
                  <EyeIcon className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => router.push(`/admin/products/${product.id}#photos`)}
                  className="text-blue-500 hover:text-blue-600 transition-colors duration-200"
                  title="Manage Photos"
                >
                  <PhotoIcon className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => router.push(`/admin/products/${product.id}`)}
                  className="text-accent-lime-500 hover:text-accent-lime-600 transition-colors duration-200"
                  title="Edit Product"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => {
                    if (confirm(`Are you sure you want to delete "${product.name}"?`)) {
                      alert('Delete functionality not implemented yet')
                    }
                  }}
                  className="text-red-500 hover:text-red-600 transition-colors duration-200"
                  title="Delete Product"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="font-display font-semibold text-xl text-primary-600 mb-2">
            No Products Found
          </h3>
          <p className="text-secondary-600 mb-6">
            {filters.search || filters.category || filters.status !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Get started by adding your first product'
            }
          </p>
          <button 
            onClick={() => router.push('/admin/products/add')}
            className="btn-primary"
          >
            Add Your First Product
          </button>
        </div>
      )}

      {/* Categories Overview */}
      <div className="mt-12">
        <h2 className="font-display font-semibold text-2xl text-primary-600 mb-6">
          Categories
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((category) => {
            const categoryProductCount = products.filter(p => p.category_id === category.id).length
            return (
              <div key={category.id} className="card p-4 text-center">
                <h3 className="font-semibold text-neutral-700 mb-1">
                  {category.name}
                </h3>
                <p className="text-sm text-secondary-600 mb-2">
                  {categoryProductCount} products
                </p>
                <div className="flex items-center justify-center space-x-2">
                  <button className="text-accent-lime-500 hover:text-accent-lime-600 transition-colors duration-200">
                    <PencilIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
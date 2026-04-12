'use client'

import { useState, useEffect } from 'react'
import { DesignLayer } from '@/modules/customization/types'

interface DesignTemplate {
  id: string
  name: string
  category: string
  description?: string
  thumbnail_url?: string
  layer_data: DesignLayer[]
  product_types: string[]
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

interface TemplateCategory {
  id: string
  slug: string
  name: string
  description?: string
  icon_name?: string
  display_order: number
  is_active: boolean
}

export default function DesignTemplatesPage() {
  const [templates, setTemplates] = useState<DesignTemplate[]>([])
  const [categories, setCategories] = useState<TemplateCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<DesignTemplate | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    thumbnail_url: '',
    product_types: [] as string[],
    display_order: 0,
    is_active: true
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch templates
      const templatesResponse = await fetch('/api/admin/customization/templates')
      const templatesData = await templatesResponse.json()
      
      if (!templatesResponse.ok) {
        throw new Error(templatesData.error || 'Failed to fetch templates')
      }
      
      // Fetch categories from public endpoint
      const categoriesResponse = await fetch('/api/customization/templates', {
        method: 'POST'
      })
      const categoriesData = await categoriesResponse.json()
      
      if (!categoriesResponse.ok) {
        throw new Error(categoriesData.error || 'Failed to fetch categories')
      }
      
      setTemplates(templatesData.templates || [])
      setCategories(categoriesData.categories || [])
    } catch (err) {
      console.error('Error fetching data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.category) {
      alert('Please fill in all required fields')
      return
    }

    try {
      const url = editingTemplate 
        ? `/api/admin/customization/templates?id=${editingTemplate.id}`
        : '/api/admin/customization/templates'
      
      const method = editingTemplate ? 'PUT' : 'POST'
      
      const body = {
        name: formData.name.trim(),
        category: formData.category,
        description: formData.description.trim() || undefined,
        thumbnailUrl: formData.thumbnail_url.trim() || undefined,
        productTypes: formData.product_types,
        displayOrder: formData.display_order,
        isActive: formData.is_active,
        layerData: editingTemplate?.layer_data || [] // For now, use existing or empty
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save template')
      }

      await fetchData()
      resetForm()
    } catch (err) {
      console.error('Error saving template:', err)
      alert(err instanceof Error ? err.message : 'Failed to save template')
    }
  }

  const handleEdit = (template: DesignTemplate) => {
    setEditingTemplate(template)
    setFormData({
      name: template.name,
      category: template.category,
      description: template.description || '',
      thumbnail_url: template.thumbnail_url || '',
      product_types: template.product_types || [],
      display_order: template.display_order,
      is_active: template.is_active
    })
    setShowForm(true)
  }

  const handleDelete = async (template: DesignTemplate) => {
    if (!confirm(`Are you sure you want to delete "${template.name}"? This cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/customization/templates?id=${template.id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete template')
      }

      await fetchData()
    } catch (err) {
      console.error('Error deleting template:', err)
      alert(err instanceof Error ? err.message : 'Failed to delete template')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      description: '',
      thumbnail_url: '',
      product_types: [],
      display_order: 0,
      is_active: true
    })
    setEditingTemplate(null)
    setShowForm(false)
  }

  const getCategoryIcon = (iconName?: string) => {
    const icons: Record<string, string> = {
      'cake': '🎂',
      'trophy': '🏆', 
      'building': '🏢',
      'heart': '💖',
      'gift': '🎁'
    }
    return icons[iconName || ''] || '📝'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading templates...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Design Templates</h1>
          <p className="text-gray-600">Manage pre-made templates that customers can use as starting points</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Add Template
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={fetchData}
            className="mt-2 text-red-600 hover:text-red-700 font-medium"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Templates list */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Templates ({templates.length})</h2>
          
          {templates.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🎨</div>
              <h3 className="text-lg font-medium text-gray-600 mb-2">No Templates Yet</h3>
              <p className="text-gray-500 mb-4">Create your first design template to help customers get started quickly.</p>
              <button
                onClick={() => setShowForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add First Template
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium text-gray-900">{template.name}</h3>
                        <span className="text-sm text-gray-500">
                          {getCategoryIcon(categories.find(c => c.slug === template.category)?.icon_name)}
                          {categories.find(c => c.slug === template.category)?.name || template.category}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          template.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {template.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      
                      {template.description && (
                        <p className="text-gray-600 text-sm mb-2">{template.description}</p>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{template.layer_data.length} layers</span>
                        <span>Order: {template.display_order}</span>
                        {template.product_types.length > 0 && (
                          <span>Products: {template.product_types.join(', ')}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleEdit(template)}
                        className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(template)}
                        className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="absolute inset-0 bg-black opacity-50" onClick={resetForm} />
            <div className="relative bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingTemplate ? 'Edit Template' : 'Add Template'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Birthday Party Invitation"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category.slug} value={category.slug}>
                        {getCategoryIcon(category.icon_name)} {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    rows={3}
                    placeholder="Brief description of this template..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thumbnail URL
                  </label>
                  <input
                    type="url"
                    value={formData.thumbnail_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, thumbnail_url: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://example.com/preview.jpg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                    Active (visible to customers)
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingTemplate ? 'Update' : 'Create'} Template
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
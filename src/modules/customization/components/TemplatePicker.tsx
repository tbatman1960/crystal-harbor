'use client'

import { useState, useEffect } from 'react'
import { DesignLayer } from '../types'

interface DesignTemplate {
  id: string
  name: string
  category: string
  description?: string
  thumbnail_url?: string
  layer_data: DesignLayer[]
  product_types: string[]
  display_order: number
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

interface TemplatePickerProps {
  productType?: string
  onSelectTemplate: (template: DesignTemplate) => void
  onClose: () => void
}

export function TemplatePicker({ productType, onSelectTemplate, onClose }: TemplatePickerProps) {
  const [templates, setTemplates] = useState<DesignTemplate[]>([])
  const [categories, setCategories] = useState<TemplateCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTemplatesAndCategories()
  }, [productType])

  const fetchTemplatesAndCategories = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch templates
      const templatesUrl = new URL('/api/customization/templates', window.location.origin)
      if (productType) {
        templatesUrl.searchParams.set('productType', productType)
      }

      const templatesResponse = await fetch(templatesUrl.toString())
      const templatesData = await templatesResponse.json()

      if (!templatesResponse.ok) {
        throw new Error(templatesData.error || 'Failed to fetch templates')
      }

      // Fetch categories by making a POST request (since we're using POST for categories in the API)
      const categoriesResponse = await fetch('/api/customization/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      const categoriesData = await categoriesResponse.json()

      if (!categoriesResponse.ok) {
        throw new Error(categoriesData.error || 'Failed to fetch categories')
      }

      setTemplates(templatesData.templates || [])
      setCategories(categoriesData.categories || [])
    } catch (err) {
      console.error('Error fetching templates:', err)
      setError(err instanceof Error ? err.message : 'Failed to load templates')
    } finally {
      setLoading(false)
    }
  }

  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : templates.filter(t => t.category === selectedCategory)

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
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/70" onClick={onClose} />
        <div className="relative bg-white rounded-xl p-6 max-w-4xl w-full mx-4 shadow-2xl">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading templates...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/70" onClick={onClose} />
        <div className="relative bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Error Loading Templates</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex gap-2">
            <button
              onClick={fetchTemplatesAndCategories}
              className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Try Again
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-white rounded-xl p-6 max-w-6xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900">Choose a Template</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-2 mb-6 pb-4 border-b">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Templates
          </button>
          {categories.map((category) => (
            <button
              key={category.slug}
              onClick={() => setSelectedCategory(category.slug)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                selectedCategory === category.slug
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>{getCategoryIcon(category.icon_name)}</span>
              {category.name}
            </button>
          ))}
        </div>

        {/* Templates grid */}
        <div className="overflow-y-auto max-h-[60vh]">
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📝</div>
              <h4 className="text-lg font-medium text-gray-600 mb-2">No Templates Found</h4>
              <p className="text-gray-500">
                {selectedCategory === 'all' 
                  ? 'No templates are available yet.'
                  : `No templates found in the ${categories.find(c => c.slug === selectedCategory)?.name || selectedCategory} category.`
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                  onClick={() => onSelectTemplate(template)}
                >
                  {/* Template thumbnail */}
                  <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center">
                    {template.thumbnail_url ? (
                      <img
                        src={template.thumbnail_url}
                        alt={template.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-gray-400 text-center">
                        <div className="text-4xl mb-2">🎨</div>
                        <div className="text-sm">Preview</div>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity flex items-center justify-center">
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                        Use Template
                      </button>
                    </div>
                  </div>

                  {/* Template info */}
                  <div className="p-4">
                    <h4 className="font-medium text-gray-900 mb-1">{template.name}</h4>
                    {template.description && (
                      <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {getCategoryIcon(categories.find(c => c.slug === template.category)?.icon_name)} 
                        {categories.find(c => c.slug === template.category)?.name || template.category}
                      </span>
                      <span className="text-xs text-gray-500">
                        {template.layer_data.length} layer{template.layer_data.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t text-center">
          <p className="text-sm text-gray-500">
            Templates are fully customizable starting points. All elements can be edited, moved, or replaced.
          </p>
        </div>
      </div>
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'

interface PromptExample {
  id: string
  prompt_text: string
  category: string
  product_types: string[]
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

const CATEGORIES = [
  'general', 'animals', 'nature', 'abstract', 'vintage', 'space', 
  'floral', 'retro', 'fantasy', 'business', 'food', 'sports'
]

const PRODUCT_TYPES = [
  'mug', 't-shirt', 'poster', 'canvas', 'sticker', 'phone-case', 'pillow'
]

export default function AIPromptsPage() {
  const [prompts, setPrompts] = useState<PromptExample[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState<PromptExample | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    prompt_text: '',
    category: 'general',
    product_types: [] as string[],
    display_order: 0,
    is_active: true
  })

  useEffect(() => {
    fetchPrompts()
  }, [])

  const fetchPrompts = async () => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/admin/customization/prompts')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch prompts')
      }
      
      setPrompts(data.prompts || [])
    } catch (err) {
      console.error('Error fetching prompts:', err)
      setError(err instanceof Error ? err.message : 'Failed to load prompts')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.prompt_text.trim()) {
      alert('Please enter a prompt text')
      return
    }

    try {
      const url = editingPrompt 
        ? `/api/admin/customization/prompts?id=${editingPrompt.id}`
        : '/api/admin/customization/prompts'
      
      const method = editingPrompt ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save prompt')
      }

      await fetchPrompts()
      resetForm()
    } catch (err) {
      console.error('Error saving prompt:', err)
      alert(err instanceof Error ? err.message : 'Failed to save prompt')
    }
  }

  const handleEdit = (prompt: PromptExample) => {
    setEditingPrompt(prompt)
    setFormData({
      prompt_text: prompt.prompt_text,
      category: prompt.category,
      product_types: prompt.product_types || [],
      display_order: prompt.display_order,
      is_active: prompt.is_active
    })
    setShowForm(true)
  }

  const handleDelete = async (prompt: PromptExample) => {
    if (!confirm(`Are you sure you want to delete this prompt? This cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/customization/prompts?id=${prompt.id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete prompt')
      }

      await fetchPrompts()
    } catch (err) {
      console.error('Error deleting prompt:', err)
      alert(err instanceof Error ? err.message : 'Failed to delete prompt')
    }
  }

  const handleReorder = async (promptId: string, newOrder: number) => {
    try {
      const response = await fetch(`/api/admin/customization/prompts?id=${promptId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_order: newOrder })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to reorder prompt')
      }

      await fetchPrompts()
    } catch (err) {
      console.error('Error reordering prompt:', err)
      alert(err instanceof Error ? err.message : 'Failed to reorder prompt')
    }
  }

  const resetForm = () => {
    setFormData({
      prompt_text: '',
      category: 'general',
      product_types: [],
      display_order: 0,
      is_active: true
    })
    setEditingPrompt(null)
    setShowForm(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading prompts...</span>
      </div>
    )
  }

  // Group prompts by category
  const promptsByCategory = prompts.reduce((acc, prompt) => {
    const category = prompt.category || 'general'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(prompt)
    return acc
  }, {} as Record<string, PromptExample[]>)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Prompt Examples</h1>
          <p className="text-gray-600">Manage example prompts shown to customers for AI image generation</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Add Prompt
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={fetchPrompts}
            className="mt-2 text-red-600 hover:text-red-700 font-medium"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <h3 className="text-sm font-medium text-gray-500">Total Prompts</h3>
          <p className="text-2xl font-bold text-gray-900">{prompts.length}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <h3 className="text-sm font-medium text-gray-500">Active Prompts</h3>
          <p className="text-2xl font-bold text-green-600">{prompts.filter(p => p.is_active).length}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <h3 className="text-sm font-medium text-gray-500">Categories</h3>
          <p className="text-2xl font-bold text-blue-600">{Object.keys(promptsByCategory).length}</p>
        </div>
      </div>

      {/* Prompts list */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          {prompts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">✨</div>
              <h3 className="text-lg font-medium text-gray-600 mb-2">No Prompts Yet</h3>
              <p className="text-gray-500 mb-4">Add example prompts to help customers get started with AI generation.</p>
              <button
                onClick={() => setShowForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add First Prompt
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(promptsByCategory).map(([category, categoryPrompts]) => (
                <div key={category}>
                  <h3 className="text-lg font-medium text-gray-900 mb-3 capitalize">
                    {category} ({categoryPrompts.length})
                  </h3>
                  <div className="space-y-2">
                    {categoryPrompts
                      .sort((a, b) => a.display_order - b.display_order)
                      .map((prompt, index) => (
                        <div
                          key={prompt.id}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-sm font-medium text-gray-500">#{prompt.display_order}</span>
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  prompt.is_active
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {prompt.is_active ? 'Active' : 'Inactive'}
                                </span>
                                {prompt.product_types.length > 0 && (
                                  <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                    {prompt.product_types.join(', ')}
                                  </span>
                                )}
                              </div>
                              <p className="text-gray-900">{prompt.prompt_text}</p>
                              <div className="text-xs text-gray-500 mt-1">
                                {prompt.prompt_text.length}/500 characters
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 ml-4">
                              {index > 0 && (
                                <button
                                  onClick={() => handleReorder(prompt.id, prompt.display_order - 1.5)}
                                  className="p-1 text-gray-400 hover:text-gray-600"
                                  title="Move up"
                                >
                                  ↑
                                </button>
                              )}
                              {index < categoryPrompts.length - 1 && (
                                <button
                                  onClick={() => handleReorder(prompt.id, prompt.display_order + 1.5)}
                                  className="p-1 text-gray-400 hover:text-gray-600"
                                  title="Move down"
                                >
                                  ↓
                                </button>
                              )}
                              <button
                                onClick={() => handleEdit(prompt)}
                                className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(prompt)}
                                className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
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
                {editingPrompt ? 'Edit Prompt' : 'Add Prompt'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prompt Text * ({formData.prompt_text.length}/500)
                  </label>
                  <textarea
                    value={formData.prompt_text}
                    onChange={(e) => setFormData(prev => ({ ...prev, prompt_text: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    rows={3}
                    maxLength={500}
                    placeholder="e.g., A golden retriever wearing a party hat"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Types (optional)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {PRODUCT_TYPES.map((type) => (
                      <label key={type} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.product_types.includes(type)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData(prev => ({
                                ...prev,
                                product_types: [...prev.product_types, type]
                              }))
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                product_types: prev.product_types.filter(t => t !== type)
                              }))
                            }
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700 capitalize">{type.replace('-', ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
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
                    Active (shown to customers)
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingPrompt ? 'Update' : 'Create'} Prompt
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
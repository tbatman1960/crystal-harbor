'use client'

import { useState, useEffect, useRef } from 'react'
import { PlusIcon, MagnifyingGlassIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline'

interface Design {
  id: string
  name: string
  description: string | null
  image_url: string
  category: string
  tags: string[]
  active: boolean
  created_at: string
}

export default function DesignCatalogPage() {
  const [designs, setDesigns] = useState<Design[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Add/Edit form
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    newCategory: '',
    tags: '',
    active: true,
  })
  const [uploading, setUploading] = useState(false)
  const [uploadedUrl, setUploadedUrl] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadDesigns()
  }, [search, filterCategory, showInactive])

  const loadDesigns = async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (filterCategory) params.set('category', filterCategory)
      if (showInactive) params.set('include_inactive', 'true')

      const res = await fetch(`/api/admin/design-catalog?${params}`)
      if (res.ok) {
        const data = await res.json()
        setDesigns(data.designs || [])
        setCategories(data.categories || [])
      }
    } catch (err) {
      console.error('Error loading designs:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (file: File) => {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('product_id', 'catalog') // use "catalog" as a namespace

      const res = await fetch('/api/admin/customization/upload', {
        method: 'POST',
        body: fd,
      })

      if (res.ok) {
        const { url } = await res.json()
        setUploadedUrl(url)
      } else {
        setMessage({ type: 'error', text: 'Failed to upload image' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Upload error' })
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    const category = formData.newCategory.trim() || formData.category
    if (!formData.name.trim() || !category) {
      setMessage({ type: 'error', text: 'Name and category are required' })
      return
    }
    if (!editingId && !uploadedUrl) {
      setMessage({ type: 'error', text: 'Upload an image first' })
      return
    }

    const tags = formData.tags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)

    const payload: any = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      category,
      tags,
      active: formData.active,
    }

    if (uploadedUrl) {
      payload.image_url = uploadedUrl
    }

    try {
      let res
      if (editingId) {
        res = await fetch('/api/admin/design-catalog', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingId, ...payload }),
        })
      } else {
        payload.image_url = uploadedUrl
        res = await fetch('/api/admin/design-catalog', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      if (res.ok) {
        setMessage({ type: 'success', text: editingId ? 'Design updated' : 'Design added' })
        resetForm()
        loadDesigns()
      } else {
        const data = await res.json()
        setMessage({ type: 'error', text: data.error || 'Save failed' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Save error' })
    }
  }

  const handleEdit = (design: Design) => {
    setEditingId(design.id)
    setFormData({
      name: design.name,
      description: design.description || '',
      category: design.category,
      newCategory: '',
      tags: design.tags.join(', '),
      active: design.active,
    })
    setUploadedUrl(design.image_url)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this design permanently?')) return
    const res = await fetch(`/api/admin/design-catalog?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      setDesigns(designs.filter(d => d.id !== id))
      setMessage({ type: 'success', text: 'Design deleted' })
    }
  }

  const handleToggleActive = async (design: Design) => {
    const res = await fetch('/api/admin/design-catalog', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: design.id, active: !design.active }),
    })
    if (res.ok) {
      setDesigns(designs.map(d => d.id === design.id ? { ...d, active: !d.active } : d))
    }
  }

  const resetForm = () => {
    setShowForm(false)
    setEditingId(null)
    setFormData({ name: '', description: '', category: '', newCategory: '', tags: '', active: true })
    setUploadedUrl('')
    if (fileRef.current) fileRef.current.value = ''
  }

  // Group designs by category for display
  const grouped = designs.reduce((acc, d) => {
    if (!acc[d.category]) acc[d.category] = []
    acc[d.category].push(d)
    return acc
  }, {} as Record<string, Design[]>)

  return (
    <div className="section-padding">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-primary-600">Design Catalog</h1>
          <p className="text-secondary-600 text-sm">Manage designs available for product customization</p>
        </div>
        <button
          type="button"
          onClick={() => { resetForm(); setShowForm(true) }}
          className="btn-primary flex items-center gap-2"
        >
          <PlusIcon className="w-4 h-4" /> Add Design
        </button>
      </div>

      {message && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search designs..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">All Categories</option>
          {categories.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
          />
          Show inactive
        </label>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="card p-6 mb-6 border-2 border-blue-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editingId ? 'Edit Design' : 'Add New Design'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field"
                placeholder="Design name"
              />
            </div>

            <div>
              <label className="form-label">Category *</label>
              <div className="flex gap-2">
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="input-field flex-1"
                >
                  <option value="">Select or create new...</option>
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={formData.newCategory}
                  onChange={(e) => setFormData({ ...formData, newCategory: e.target.value, category: '' })}
                  className="input-field flex-1"
                  placeholder="New category"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="form-label">Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-field"
                placeholder="Brief description"
              />
            </div>

            <div>
              <label className="form-label">Tags</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="input-field"
                placeholder="sports, football, team (comma-separated)"
              />
            </div>

            <div>
              <label className="form-label">Image *</label>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleUpload(file)
                }}
              />
              <div className="flex items-center gap-3">
                {uploadedUrl && (
                  <img src={uploadedUrl} alt="Preview" className="w-16 h-16 object-cover rounded border" />
                )}
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="btn-secondary text-sm"
                >
                  {uploading ? 'Uploading...' : uploadedUrl ? 'Replace Image' : 'Upload Image'}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
              Active
            </label>
            <div className="flex-1" />
            <button type="button" onClick={resetForm} className="btn-secondary text-sm">Cancel</button>
            <button type="button" onClick={handleSave} className="btn-primary text-sm">
              {editingId ? 'Update Design' : 'Add Design'}
            </button>
          </div>
        </div>
      )}

      {/* Design grid by category */}
      {loading ? (
        <div className="text-center py-12 loading-pulse">Loading designs...</div>
      ) : designs.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No designs found. Click &quot;Add Design&quot; to get started.
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([category, items]) => (
            <div key={category}>
              <h2 className="text-lg font-semibold text-gray-800 mb-3 capitalize">
                {category}
                <span className="text-sm font-normal text-gray-400 ml-2">({items.length})</span>
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {items.map(design => (
                  <div
                    key={design.id}
                    className={`card overflow-hidden group relative ${!design.active ? 'opacity-50' : ''}`}
                  >
                    <div className="aspect-square relative">
                      <img
                        src={design.image_url}
                        alt={design.name}
                        className="w-full h-full object-cover"
                      />
                      {!design.active && (
                        <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded">
                          Inactive
                        </div>
                      )}
                      {/* Hover actions */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => handleEdit(design)}
                          className="p-2 bg-white rounded-full shadow hover:bg-gray-100"
                          title="Edit"
                        >
                          <PencilIcon className="w-4 h-4 text-gray-700" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleActive(design)}
                          className="p-2 bg-white rounded-full shadow hover:bg-gray-100"
                          title={design.active ? 'Deactivate' : 'Activate'}
                        >
                          {design.active ? '🚫' : '✅'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(design.id)}
                          className="p-2 bg-white rounded-full shadow hover:bg-red-100"
                          title="Delete"
                        >
                          <TrashIcon className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                    <div className="p-2">
                      <p className="text-sm font-medium text-gray-900 truncate">{design.name}</p>
                      {design.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {design.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

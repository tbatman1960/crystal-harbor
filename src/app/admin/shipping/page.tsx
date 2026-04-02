'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { TruckIcon, PlusIcon, TrashIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useAdminStore } from '@/store/adminStore'

interface SizeClass {
  id: string
  name: string
  label: string
  description: string | null
  display_order: number
}

interface RateTier {
  id: string
  size_class_name: string
  min_quantity: number
  max_quantity: number | null
  rate: number
  display_order: number
}

export default function AdminShippingPage() {
  const { isAuthenticated } = useAdminStore()
  const [sizeClasses, setSizeClasses] = useState<SizeClass[]>([])
  const [rateTiers, setRateTiers] = useState<RateTier[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [shipFromZip, setShipFromZip] = useState('46143')
  const [savingZip, setSavingZip] = useState(false)

  // Editing state for rate tiers
  const [editingTiers, setEditingTiers] = useState<{ [sizeClass: string]: RateTier[] }>({})
  const [isEditing, setIsEditing] = useState<string | null>(null) // which size class is being edited

  // New size class form
  const [showAddSizeClass, setShowAddSizeClass] = useState(false)
  const [newSizeClass, setNewSizeClass] = useState({ name: '', label: '', description: '' })
  const [savingSizeClass, setSavingSizeClass] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      loadData()
    }
  }, [isAuthenticated])

  const loadData = async () => {
    try {
      const [scRes, rtRes, zipRes] = await Promise.all([
        fetch('/api/admin/shipping/size-classes'),
        fetch('/api/admin/shipping/rate-tiers'),
        fetch('/api/admin/site-settings?key=ship_from_zip')
      ])

      const scData = await scRes.json()
      const rtData = await rtRes.json()
      const zipData = await zipRes.json()

      setSizeClasses(scData.size_classes || [])
      setRateTiers(rtData.rate_tiers || [])

      if (zipData.settings) {
        const zipSetting = Array.isArray(zipData.settings)
          ? zipData.settings.find((s: any) => s.key === 'ship_from_zip')
          : zipData.settings
        if (zipSetting?.value) setShipFromZip(zipSetting.value)
      }
    } catch (error) {
      console.error('Error loading shipping data:', error)
      setMessage({ type: 'error', text: 'Failed to load shipping data' })
    } finally {
      setLoading(false)
    }
  }

  const saveShipFromZip = async () => {
    setSavingZip(true)
    try {
      const res = await fetch('/api/admin/site-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'ship_from_zip', value: shipFromZip })
      })
      if (res.ok) {
        setMessage({ type: 'success', text: 'Ship-from ZIP code saved' })
      } else {
        setMessage({ type: 'error', text: 'Failed to save ZIP code' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to save ZIP code' })
    } finally {
      setSavingZip(false)
    }
  }

  // --- Size Class Management ---

  const handleAddSizeClass = async () => {
    if (!newSizeClass.name || !newSizeClass.label) {
      setMessage({ type: 'error', text: 'Name and label are required' })
      return
    }
    setSavingSizeClass(true)
    try {
      const res = await fetch('/api/admin/shipping/size-classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSizeClass.name.toLowerCase().replace(/\s+/g, '-'),
          label: newSizeClass.label,
          description: newSizeClass.description || null,
          display_order: sizeClasses.length + 1
        })
      })
      if (res.ok) {
        setMessage({ type: 'success', text: `Size class "${newSizeClass.label}" created` })
        setNewSizeClass({ name: '', label: '', description: '' })
        setShowAddSizeClass(false)
        await loadData()
      } else {
        const err = await res.json()
        setMessage({ type: 'error', text: err.error || 'Failed to create size class' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to create size class' })
    } finally {
      setSavingSizeClass(false)
    }
  }

  const handleDeleteSizeClass = async (sc: SizeClass) => {
    if (!confirm(`Delete size class "${sc.label}"? This will also remove its shipping rate tiers.`)) return
    try {
      const res = await fetch(`/api/admin/shipping/size-classes?id=${sc.id}`, { method: 'DELETE' })
      if (res.ok) {
        setMessage({ type: 'success', text: `Size class "${sc.label}" deleted` })
        await loadData()
      } else {
        setMessage({ type: 'error', text: 'Failed to delete size class' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to delete size class' })
    }
  }

  // --- Rate Tier Editing ---

  const getTiersForClass = (sizeClassName: string) => {
    if (isEditing === sizeClassName && editingTiers[sizeClassName]) {
      return editingTiers[sizeClassName]
    }
    return rateTiers.filter(t => t.size_class_name === sizeClassName)
  }

  const startEditingTiers = (sizeClassName: string) => {
    const currentTiers = rateTiers.filter(t => t.size_class_name === sizeClassName)
    setEditingTiers({ ...editingTiers, [sizeClassName]: currentTiers.length > 0 ? [...currentTiers] : [
      { id: 'new-1', size_class_name: sizeClassName, min_quantity: 1, max_quantity: 5, rate: 0, display_order: 1 }
    ]})
    setIsEditing(sizeClassName)
  }

  const cancelEditing = () => {
    setIsEditing(null)
    setEditingTiers({})
  }

  const updateEditingTier = (sizeClassName: string, index: number, field: string, value: any) => {
    const tiers = [...(editingTiers[sizeClassName] || [])]
    tiers[index] = { ...tiers[index], [field]: value }
    setEditingTiers({ ...editingTiers, [sizeClassName]: tiers })
  }

  const addEditingTier = (sizeClassName: string) => {
    const tiers = [...(editingTiers[sizeClassName] || [])]
    const lastTier = tiers[tiers.length - 1]
    const newMin = lastTier ? (lastTier.max_quantity || lastTier.min_quantity) + 1 : 1
    tiers.push({
      id: `new-${Date.now()}`,
      size_class_name: sizeClassName,
      min_quantity: newMin,
      max_quantity: null,
      rate: 0,
      display_order: tiers.length + 1
    })
    setEditingTiers({ ...editingTiers, [sizeClassName]: tiers })
  }

  const removeEditingTier = (sizeClassName: string, index: number) => {
    const tiers = [...(editingTiers[sizeClassName] || [])]
    tiers.splice(index, 1)
    setEditingTiers({ ...editingTiers, [sizeClassName]: tiers })
  }

  const saveEditingTiers = async (sizeClassName: string) => {
    const tiers = editingTiers[sizeClassName]
    if (!tiers || tiers.length === 0) {
      setMessage({ type: 'error', text: 'At least one tier is required' })
      return
    }

    // Validate tiers
    for (const tier of tiers) {
      if (tier.min_quantity < 1) {
        setMessage({ type: 'error', text: 'Min quantity must be at least 1' })
        return
      }
      if (tier.rate < 0) {
        setMessage({ type: 'error', text: 'Rate cannot be negative' })
        return
      }
    }

    try {
      const res = await fetch('/api/admin/shipping/rate-tiers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          size_class_name: sizeClassName,
          tiers: tiers.map((t, i) => ({
            size_class_name: sizeClassName,
            min_quantity: t.min_quantity,
            max_quantity: t.max_quantity,
            rate: t.rate,
            display_order: i + 1
          }))
        })
      })

      if (res.ok) {
        setMessage({ type: 'success', text: `Shipping rates updated for ${sizeClassName}` })
        setIsEditing(null)
        setEditingTiers({})
        await loadData()
      } else {
        const err = await res.json()
        setMessage({ type: 'error', text: err.error || 'Failed to save rates' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to save rates' })
    }
  }

  // --- Carrier API Status ---

  const carrierStatus = [
    { name: 'USPS', code: 'usps', status: 'placeholder', label: 'Placeholder — mock rates active' },
    { name: 'FedEx', code: 'fedex', status: 'coming_soon', label: 'Coming soon' },
    { name: 'UPS', code: 'ups', status: 'coming_soon', label: 'Coming soon' },
  ]

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

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded"></div>)}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <TruckIcon className="h-7 w-7 mr-3 text-blue-600" />
          Shipping Configuration
        </h1>
        <p className="text-gray-600 mt-1">Manage shipping size classes, flat rate tiers, and carrier integrations</p>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${
          message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-3 underline text-xs">Dismiss</button>
        </div>
      )}

      {/* Ship-From ZIP */}
      <div className="bg-white shadow-sm rounded-lg p-5 mb-6 border border-gray-200">
        <h2 className="font-semibold text-gray-900 mb-3">Shipping Origin</h2>
        <div className="flex items-end gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ship-From ZIP Code</label>
            <input
              type="text"
              value={shipFromZip}
              onChange={(e) => setShipFromZip(e.target.value)}
              className="input-field w-36"
              placeholder="46143"
              maxLength={5}
            />
          </div>
          <button onClick={saveShipFromZip} disabled={savingZip} className="btn-primary h-10 text-sm">
            {savingZip ? 'Saving...' : 'Save'}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">Used for carrier rate calculations (USPS, FedEx, UPS)</p>
      </div>

      {/* Size Classes */}
      <div className="bg-white shadow-sm rounded-lg p-5 mb-6 border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-gray-900">Size Classes</h2>
          <button
            onClick={() => setShowAddSizeClass(!showAddSizeClass)}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Size Class
          </button>
        </div>

        {showAddSizeClass && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Name (slug)</label>
                <input
                  type="text"
                  value={newSizeClass.name}
                  onChange={(e) => setNewSizeClass({ ...newSizeClass, name: e.target.value })}
                  className="input-field text-sm"
                  placeholder="e.g., extra-large"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Label</label>
                <input
                  type="text"
                  value={newSizeClass.label}
                  onChange={(e) => setNewSizeClass({ ...newSizeClass, label: e.target.value })}
                  className="input-field text-sm"
                  placeholder="e.g., Extra Large"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <input
                  type="text"
                  value={newSizeClass.description}
                  onChange={(e) => setNewSizeClass({ ...newSizeClass, description: e.target.value })}
                  className="input-field text-sm"
                  placeholder="e.g., Oversized banners"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleAddSizeClass} disabled={savingSizeClass} className="btn-primary text-sm">
                {savingSizeClass ? 'Creating...' : 'Create'}
              </button>
              <button onClick={() => setShowAddSizeClass(false)} className="btn-secondary text-sm">Cancel</button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {sizeClasses.map(sc => (
            <div key={sc.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
              <div>
                <span className="font-medium text-gray-900">{sc.label}</span>
                <span className="text-gray-400 text-xs ml-2">({sc.name})</span>
                {sc.description && <span className="text-gray-500 text-sm ml-3">— {sc.description}</span>}
              </div>
              <button
                onClick={() => handleDeleteSizeClass(sc)}
                className="text-red-500 hover:text-red-700 p-1"
                title="Delete"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Flat Rate Tiers — one section per size class */}
      <div className="bg-white shadow-sm rounded-lg p-5 mb-6 border border-gray-200">
        <h2 className="font-semibold text-gray-900 mb-4">Flat Rate Shipping Tiers</h2>
        <p className="text-sm text-gray-500 mb-4">Set shipping rates by quantity bracket for each size class. These rates apply to all products assigned that size class.</p>

        {sizeClasses.map(sc => {
          const tiers = getTiersForClass(sc.name)
          const editing = isEditing === sc.name

          return (
            <div key={sc.name} className="mb-6 last:mb-0">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-semibold text-gray-700">{sc.label}</h3>
                {!editing ? (
                  <button onClick={() => startEditingTiers(sc.name)} className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
                    <PencilIcon className="h-3.5 w-3.5 mr-1" /> Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => saveEditingTiers(sc.name)} className="text-sm text-green-600 hover:text-green-800 flex items-center">
                      <CheckIcon className="h-3.5 w-3.5 mr-1" /> Save
                    </button>
                    <button onClick={cancelEditing} className="text-sm text-gray-500 hover:text-gray-700 flex items-center">
                      <XMarkIcon className="h-3.5 w-3.5 mr-1" /> Cancel
                    </button>
                  </div>
                )}
              </div>

              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 uppercase">
                    <th className="pb-1 pr-3">Qty Min</th>
                    <th className="pb-1 pr-3">Qty Max</th>
                    <th className="pb-1 pr-3">Rate</th>
                    {editing && <th className="pb-1 w-10"></th>}
                  </tr>
                </thead>
                <tbody>
                  {tiers.length === 0 ? (
                    <tr>
                      <td colSpan={editing ? 4 : 3} className="py-3 text-gray-400 text-center italic">
                        No tiers configured
                      </td>
                    </tr>
                  ) : (
                    tiers.map((tier, idx) => (
                      <tr key={tier.id || idx} className="border-t border-gray-100">
                        <td className="py-1.5 pr-3">
                          {editing ? (
                            <input
                              type="number"
                              min={1}
                              value={tier.min_quantity}
                              onChange={(e) => updateEditingTier(sc.name, idx, 'min_quantity', parseInt(e.target.value) || 1)}
                              className="input-field w-20 text-sm"
                            />
                          ) : tier.min_quantity}
                        </td>
                        <td className="py-1.5 pr-3">
                          {editing ? (
                            <input
                              type="number"
                              min={1}
                              value={tier.max_quantity ?? ''}
                              placeholder="∞"
                              onChange={(e) => updateEditingTier(sc.name, idx, 'max_quantity', e.target.value ? parseInt(e.target.value) : null)}
                              className="input-field w-20 text-sm"
                            />
                          ) : (tier.max_quantity ?? '∞')}
                        </td>
                        <td className="py-1.5 pr-3">
                          {editing ? (
                            <div className="flex items-center">
                              <span className="text-gray-500 mr-1">$</span>
                              <input
                                type="number"
                                min={0}
                                step={0.01}
                                value={tier.rate}
                                onChange={(e) => updateEditingTier(sc.name, idx, 'rate', parseFloat(e.target.value) || 0)}
                                className="input-field w-24 text-sm"
                              />
                            </div>
                          ) : `$${Number(tier.rate).toFixed(2)}`}
                        </td>
                        {editing && (
                          <td className="py-1.5">
                            <button onClick={() => removeEditingTier(sc.name, idx)} className="text-red-400 hover:text-red-600">
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {editing && (
                <button
                  onClick={() => addEditingTier(sc.name)}
                  className="mt-2 text-xs text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <PlusIcon className="h-3.5 w-3.5 mr-1" /> Add Bracket
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Carrier API Status */}
      <div className="bg-white shadow-sm rounded-lg p-5 border border-gray-200">
        <h2 className="font-semibold text-gray-900 mb-3">Carrier API Status</h2>
        <div className="space-y-2">
          {carrierStatus.map(carrier => (
            <div key={carrier.code} className="flex items-center gap-3 py-1.5">
              <div className={`w-2.5 h-2.5 rounded-full ${
                carrier.status === 'connected' ? 'bg-green-400' :
                carrier.status === 'placeholder' ? 'bg-yellow-400' :
                'bg-gray-300'
              }`} />
              <span className="text-sm font-medium text-gray-700 w-16">{carrier.name}</span>
              <span className="text-sm text-gray-500">{carrier.label}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Configure carrier API credentials in Netlify environment variables to enable live rates.
        </p>
      </div>
    </div>
  )
}

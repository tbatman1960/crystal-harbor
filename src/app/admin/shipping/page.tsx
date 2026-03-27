'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PlusIcon, PencilIcon, TrashIcon, TruckIcon, Cog6ToothIcon } from '@heroicons/react/24/outline'
import { useAdminStore } from '@/store/adminStore'

interface ShippingMethod {
  id: string
  name: string
  description: string | null
  method_type: string
  flat_rate_cost: number | null
  weight_tiers: any[] | null
  carrier_code: string | null
  service_code: string | null
  min_order_for_free_shipping: number | null
  estimated_days_min: number
  estimated_days_max: number
  active: boolean
  display_order: number
}

export default function AdminShippingPage() {
  const { isAuthenticated } = useAdminStore()
  const [methods, setMethods] = useState<ShippingMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [shipFromZip, setShipFromZip] = useState('')
  const [savingZip, setSavingZip] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      loadShippingMethods()
      loadShipFromZip()
    }
  }, [isAuthenticated])

  const loadShippingMethods = async () => {
    try {
      const res = await fetch('/api/admin/shipping-methods')
      const data = await res.json()
      setMethods(data.shipping_methods || [])
    } catch (error) {
      console.error('Error loading shipping methods:', error)
      setMessage({ type: 'error', text: 'Failed to load shipping methods' })
    } finally {
      setLoading(false)
    }
  }

  const loadShipFromZip = async () => {
    try {
      const res = await fetch('/api/admin/site-settings?category=shipping')
      const data = await res.json()
      const zipSetting = data.settings?.find((s: any) => s.key === 'ship_from_zip')
      if (zipSetting) setShipFromZip(zipSetting.value)
      else setShipFromZip('46143') // default
    } catch {
      setShipFromZip('46143')
    }
  }

  const saveShipFromZip = async () => {
    setSavingZip(true)
    try {
      const res = await fetch('/api/admin/site-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'ship_from_zip', value: shipFromZip, category: 'shipping' })
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

  const handleToggleActive = async (method: ShippingMethod) => {
    try {
      const res = await fetch('/api/admin/shipping-methods', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: method.id, active: !method.active })
      })
      
      if (res.ok) {
        await loadShippingMethods()
        setMessage({ type: 'success', text: `${method.name} ${method.active ? 'disabled' : 'enabled'}` })
      } else {
        setMessage({ type: 'error', text: 'Failed to update shipping method' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to update shipping method' })
    }
  }

  const handleDelete = async (method: ShippingMethod) => {
    if (!confirm(`Deactivate "${method.name}"? It will be hidden but not permanently deleted.`)) return

    try {
      // Soft delete: just mark inactive
      const res = await fetch('/api/admin/shipping-methods', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: method.id, active: false })
      })
      
      if (res.ok) {
        await loadShippingMethods()
        setMessage({ type: 'success', text: `${method.name} deactivated` })
      } else {
        setMessage({ type: 'error', text: 'Failed to deactivate shipping method' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to deactivate shipping method' })
    }
  }

  const getMethodTypeDisplay = (type: string) => {
    switch (type) {
      case 'flat_rate': return 'Flat Rate'
      case 'weight_based': return 'Weight Based'
      case 'calculated': return 'Carrier Calculated'
      case 'free': return 'Free Shipping'
      default: return type
    }
  }

  const getMethodTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'flat_rate': return 'bg-blue-100 text-blue-800'
      case 'weight_based': return 'bg-green-100 text-green-800'
      case 'calculated': return 'bg-purple-100 text-purple-800'
      case 'free': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getMethodCostDisplay = (method: ShippingMethod) => {
    switch (method.method_type) {
      case 'free': return 'Free'
      case 'flat_rate':
        return method.flat_rate_cost ? `$${method.flat_rate_cost.toFixed(2)}` : 'Not set'
      case 'weight_based':
        if (method.weight_tiers && method.weight_tiers.length > 0) {
          const sorted = [...method.weight_tiers].sort((a, b) => a.cost - b.cost)
          return `$${sorted[0].cost.toFixed(2)} – $${sorted[sorted.length - 1].cost.toFixed(2)}`
        }
        return 'Not configured'
      case 'calculated':
        return `${(method.carrier_code || 'carrier').toUpperCase()} API`
      default: return 'Unknown'
    }
  }

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
          <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-200 rounded"></div>)}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <TruckIcon className="h-8 w-8 mr-3 text-blue-600" />
            Shipping Management
          </h1>
          <p className="text-gray-600 mt-1">Configure shipping methods, rates, and carrier integrations</p>
        </div>
        <Link href="/admin/shipping/add" className="btn-primary flex items-center">
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Shipping Method
        </Link>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-4 text-sm underline">Dismiss</button>
        </div>
      )}

      {/* Ship-From Configuration */}
      <div className="bg-white shadow-sm rounded-lg p-6 mb-6 border border-gray-200">
        <div className="flex items-center mb-4">
          <Cog6ToothIcon className="h-5 w-5 mr-2 text-gray-600" />
          <h2 className="font-semibold text-gray-900">Shipping Origin</h2>
        </div>
        <div className="flex items-end space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ship-From ZIP Code</label>
            <input
              type="text"
              value={shipFromZip}
              onChange={(e) => setShipFromZip(e.target.value)}
              className="input-field w-40"
              placeholder="46143"
              maxLength={5}
            />
            <p className="text-xs text-gray-500 mt-1">Used for carrier rate calculations (USPS, etc.)</p>
          </div>
          <button onClick={saveShipFromZip} disabled={savingZip} className="btn-primary h-10">
            {savingZip ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Shipping Methods Table */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Delivery</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {methods.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <TruckIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No shipping methods</h3>
                  <p className="text-gray-500 mb-4">Create your first shipping method to get started.</p>
                  <Link href="/admin/shipping/add" className="btn-primary inline-flex items-center">
                    <PlusIcon className="h-5 w-5 mr-2" /> Add Shipping Method
                  </Link>
                </td>
              </tr>
            ) : (
              methods.map((method) => (
                <tr key={method.id} className={`hover:bg-gray-50 ${!method.active ? 'opacity-60' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{method.name}</div>
                    {method.description && <div className="text-sm text-gray-500">{method.description}</div>}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getMethodTypeBadgeColor(method.method_type)}`}>
                      {getMethodTypeDisplay(method.method_type)}
                    </span>
                    {method.carrier_code && (
                      <span className="ml-1 text-xs text-gray-500">({method.carrier_code.toUpperCase()})</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{getMethodCostDisplay(method)}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {method.estimated_days_min === method.estimated_days_max
                      ? `${method.estimated_days_min} days`
                      : `${method.estimated_days_min}-${method.estimated_days_max} days`}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleActive(method)}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        method.active ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                    >
                      {method.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center space-x-3">
                      <Link href={`/admin/shipping/${method.id}/edit`} className="text-blue-600 hover:text-blue-900" title="Edit">
                        <PencilIcon className="h-5 w-5" />
                      </Link>
                      <button onClick={() => handleDelete(method)} className="text-red-600 hover:text-red-900" title="Deactivate">
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Quick Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-500 mb-1">Total Methods</h3>
          <p className="text-3xl font-bold text-blue-600">{methods.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-500 mb-1">Active</h3>
          <p className="text-3xl font-bold text-green-600">{methods.filter(m => m.active).length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-500 mb-1">Carrier Integrated</h3>
          <p className="text-3xl font-bold text-purple-600">{methods.filter(m => m.method_type === 'calculated').length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-500 mb-1">Ship-From ZIP</h3>
          <p className="text-3xl font-bold text-gray-700">{shipFromZip || '—'}</p>
        </div>
      </div>

      {/* USPS API Status */}
      <div className="mt-6 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="font-semibold text-gray-900 mb-3">Carrier API Status</h2>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
            <span className="text-sm text-gray-700">USPS — Placeholder credentials (mock rates active)</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Add real USPS API credentials in Netlify environment variables (USPS_API_USER_ID, USPS_API_KEY) to enable live rates.
        </p>
      </div>
    </div>
  )
}

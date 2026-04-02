'use client'

import { useState, useEffect } from 'react'
import { TruckIcon, PlusIcon, TrashIcon, PencilIcon, CheckIcon, XMarkIcon, Cog6ToothIcon, CalculatorIcon } from '@heroicons/react/24/outline'
import { useAdminStore } from '@/store/adminStore'

interface PackageType {
  id: string
  name: string
  capacity_units: number
  max_weight_lbs: number
  length_inches: number
  width_inches: number
  height_inches: number
  empty_weight_lbs: number
  fallback_rate: number
  active: boolean
  sort_order: number
}

interface Product {
  id: string
  name: string
  packing_units: number
  packed_weight_lbs: number
}

interface CarrierStatus {
  usps: { available: boolean; configured: boolean }
  fedex: { available: boolean; configured: boolean }
  ups: { available: boolean; configured: boolean }
}

interface SiteSettings {
  shipping_origin_zip: string
  shipping_fallback_min_per_package: string
  shipping_fallback_markup_pct: string
}

interface TestItem {
  product_name: string
  quantity: number
  packing_units: number
  packed_weight_lbs: number
}

export default function AdminShippingPage() {
  const { isAuthenticated } = useAdminStore()
  const [activeTab, setActiveTab] = useState<'packages' | 'settings' | 'products' | 'test'>('packages')
  
  // Package management
  const [packages, setPackages] = useState<PackageType[]>([])
  const [editingPackage, setEditingPackage] = useState<PackageType | null>(null)
  const [showAddPackage, setShowAddPackage] = useState(false)
  
  // Settings
  const [settings, setSettings] = useState<SiteSettings>({
    shipping_origin_zip: '46143',
    shipping_fallback_min_per_package: '4.99',
    shipping_fallback_markup_pct: '0'
  })
  const [carrierStatus, setCarrierStatus] = useState<CarrierStatus | null>(null)
  
  // Products quick editor
  const [products, setProducts] = useState<Product[]>([])
  const [editingProduct, setEditingProduct] = useState<string | null>(null)
  
  // Test calculator
  const [testItems, setTestItems] = useState<TestItem[]>([])
  const [testDestZip, setTestDestZip] = useState('90210')
  const [testResult, setTestResult] = useState<any>(null)
  
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (isAuthenticated) {
      loadData()
    }
  }, [isAuthenticated])

  const loadData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        loadPackages(),
        loadSettings(),
        loadCarrierStatus(),
        loadProducts()
      ])
    } catch (error) {
      console.error('Error loading shipping data:', error)
      setMessage({ type: 'error', text: 'Failed to load shipping data' })
    } finally {
      setLoading(false)
    }
  }

  const loadPackages = async () => {
    const response = await fetch('/api/admin/shipping/packages')
    const data = await response.json()
    if (data.packages) {
      setPackages(data.packages.sort((a: PackageType, b: PackageType) => a.sort_order - b.sort_order))
    }
  }

  const loadSettings = async () => {
    const response = await fetch('/api/admin/site-settings')
    const data = await response.json()
    if (data.settings) {
      const settingsMap = new Map(data.settings.map((s: any) => [s.key, s.value]))
      setSettings({
        shipping_origin_zip: (settingsMap.get('shipping_origin_zip') || settingsMap.get('ship_from_zip') || '46143') as string,
        shipping_fallback_min_per_package: (settingsMap.get('shipping_fallback_min_per_package') || '4.99') as string,
        shipping_fallback_markup_pct: (settingsMap.get('shipping_fallback_markup_pct') || '0') as string
      })
    }
  }

  const loadCarrierStatus = async () => {
    try {
      const response = await fetch('/api/admin/shipping/carrier-status')
      const data = await response.json()
      setCarrierStatus(data.carriers)
    } catch (error) {
      console.log('Carrier status not available')
    }
  }

  const loadProducts = async () => {
    const response = await fetch('/api/admin/products?limit=100')
    const data = await response.json()
    if (data.products) {
      setProducts(data.products.map((p: any) => ({
        id: p.id,
        name: p.name,
        packing_units: p.packing_units || 1.0,
        packed_weight_lbs: p.packed_weight_lbs || 0.5
      })))
    }
  }

  const savePackage = async (packageData: Partial<PackageType>) => {
    try {
      const url = editingPackage ? `/api/admin/shipping/packages/${editingPackage.id}` : '/api/admin/shipping/packages'
      const method = editingPackage ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(packageData)
      })

      if (response.ok) {
        setMessage({ type: 'success', text: `Package ${editingPackage ? 'updated' : 'created'} successfully` })
        setEditingPackage(null)
        setShowAddPackage(false)
        loadPackages()
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.error || 'Failed to save package' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save package' })
    }
  }

  const deletePackage = async (packageId: string) => {
    if (!confirm('Are you sure you want to delete this package type?')) return

    try {
      const response = await fetch(`/api/admin/shipping/packages/${packageId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Package deleted successfully' })
        loadPackages()
      } else {
        setMessage({ type: 'error', text: 'Failed to delete package' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete package' })
    }
  }

  const updateSetting = async (key: string, value: string) => {
    try {
      const response = await fetch('/api/admin/site-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
      })

      if (response.ok) {
        setSettings({ ...settings, [key]: value })
        setMessage({ type: 'success', text: 'Setting updated successfully' })
      } else {
        setMessage({ type: 'error', text: 'Failed to update setting' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update setting' })
    }
  }

  const updateProductPacking = async (productId: string, updates: Partial<Product>) => {
    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (response.ok) {
        setProducts(products.map(p => 
          p.id === productId ? { ...p, ...updates } : p
        ))
        setEditingProduct(null)
        setMessage({ type: 'success', text: 'Product packing data updated' })
      } else {
        setMessage({ type: 'error', text: 'Failed to update product' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update product' })
    }
  }

  const runTestCalculation = async () => {
    if (testItems.length === 0 || !testDestZip) {
      setMessage({ type: 'error', text: 'Please add test items and destination zip' })
      return
    }

    try {
      const response = await fetch('/api/shipping/available', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: testItems.map((item, index) => ({
            product_id: `test-${index}`,
            product_name: item.product_name,
            quantity: item.quantity
          })),
          destination_zip: testDestZip
        })
      })

      const data = await response.json()
      setTestResult(data)
    } catch (error) {
      setMessage({ type: 'error', text: 'Test calculation failed' })
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">Please log in to access the admin panel</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <TruckIcon className="h-8 w-8 mr-3" />
          Shipping Management
        </h1>
        <p className="text-gray-600 mt-1">Manage package types, shipping settings, and test the new packing system</p>
      </div>

      {/* Status Message */}
      {message && (
        <div className={`mb-4 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
          <button 
            onClick={() => setMessage(null)} 
            className="ml-4 text-sm underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'packages', label: 'Package Types', icon: TruckIcon },
            { id: 'settings', label: 'Settings', icon: Cog6ToothIcon },
            { id: 'products', label: 'Product Packing', icon: PencilIcon },
            { id: 'test', label: 'Test Calculator', icon: CalculatorIcon }
          ].map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Package Types Tab */}
      {activeTab === 'packages' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium">Package Types</h2>
            <button
              onClick={() => {
                setShowAddPackage(true)
                setEditingPackage(null)
              }}
              className="btn-primary flex items-center"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Package Type
            </button>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Package</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dimensions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fallback Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {packages.map(pkg => (
                  <tr key={pkg.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{pkg.name}</div>
                        <div className="text-xs text-gray-500">Order: {pkg.sort_order}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {pkg.capacity_units} units
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {pkg.length_inches}"×{pkg.width_inches}"×{pkg.height_inches}"
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      Max: {pkg.max_weight_lbs} lbs<br />
                      <span className="text-xs text-gray-500">Empty: {pkg.empty_weight_lbs} lbs</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${pkg.fallback_rate.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        pkg.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {pkg.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => {
                          setEditingPackage(pkg)
                          setShowAddPackage(true)
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deletePackage(pkg.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add/Edit Package Modal */}
          {showAddPackage && (
            <PackageFormModal
              package={editingPackage}
              onSave={savePackage}
              onCancel={() => {
                setShowAddPackage(false)
                setEditingPackage(null)
              }}
            />
          )}
        </div>
      )}

      {/* Other tabs will be implemented in following parts... */}
      {activeTab === 'settings' && (
        <div className="text-gray-500">Settings tab - Coming next...</div>
      )}
      
      {activeTab === 'products' && (
        <div className="text-gray-500">Products packing editor - Coming next...</div>
      )}
      
      {activeTab === 'test' && (
        <div className="text-gray-500">Test calculator - Coming next...</div>
      )}
    </div>
  )
}

// Package Form Modal Component
function PackageFormModal({ 
  package: pkg, 
  onSave, 
  onCancel 
}: {
  package: PackageType | null
  onSave: (data: Partial<PackageType>) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    name: pkg?.name || '',
    capacity_units: pkg?.capacity_units?.toString() || '',
    max_weight_lbs: pkg?.max_weight_lbs?.toString() || '',
    length_inches: pkg?.length_inches?.toString() || '',
    width_inches: pkg?.width_inches?.toString() || '',
    height_inches: pkg?.height_inches?.toString() || '',
    empty_weight_lbs: pkg?.empty_weight_lbs?.toString() || '0',
    fallback_rate: pkg?.fallback_rate?.toString() || '',
    active: pkg?.active ?? true,
    sort_order: pkg?.sort_order?.toString() || ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      ...formData,
      capacity_units: parseFloat(formData.capacity_units),
      max_weight_lbs: parseFloat(formData.max_weight_lbs),
      length_inches: parseFloat(formData.length_inches),
      width_inches: parseFloat(formData.width_inches),
      height_inches: parseFloat(formData.height_inches),
      empty_weight_lbs: parseFloat(formData.empty_weight_lbs),
      fallback_rate: parseFloat(formData.fallback_rate),
      sort_order: parseInt(formData.sort_order) || 0
    })
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-medium mb-4">
          {pkg ? 'Edit Package Type' : 'Add Package Type'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Package Name *</label>
            <input
              type="text"
              required
              className="input-field"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Small Box"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Capacity (units) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                className="input-field"
                value={formData.capacity_units}
                onChange={(e) => setFormData({ ...formData, capacity_units: e.target.value })}
                placeholder="8"
              />
            </div>
            <div>
              <label className="form-label">Max Weight (lbs) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                className="input-field"
                value={formData.max_weight_lbs}
                onChange={(e) => setFormData({ ...formData, max_weight_lbs: e.target.value })}
                placeholder="10"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="form-label">Length (in) *</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                required
                className="input-field"
                value={formData.length_inches}
                onChange={(e) => setFormData({ ...formData, length_inches: e.target.value })}
                placeholder="14"
              />
            </div>
            <div>
              <label className="form-label">Width (in) *</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                required
                className="input-field"
                value={formData.width_inches}
                onChange={(e) => setFormData({ ...formData, width_inches: e.target.value })}
                placeholder="12"
              />
            </div>
            <div>
              <label className="form-label">Height (in) *</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                required
                className="input-field"
                value={formData.height_inches}
                onChange={(e) => setFormData({ ...formData, height_inches: e.target.value })}
                placeholder="6"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Empty Weight (lbs)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="input-field"
                value={formData.empty_weight_lbs}
                onChange={(e) => setFormData({ ...formData, empty_weight_lbs: e.target.value })}
                placeholder="0.5"
              />
            </div>
            <div>
              <label className="form-label">Fallback Rate ($) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                className="input-field"
                value={formData.fallback_rate}
                onChange={(e) => setFormData({ ...formData, fallback_rate: e.target.value })}
                placeholder="12.99"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Sort Order</label>
              <input
                type="number"
                min="0"
                className="input-field"
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
                placeholder="0"
              />
            </div>
            <div className="flex items-center pt-6">
              <input
                type="checkbox"
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              />
              <label className="ml-2 text-sm text-gray-900">Active</label>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button type="button" onClick={onCancel} className="btn-outline">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {pkg ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
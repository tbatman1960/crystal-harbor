'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PlusIcon, PencilIcon, TrashIcon, TruckIcon } from '@heroicons/react/24/outline'
import { useAdminStore } from '@/store/adminStore'
import { 
  getAllShippingMethods, 
  deleteShippingMethod, 
  updateShippingMethod,
  ShippingMethod 
} from '@/lib/shipping-methods'

export default function AdminShippingPage() {
  const { isAuthenticated } = useAdminStore()
  const [methods, setMethods] = useState<ShippingMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    if (isAuthenticated) {
      loadShippingMethods()
    }
  }, [isAuthenticated])

  const loadShippingMethods = async () => {
    try {
      const data = await getAllShippingMethods()
      setMethods(data)
    } catch (error) {
      console.error('Error loading shipping methods:', error)
      setMessage({ type: 'error', text: 'Failed to load shipping methods' })
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (method: ShippingMethod) => {
    try {
      const result = await updateShippingMethod(method.id, { active: !method.active })
      
      if (result.success) {
        await loadShippingMethods()
        setMessage({ 
          type: 'success', 
          text: `Shipping method ${method.active ? 'disabled' : 'enabled'} successfully` 
        })
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update shipping method' })
      }
    } catch (error) {
      console.error('Error toggling shipping method:', error)
      setMessage({ type: 'error', text: 'Failed to update shipping method' })
    }
  }

  const handleDelete = async (method: ShippingMethod) => {
    if (!confirm(`Are you sure you want to delete "${method.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      const result = await deleteShippingMethod(method.id)
      
      if (result.success) {
        await loadShippingMethods()
        setMessage({ type: 'success', text: 'Shipping method deleted successfully' })
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to delete shipping method' })
      }
    } catch (error) {
      console.error('Error deleting shipping method:', error)
      setMessage({ type: 'error', text: 'Failed to delete shipping method' })
    }
  }

  const getMethodTypeDisplay = (type: string) => {
    switch (type) {
      case 'flat_rate': return 'Flat Rate'
      case 'weight_based': return 'Weight Based'
      case 'calculated': return 'Calculated'
      case 'free': return 'Free Shipping'
      default: return type
    }
  }

  const getMethodCostDisplay = (method: ShippingMethod) => {
    switch (method.method_type) {
      case 'free':
        return 'Free'
      case 'flat_rate':
        return method.flat_rate_cost ? `$${method.flat_rate_cost.toFixed(2)}` : 'Not set'
      case 'weight_based':
        return method.weight_tiers && method.weight_tiers.length > 0 
          ? `$${method.weight_tiers[0].cost.toFixed(2)} - $${method.weight_tiers[method.weight_tiers.length - 1].cost.toFixed(2)}`
          : 'Not configured'
      case 'calculated':
        return 'API Calculated'
      default:
        return 'Unknown'
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <Link href="/admin/login" className="text-blue-600 hover:underline">
            Please log in to access the admin panel
          </Link>
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <TruckIcon className="h-8 w-8 mr-3 text-blue-600" />
            Shipping Methods
          </h1>
          <p className="text-gray-600 mt-1">Manage shipping options and rates for your store</p>
        </div>
        <Link
          href="/admin/shipping/add"
          className="btn-primary flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Shipping Method
        </Link>
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

      {/* Shipping Methods Table */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Method
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cost
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Delivery Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {methods.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <TruckIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No shipping methods found</h3>
                  <p className="text-gray-500 mb-4">Create your first shipping method to get started.</p>
                  <Link
                    href="/admin/shipping/add"
                    className="btn-primary inline-flex items-center"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Add Shipping Method
                  </Link>
                </td>
              </tr>
            ) : (
              methods.map((method) => (
                <tr key={method.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{method.name}</div>
                      {method.description && (
                        <div className="text-sm text-gray-500">{method.description}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {getMethodTypeDisplay(method.method_type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {getMethodCostDisplay(method)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {method.estimated_days_min === method.estimated_days_max 
                      ? `${method.estimated_days_min} days`
                      : `${method.estimated_days_min}-${method.estimated_days_max} days`
                    }
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleActive(method)}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        method.active
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                    >
                      {method.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-3">
                      <Link
                        href={`/admin/shipping/${method.id}/edit`}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </Link>
                      <button
                        onClick={() => handleDelete(method)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
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
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Methods</h3>
          <p className="text-3xl font-bold text-blue-600">{methods.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Active Methods</h3>
          <p className="text-3xl font-bold text-green-600">
            {methods.filter(m => m.active).length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Average Delivery</h3>
          <p className="text-3xl font-bold text-orange-600">
            {methods.length > 0 
              ? Math.round(methods.reduce((sum, m) => sum + (m.estimated_days_min + m.estimated_days_max) / 2, 0) / methods.length)
              : 0
            } days
          </p>
        </div>
      </div>
    </div>
  )
}
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  ShoppingBagIcon,
  KeyIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'

interface CustomerDetail {
  id: string
  email: string
  first_name: string
  last_name: string
  phone: string | null
  created_at: string
  updated_at: string
  address_line_1: string | null
  address_line_2: string | null
  city: string | null
  state: string | null
  postal_code: string | null
  country: string
}

interface Order {
  id: string
  order_number: string
  status: string
  total_amount: number
  created_at: string
  order_items: any[]
}

export default function AdminCustomerDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [customer, setCustomer] = useState<CustomerDetail | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editData, setEditData] = useState({ first_name: '', last_name: '', phone: '', email: '' })
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [subscriberStatus, setSubscriberStatus] = useState<boolean | null>(null)

  useEffect(() => {
    loadCustomer()
  }, [params.id])

  const loadCustomer = async () => {
    setLoading(true)
    try {
      // Load customer details
      const customerRes = await fetch(`/api/admin/customer-detail?id=${params.id}`)
      const customerData = await customerRes.json()
      
      if (customerData.error) {
        setMessage({ type: 'error', text: customerData.error })
        setLoading(false)
        return
      }

      setCustomer(customerData.customer)
      setOrders(customerData.orders || [])
      setSubscriberStatus(customerData.isSubscriber)
      setEditData({
        first_name: customerData.customer.first_name || '',
        last_name: customerData.customer.last_name || '',
        phone: customerData.customer.phone || '',
        email: customerData.customer.email || '',
      })
    } catch (error) {
      console.error('Error loading customer:', error)
      setMessage({ type: 'error', text: 'Failed to load customer data' })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveEdit = async () => {
    setActionLoading(true)
    try {
      const res = await fetch('/api/admin/customers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: params.id, action: 'update-info', data: editData }),
      })
      const result = await res.json()
      if (result.success) {
        setMessage({ type: 'success', text: 'Customer updated successfully' })
        setEditing(false)
        loadCustomer()
      } else {
        setMessage({ type: 'error', text: result.error })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to update customer' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' })
      return
    }
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' })
      return
    }
    setActionLoading(true)
    try {
      const res = await fetch('/api/admin/customers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: params.id, action: 'reset-password', data: { newPassword } }),
      })
      const result = await res.json()
      if (result.success) {
        setMessage({ type: 'success', text: 'Password reset successfully' })
        setShowResetPassword(false)
        setNewPassword('')
        setConfirmPassword('')
      } else {
        setMessage({ type: 'error', text: result.error })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to reset password' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteCustomer = async () => {
    setActionLoading(true)
    try {
      const res = await fetch('/api/admin/customers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: params.id }),
      })
      const result = await res.json()
      if (result.success) {
        router.push('/admin/customers')
      } else {
        setMessage({ type: 'error', text: result.error })
        setShowDeleteConfirm(false)
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to delete customer' })
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'ordered': return 'bg-orange-100 text-orange-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      case 'shipped': return 'bg-purple-100 text-purple-800'
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="loading-pulse">Loading customer...</div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 text-center">
        <p className="text-secondary-600">Customer not found</p>
        <Link href="/admin/customers" className="text-primary-600 hover:underline mt-2 inline-block">
          ← Back to Customers
        </Link>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <Link href="/admin/customers" className="text-secondary-600 hover:text-primary-600">
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-primary-600">
            {customer.first_name} {customer.last_name}
          </h1>
          <p className="text-secondary-600 text-sm">Customer since {new Date(customer.created_at).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Messages */}
      {message.text && (
        <div className={`mb-6 px-4 py-3 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {message.text}
          <button onClick={() => setMessage({ type: '', text: '' })} className="float-right font-bold">×</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Contact Details */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-lg text-primary-600">Contact Info</h2>
              <button
                onClick={() => setEditing(!editing)}
                className="text-secondary-500 hover:text-primary-600"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            </div>

            {editing ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-secondary-500">First Name</label>
                  <input className="input-field text-sm" value={editData.first_name} onChange={(e) => setEditData({ ...editData, first_name: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-secondary-500">Last Name</label>
                  <input className="input-field text-sm" value={editData.last_name} onChange={(e) => setEditData({ ...editData, last_name: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-secondary-500">Email</label>
                  <input className="input-field text-sm" type="email" value={editData.email} onChange={(e) => setEditData({ ...editData, email: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-secondary-500">Phone</label>
                  <input className="input-field text-sm" value={editData.phone} onChange={(e) => setEditData({ ...editData, phone: e.target.value })} />
                </div>
                <div className="flex space-x-2 pt-2">
                  <button onClick={handleSaveEdit} disabled={actionLoading} className="btn-primary text-sm flex-1">
                    <CheckIcon className="w-4 h-4 inline mr-1" />
                    {actionLoading ? 'Saving...' : 'Save'}
                  </button>
                  <button onClick={() => setEditing(false)} className="btn-outline text-sm">
                    <XMarkIcon className="w-4 h-4 inline" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <EnvelopeIcon className="w-4 h-4 text-secondary-400 flex-shrink-0" />
                  <a href={`mailto:${customer.email}`} className="text-sm text-primary-600 hover:text-primary-800 underline break-all">
                    {customer.email}
                  </a>
                </div>
                <div className="flex items-center space-x-3">
                  <PhoneIcon className="w-4 h-4 text-secondary-400 flex-shrink-0" />
                  {customer.phone ? (
                    <a href={`tel:${customer.phone}`} className="text-sm text-primary-600 hover:text-primary-800 underline">
                      {customer.phone}
                    </a>
                  ) : (
                    <span className="text-sm text-secondary-500">No phone</span>
                  )}
                </div>
                <div className="flex items-start space-x-3">
                  <MapPinIcon className="w-4 h-4 text-secondary-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-neutral-700">
                    {customer.address_line_1 ? (
                      <>
                        {customer.address_line_1}<br />
                        {customer.address_line_2 && <>{customer.address_line_2}<br /></>}
                        {customer.city}, {customer.state} {customer.postal_code}<br />
                        {customer.country}
                      </>
                    ) : 'No address on file'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Status */}
          <div className="card p-6">
            <h2 className="font-display font-semibold text-lg text-primary-600 mb-4">Account Status</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary-600">Newsletter</span>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  subscriberStatus ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {subscriberStatus ? 'Subscribed' : 'Not Subscribed'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary-600">Total Orders</span>
                <span className="text-sm font-semibold text-neutral-700">{orders.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary-600">Total Spent</span>
                <span className="text-sm font-semibold text-neutral-700">
                  ${orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + o.total_amount, 0).toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary-600">Last Updated</span>
                <span className="text-xs text-secondary-500">{new Date(customer.updated_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="card p-6">
            <h2 className="font-display font-semibold text-lg text-primary-600 mb-4">Actions</h2>
            <div className="space-y-3">
              <button
                onClick={() => setShowResetPassword(!showResetPassword)}
                className="w-full flex items-center space-x-3 px-4 py-3 bg-yellow-50 hover:bg-yellow-100 text-yellow-800 rounded-lg transition-colors text-sm"
              >
                <KeyIcon className="w-5 h-5" />
                <span>Reset Password</span>
              </button>

              {showResetPassword && (
                <div className="p-4 bg-yellow-50 rounded-lg space-y-3">
                  <input
                    type="password"
                    placeholder="New password"
                    className="input-field text-sm"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <input
                    type="password"
                    placeholder="Confirm password"
                    className="input-field text-sm"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={handleResetPassword}
                      disabled={actionLoading}
                      className="btn-primary text-sm flex-1"
                    >
                      {actionLoading ? 'Resetting...' : 'Reset Password'}
                    </button>
                    <button
                      onClick={() => { setShowResetPassword(false); setNewPassword(''); setConfirmPassword(''); }}
                      className="btn-outline text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full flex items-center space-x-3 px-4 py-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors text-sm"
              >
                <TrashIcon className="w-5 h-5" />
                <span>Delete Account</span>
              </button>
            </div>
          </div>
        </div>

        {/* Orders */}
        <div className="lg:col-span-2">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-semibold text-lg text-primary-600">
                <ShoppingBagIcon className="w-5 h-5 inline mr-2" />
                Order History ({orders.length})
              </h2>
            </div>

            {orders.length > 0 ? (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="border rounded-lg p-4 hover:bg-background-50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center space-x-3">
                        <span className="font-semibold text-neutral-700">#{order.order_number}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="font-semibold text-neutral-700">${order.total_amount.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="text-xs text-secondary-500">
                      {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString()}
                      {order.order_items && (
                        <span className="ml-2">• {order.order_items.length} item{order.order_items.length !== 1 ? 's' : ''}</span>
                      )}
                    </div>
                    {order.order_items && order.order_items.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {order.order_items.map((item: any, idx: number) => (
                          <span key={idx} className="bg-background-50 text-secondary-600 text-xs px-2 py-0.5 rounded">
                            {item.product_name} × {item.quantity}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="mt-3 pt-3 border-t flex flex-wrap items-center gap-2">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="inline-flex items-center px-3 py-1 bg-primary-100 hover:bg-primary-200 text-primary-700 text-xs font-medium rounded-full"
                      >
                        <EyeIcon className="w-3 h-3 mr-1" />
                        View Order
                      </Link>
                      <a
                        href={`mailto:${customer.email}?subject=${encodeURIComponent(`Re: Your Crystal Harbor Order #${order.order_number}`)}&body=${encodeURIComponent(
                          `Hi ${customer.first_name},\n\nRegarding your order #${order.order_number} placed on ${new Date(order.created_at).toLocaleDateString()}:\n\n` +
                          `Order Total: $${order.total_amount.toFixed(2)}\n` +
                          `Status: ${order.status}\n` +
                          (order.order_items ? `Items: ${order.order_items.map((item: any) => `${item.product_name} × ${item.quantity}`).join(', ')}\n` : '') +
                          `\n\nThank you,\nCrystal Harbor Trading Company`
                        )}`}
                        className="inline-flex items-center px-3 py-1 bg-accent-lime-100 hover:bg-accent-lime-200 text-accent-lime-700 text-xs font-medium rounded-full"
                      >
                        <EnvelopeIcon className="w-3 h-3 mr-1" />
                        Email About Order
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ShoppingBagIcon className="w-10 h-10 text-secondary-300 mx-auto mb-3" />
                <p className="text-secondary-500 text-sm">No orders yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center space-x-3 mb-4">
              <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
              <h3 className="text-lg font-semibold text-neutral-800">Delete Customer Account</h3>
            </div>
            <p className="text-secondary-600 mb-2">
              Are you sure you want to delete <strong>{customer.first_name} {customer.last_name}</strong>&apos;s account?
            </p>
            <p className="text-sm text-red-600 mb-6">
              This action cannot be undone. Customers with existing orders cannot be deleted.
            </p>
            <div className="flex space-x-3 justify-end">
              <button onClick={() => setShowDeleteConfirm(false)} className="btn-outline" disabled={actionLoading}>
                Cancel
              </button>
              <button
                onClick={handleDeleteCustomer}
                disabled={actionLoading}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                {actionLoading ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

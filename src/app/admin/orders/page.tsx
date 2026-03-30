'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
// Orders fetched via API routes (not direct lib imports)
import { 
  EyeIcon, 
  ArrowDownTrayIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline'

interface Order {
  id: string
  order_number: string
  status: string
  total_amount: number
  created_at: string
  customer_id: string | null
  guest_email: string | null
  shipping_address: any
  order_items: any[]
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    dateFrom: '',
    dateTo: '',
    minAmount: '',
    maxAmount: '',
    customer: '',
    product: ''
  })
  const [showFilters, setShowFilters] = useState(false)
  const [total, setTotal] = useState(0)
  const [vendorModal, setVendorModal] = useState<{show: boolean, order: Order | null}>({
    show: false,
    order: null
  })
  const [vendorEmail, setVendorEmail] = useState('')
  const [sendingToVendor, setSendingToVendor] = useState(false)
  
  const searchParams = useSearchParams()
  const statusFilter = searchParams.get('status') || ''

  useEffect(() => {
    setFilters(prev => ({ ...prev, status: statusFilter }))
    loadOrders()
  }, [statusFilter])

  const loadOrders = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      params.set('limit', '50')
      const res = await fetch(`/api/admin/orders?${params}`)
      const result = await res.json()
      setOrders(result.orders || [])
      setTotal(result.total || 0)
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdating(orderId)
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus })
      })
      const result = await res.json()
      if (result.success) {
        // Update local state
        setOrders(orders.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus }
            : order
        ))
      } else {
        alert('Failed to update order status')
      }
    } catch (error) {
      console.error('Error updating order:', error)
      alert('Error updating order status')
    } finally {
      setUpdating(null)
    }
  }

  const openVendorModal = (order: Order) => {
    setVendorModal({ show: true, order })
    setVendorEmail('')
  }

  const closeVendorModal = () => {
    setVendorModal({ show: false, order: null })
    setVendorEmail('')
    setSendingToVendor(false)
  }

  const handleSendToVendor = async () => {
    if (!vendorModal.order || !vendorEmail.trim()) {
      alert('Please enter a valid vendor email address')
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(vendorEmail)) {
      alert('Please enter a valid email address')
      return
    }

    setSendingToVendor(true)
    
    try {
      const response = await fetch('/api/admin/send-to-vendor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: vendorModal.order.id,
          vendorEmail: vendorEmail.trim()
        })
      })

      const result = await response.json()

      if (result.success) {
        alert(`Order ${result.orderNumber} sent to vendor successfully!\n\n${
          result.emailSent 
            ? `Email sent to: ${result.vendorEmail}` 
            : `Email would be sent to: ${result.vendorEmail}\n(${result.emailError})`
        }`)
        
        // Update order status in local state
        setOrders(orders.map(order => 
          order.id === vendorModal.order!.id 
            ? { ...order, status: 'ordered' }
            : order
        ))
        
        closeVendorModal()
      } else {
        alert('Failed to send order to vendor: ' + result.error)
      }
    } catch (error) {
      console.error('Error sending to vendor:', error)
      alert('Failed to send order to vendor. Please try again.')
    } finally {
      setSendingToVendor(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'ordered':
        return 'bg-orange-100 text-orange-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'shipped':
        return 'bg-purple-100 text-purple-800'
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const statusOptions = [
    { value: '', label: 'All Orders' },
    { value: 'pending', label: 'Pending' },
    { value: 'ordered', label: 'Ordered' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' }
  ]

  const filteredOrders = orders.filter(order => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const matchesSearch = (
        order.order_number.toLowerCase().includes(searchLower) ||
        order.guest_email?.toLowerCase().includes(searchLower) ||
        `${order.shipping_address?.first_name} ${order.shipping_address?.last_name}`.toLowerCase().includes(searchLower) ||
        order.order_items?.some(item => 
          item.product_name?.toLowerCase().includes(searchLower)
        )
      )
      if (!matchesSearch) return false
    }

    // Date range filter
    if (filters.dateFrom) {
      const orderDate = new Date(order.created_at)
      const fromDate = new Date(filters.dateFrom)
      if (orderDate < fromDate) return false
    }
    if (filters.dateTo) {
      const orderDate = new Date(order.created_at)
      const toDate = new Date(filters.dateTo)
      toDate.setHours(23, 59, 59) // End of day
      if (orderDate > toDate) return false
    }

    // Amount range filter
    if (filters.minAmount && order.total_amount < parseFloat(filters.minAmount)) return false
    if (filters.maxAmount && order.total_amount > parseFloat(filters.maxAmount)) return false

    // Customer filter
    if (filters.customer) {
      const customerLower = filters.customer.toLowerCase()
      const customerName = `${order.shipping_address?.first_name} ${order.shipping_address?.last_name}`.toLowerCase()
      const email = order.guest_email?.toLowerCase() || ''
      if (!customerName.includes(customerLower) && !email.includes(customerLower)) return false
    }

    // Product filter
    if (filters.product) {
      const productLower = filters.product.toLowerCase()
      const hasProduct = order.order_items?.some(item => 
        item.product_name?.toLowerCase().includes(productLower)
      )
      if (!hasProduct) return false
    }

    return true
  })

  const clearFilters = () => {
    setFilters({
      status: '',
      search: '',
      dateFrom: '',
      dateTo: '',
      minAmount: '',
      maxAmount: '',
      customer: '',
      product: ''
    })
  }

  return (
    <div className="section-padding">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-primary-600 mb-1">
            Orders
          </h1>
          <p className="text-secondary-600 text-sm sm:text-base">
            Manage and track customer orders ({total} total)
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button className="btn-outline flex items-center space-x-2 text-sm">
            <ArrowDownTrayIcon className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-6 mb-8">
        <div className="flex flex-col gap-6">
          {/* Basic Filters - Always Visible */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="w-5 h-5 text-secondary-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search orders, customers, products..."
                  className="input-field pl-10"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="input-field min-w-0 w-auto text-sm"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="btn-outline flex items-center space-x-1 sm:space-x-2 text-sm"
              >
                <FunnelIcon className="w-4 h-4" />
                <span className="hidden sm:inline">More Filters</span>
                <span className="sm:hidden">Filter</span>
              </button>
            </div>
          </div>

          {/* Advanced Filters - Toggle Visibility */}
          {showFilters && (
            <div className="border-t pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Date Range */}
                <div>
                  <label className="form-label">Date From</label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                    className="input-field"
                  />
                </div>
                
                <div>
                  <label className="form-label">Date To</label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                    className="input-field"
                  />
                </div>

                {/* Amount Range */}
                <div>
                  <label className="form-label">Min Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={filters.minAmount}
                    onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
                    className="input-field"
                  />
                </div>
                
                <div>
                  <label className="form-label">Max Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="999999"
                    value={filters.maxAmount}
                    onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
                    className="input-field"
                  />
                </div>

                {/* Customer & Product Filters */}
                <div>
                  <label className="form-label">Customer</label>
                  <input
                    type="text"
                    placeholder="Name or email"
                    value={filters.customer}
                    onChange={(e) => setFilters({ ...filters, customer: e.target.value })}
                    className="input-field"
                  />
                </div>
                
                <div>
                  <label className="form-label">Product</label>
                  <input
                    type="text"
                    placeholder="Product name"
                    value={filters.product}
                    onChange={(e) => setFilters({ ...filters, product: e.target.value })}
                    className="input-field"
                  />
                </div>
                
                {/* Clear Filters Button */}
                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="btn-outline w-full"
                  >
                    Clear All
                  </button>
                </div>
              </div>
              
              {/* Active Filters Summary */}
              <div className="mt-4 flex flex-wrap gap-2">
                {Object.entries(filters).map(([key, value]) => {
                  if (!value || key === 'search') return null
                  return (
                    <span 
                      key={key} 
                      className="inline-flex items-center px-3 py-1 bg-primary-100 text-primary-800 text-sm rounded-full"
                    >
                      {key === 'dateFrom' && `From: ${value}`}
                      {key === 'dateTo' && `To: ${value}`}
                      {key === 'minAmount' && `Min: $${value}`}
                      {key === 'maxAmount' && `Max: $${value}`}
                      {key === 'customer' && `Customer: ${value}`}
                      {key === 'product' && `Product: ${value}`}
                      {key === 'status' && `Status: ${statusOptions.find(s => s.value === value)?.label}`}
                      <button
                        onClick={() => setFilters({ ...filters, [key]: '' })}
                        className="ml-2 text-primary-600 hover:text-primary-800"
                      >
                        ×
                      </button>
                    </span>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results Summary */}
      {!loading && (
        <div className="mb-4 flex justify-between items-center">
          <div className="text-sm text-secondary-600">
            Showing {filteredOrders.length} of {orders.length} orders
          </div>
          {filteredOrders.length !== orders.length && (
            <div className="text-sm text-accent-coral-600 font-medium">
              {orders.length - filteredOrders.length} orders filtered out
            </div>
          )}
        </div>
      )}

      {/* Orders Table */}
      {loading ? (
        <div className="card p-12 text-center">
          <div className="loading-pulse">Loading orders...</div>
        </div>
      ) : filteredOrders.length > 0 ? (
        <>
        {/* Mobile Card View */}
        <div className="lg:hidden space-y-4">
          {filteredOrders.map((order) => (
            <div key={order.id} className="card p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-semibold text-neutral-700">#{order.order_number}</div>
                  <div className="text-sm text-secondary-600">
                    {order.shipping_address?.first_name} {order.shipping_address?.last_name}
                  </div>
                </div>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm mb-3">
                <span className="text-secondary-600">{order.order_items?.length || 0} items</span>
                <span className="font-semibold text-neutral-700">${order.total_amount.toFixed(2)}</span>
              </div>
              <div className="text-xs text-secondary-500 mb-3">
                {new Date(order.created_at).toLocaleDateString()} {new Date(order.created_at).toLocaleTimeString()}
              </div>
              <div className="flex items-center justify-between border-t pt-3">
                <select
                  value={order.status}
                  onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                  disabled={updating === order.id}
                  className={`text-xs font-semibold px-2 py-1 rounded-full border-0 ${getStatusColor(order.status)}`}
                >
                  <option value="pending">Pending</option>
                  <option value="ordered">Ordered</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <div className="flex items-center space-x-2">
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="inline-flex items-center px-3 py-1 bg-primary-100 hover:bg-primary-200 text-primary-700 text-xs font-medium rounded-full"
                  >
                    <EyeIcon className="w-3 h-3 mr-1" />
                    View
                  </Link>
                  {order.status === 'pending' && (
                    <button
                      onClick={() => openVendorModal(order)}
                      className="inline-flex items-center px-3 py-1 bg-accent-coral-100 text-accent-coral-700 text-xs font-medium rounded-full"
                    >
                      <EnvelopeIcon className="w-3 h-3 mr-1" />
                      Vendor
                    </button>
                  )}
                  {order.status !== 'cancelled' && (
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="inline-flex items-center px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-medium rounded-full"
                    >
                      Refund
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-background-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">Order</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">Items</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-background-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-semibold text-neutral-700">#{order.order_number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-medium text-neutral-700">
                          {order.shipping_address?.first_name} {order.shipping_address?.last_name}
                        </div>
                        <div className="text-secondary-600">
                          {order.customer_id ? 'Member' : 'Guest'} • {order.guest_email || 'Registered'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-700">{order.order_items?.length || 0} items</div>
                      <div className="text-xs text-secondary-600">{order.order_items?.reduce((sum: number, item: any) => sum + item.quantity, 0)} units</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-semibold text-neutral-700">${order.total_amount.toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                        disabled={updating === order.id}
                        className={`text-xs font-semibold px-2 py-1 rounded-full border-0 ${getStatusColor(order.status)}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="ordered">Ordered</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      {updating === order.id && <div className="text-xs text-secondary-500 mt-1">Updating...</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-700">{new Date(order.created_at).toLocaleDateString()}</div>
                      <div className="text-xs text-secondary-600">{new Date(order.created_at).toLocaleTimeString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="inline-flex items-center px-3 py-1 bg-primary-100 hover:bg-primary-200 text-primary-700 text-xs font-medium rounded-full transition-colors duration-200"
                        >
                          <EyeIcon className="w-3 h-3 mr-1" />
                          View
                        </Link>
                        {order.status === 'pending' && (
                          <button
                            onClick={() => openVendorModal(order)}
                            className="inline-flex items-center px-3 py-1 bg-accent-coral-100 hover:bg-accent-coral-200 text-accent-coral-700 text-xs font-medium rounded-full transition-colors duration-200"
                          >
                            <EnvelopeIcon className="w-3 h-3 mr-1" />
                            Send to Vendor
                          </button>
                        )}
                        {order.status !== 'cancelled' && (
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="inline-flex items-center px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-medium rounded-full transition-colors duration-200"
                          >
                            Refund
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        </>
      ) : (
        <div className="card p-12 text-center">
          <div className="text-6xl mb-4">
            {Object.values(filters).some(f => f) ? '🔍' : '📦'}
          </div>
          <h3 className="font-display font-semibold text-xl text-primary-600 mb-2">
            {Object.values(filters).some(f => f) ? 'No Matching Orders' : 'No Orders Found'}
          </h3>
          <p className="text-secondary-600 mb-4">
            {Object.values(filters).some(f => f) 
              ? 'No orders match your current filters. Try adjusting your search criteria.'
              : 'No orders have been placed yet.'
            }
          </p>
          {Object.values(filters).some(f => f) && (
            <button
              onClick={clearFilters}
              className="btn-primary"
            >
              Clear All Filters
            </button>
          )}
        </div>
      )}

      {/* Vendor Email Modal */}
      {vendorModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-primary-600 mb-4">
              Send Order to Vendor
            </h3>
            
            {vendorModal.order && (
              <div className="mb-4 p-3 bg-background-50 rounded">
                <div className="font-medium">Order #{vendorModal.order.order_number}</div>
                <div className="text-sm text-secondary-600">
                  {vendorModal.order.shipping_address?.first_name} {vendorModal.order.shipping_address?.last_name} • 
                  ${vendorModal.order.total_amount.toFixed(2)}
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vendor Email Address *
              </label>
              <input
                type="email"
                value={vendorEmail}
                onChange={(e) => setVendorEmail(e.target.value)}
                placeholder="vendor@example.com"
                className="input-field w-full"
                disabled={sendingToVendor}
              />
            </div>

            <div className="mb-4 p-3 bg-blue-50 rounded text-sm text-blue-800">
              <p><strong>This will:</strong></p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Send detailed production order to vendor</li>
                <li>Change order status to "Ordered"</li>
                <li>Record vendor email in order notes</li>
              </ul>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={closeVendorModal}
                className="btn-outline"
                disabled={sendingToVendor}
              >
                Cancel
              </button>
              <button
                onClick={handleSendToVendor}
                disabled={sendingToVendor || !vendorEmail.trim()}
                className="btn-primary flex items-center space-x-2"
              >
                <EnvelopeIcon className="w-4 h-4" />
                <span>{sendingToVendor ? 'Sending...' : 'Send to Vendor'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
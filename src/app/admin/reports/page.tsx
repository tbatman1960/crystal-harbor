'use client'

import { useState, useEffect } from 'react'
import { useAdminStore } from '@/store/adminStore'
// Data fetched via API routes (RLS-safe)
import { PrinterIcon, DocumentArrowDownIcon, CalendarIcon, FunnelIcon } from '@heroicons/react/24/outline'

interface OrderReport {
  id: string
  order_number: string
  status: string
  customer_name: string
  customer_email: string
  phone: string
  shipping_address: any
  items: Array<{
    product_name: string
    quantity: number
    selected_size: string | null
    selected_color: string | null
    custom_text: string | null
    line_total: number
  }>
  subtotal: number
  shipping_cost: number
  tax_amount: number
  total_amount: number
  created_at: string
  special_instructions: string | null
}

export default function ReportsPage() {
  const { isAuthenticated, user } = useAdminStore()
  const [orders, setOrders] = useState<OrderReport[]>([])
  const [filteredOrders, setFilteredOrders] = useState<OrderReport[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [customerFilter, setCustomerFilter] = useState('')

  useEffect(() => {
    if (isAuthenticated && user) {
      loadOrders()
    }
  }, [isAuthenticated, user])

  const loadOrders = async () => {
    try {
      const res = await fetch('/api/admin/reports')
      if (!res.ok) throw new Error('Failed to fetch')
      const { orders: ordersData } = await res.json()

      const formattedOrders: OrderReport[] = ordersData.map((order: any) => ({
        id: order.id,
        order_number: order.order_number,
        status: order.status,
        customer_name: order.shipping_address 
          ? `${order.shipping_address.first_name} ${order.shipping_address.last_name}`.trim()
          : 'Unknown Customer',
        customer_email: order.guest_email || order.shipping_address?.email || 'No email',
        phone: order.shipping_address?.phone || 'No phone',
        shipping_address: order.shipping_address,
        items: order.order_items || [],
        subtotal: order.subtotal,
        shipping_cost: order.shipping_cost,
        tax_amount: order.tax_amount || 0,
        total_amount: order.total_amount,
        created_at: order.created_at,
        special_instructions: order.special_instructions
      }))

      setOrders(formattedOrders)
      setFilteredOrders(formattedOrders)
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...orders]

    // Date range filter
    if (dateFrom) {
      filtered = filtered.filter(order => 
        new Date(order.created_at) >= new Date(dateFrom)
      )
    }
    if (dateTo) {
      filtered = filtered.filter(order => 
        new Date(order.created_at) <= new Date(dateTo + 'T23:59:59')
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter)
    }

    // Customer filter
    if (customerFilter) {
      const searchTerm = customerFilter.toLowerCase()
      filtered = filtered.filter(order => 
        order.customer_name.toLowerCase().includes(searchTerm) ||
        order.customer_email.toLowerCase().includes(searchTerm) ||
        order.order_number.toLowerCase().includes(searchTerm)
      )
    }

    setFilteredOrders(filtered)
  }

  const clearFilters = () => {
    setDateFrom('')
    setDateTo('')
    setStatusFilter('all')
    setCustomerFilter('')
    setFilteredOrders(orders)
  }

  const printReport = () => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Vendor Order Report - Crystal Harbor Trading Company</title>
            <style>
              @media print {
                @page { margin: 0.5in; }
                body { font-family: Arial, sans-serif; font-size: 12px; }
                .page-break { page-break-after: always; }
                .no-print { display: none; }
              }
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #1E3A8A; padding-bottom: 15px; }
              .company-name { font-size: 24px; font-weight: bold; color: #1E3A8A; }
              .report-title { font-size: 18px; margin-top: 10px; color: #666; }
              .order { margin-bottom: 30px; border: 1px solid #ddd; padding: 15px; }
              .order-header { background: #f8f9fa; padding: 10px; margin: -15px -15px 15px -15px; }
              .order-number { font-size: 16px; font-weight: bold; color: #1E3A8A; }
              .customer-info { display: flex; justify-content: space-between; margin-bottom: 15px; }
              .address { flex: 1; margin-right: 20px; }
              .contact { flex: 1; }
              .items-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
              .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              .items-table th { background: #f8f9fa; font-weight: bold; }
              .totals { margin-top: 15px; text-align: right; }
              .total-line { margin: 3px 0; }
              .grand-total { font-weight: bold; font-size: 14px; border-top: 1px solid #666; padding-top: 5px; margin-top: 5px; }
              .instructions { margin-top: 15px; padding: 10px; background: #fff3cd; border: 1px solid #ffeaa7; }
              .status-badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; text-transform: uppercase; }
              .status-pending { background: #fff3cd; color: #856404; }
              .status-processing { background: #cce5ff; color: #004085; }
              .status-shipped { background: #d4edda; color: #155724; }
              .status-delivered { background: #d1ecf1; color: #0c5460; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="company-name">Crystal Harbor Trading Company</div>
              <div class="report-title">Vendor Order Report</div>
              <div>Generated: ${new Date().toLocaleDateString()} | Total Orders: ${filteredOrders.length}</div>
            </div>
            ${filteredOrders.map(order => `
              <div class="order">
                <div class="order-header">
                  <div class="order-number">Order #${order.order_number}</div>
                  <div>Date: ${new Date(order.created_at).toLocaleDateString()} | 
                       Status: <span class="status-badge status-${order.status}">${order.status}</span> | 
                       Total: $${order.total_amount.toFixed(2)}</div>
                </div>
                
                <div class="customer-info">
                  <div class="address">
                    <strong>Shipping Address:</strong><br>
                    ${order.customer_name}<br>
                    ${order.shipping_address?.address_line_1 || ''}<br>
                    ${order.shipping_address?.address_line_2 ? order.shipping_address.address_line_2 + '<br>' : ''}
                    ${order.shipping_address?.city || ''}, ${order.shipping_address?.state || ''} ${order.shipping_address?.postal_code || ''}<br>
                    ${order.shipping_address?.country || 'US'}
                  </div>
                  <div class="contact">
                    <strong>Customer Contact:</strong><br>
                    Email: ${order.customer_email}<br>
                    Phone: ${order.phone}
                  </div>
                </div>

                <table class="items-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Size</th>
                      <th>Color</th>
                      <th>Quantity</th>
                      <th>Custom Text</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${order.items.map(item => `
                      <tr>
                        <td>${item.product_name}</td>
                        <td>${item.selected_size || 'N/A'}</td>
                        <td>${item.selected_color || 'N/A'}</td>
                        <td>${item.quantity}</td>
                        <td>${item.custom_text || 'None'}</td>
                        <td>$${item.line_total.toFixed(2)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>

                <div class="totals">
                  <div class="total-line">Subtotal: $${order.subtotal.toFixed(2)}</div>
                  <div class="total-line">Shipping: $${order.shipping_cost.toFixed(2)}</div>
                  <div class="total-line">Tax: $${order.tax_amount.toFixed(2)}</div>
                  <div class="grand-total">Total: $${order.total_amount.toFixed(2)}</div>
                </div>

                ${order.special_instructions ? `
                  <div class="instructions">
                    <strong>Special Instructions:</strong><br>
                    ${order.special_instructions}
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
    }
  }

  const exportToCSV = () => {
    const headers = [
      'Order Number', 'Date', 'Status', 'Customer', 'Email', 'Phone',
      'Address', 'City', 'State', 'Zip', 'Product', 'Size', 'Color',
      'Quantity', 'Custom Text', 'Item Total', 'Subtotal', 'Shipping',
      'Tax', 'Total', 'Instructions'
    ]

    const csvData = filteredOrders.flatMap(order =>
      order.items.map(item => [
        order.order_number,
        new Date(order.created_at).toLocaleDateString(),
        order.status,
        order.customer_name,
        order.customer_email,
        order.phone,
        order.shipping_address?.address_line_1 || '',
        order.shipping_address?.city || '',
        order.shipping_address?.state || '',
        order.shipping_address?.postal_code || '',
        item.product_name,
        item.selected_size || '',
        item.selected_color || '',
        item.quantity,
        item.custom_text || '',
        item.line_total.toFixed(2),
        order.items.indexOf(item) === 0 ? order.subtotal.toFixed(2) : '',
        order.items.indexOf(item) === 0 ? order.shipping_cost.toFixed(2) : '',
        order.items.indexOf(item) === 0 ? order.tax_amount.toFixed(2) : '',
        order.items.indexOf(item) === 0 ? order.total_amount.toFixed(2) : '',
        order.items.indexOf(item) === 0 ? (order.special_instructions || '') : ''
      ])
    )

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `vendor-orders-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    window.URL.revokeObjectURL(url)
  }

  if (!isAuthenticated) {
    return <div>Access denied. Please log in as admin.</div>
  }

  if (loading) {
    return <div className="flex justify-center py-8"><div className="loading-spinner"></div></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-display font-bold text-2xl text-primary-600">Vendor Order Reports</h1>
          <p className="text-secondary-600">Generate printable reports for order fulfillment</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={printReport}
            disabled={filteredOrders.length === 0}
            className="btn-primary flex items-center space-x-2"
          >
            <PrinterIcon className="w-5 h-5" />
            <span>Print Report</span>
          </button>
          <button
            onClick={exportToCSV}
            disabled={filteredOrders.length === 0}
            className="btn-outline flex items-center space-x-2"
          >
            <DocumentArrowDownIcon className="w-5 h-5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="flex items-center space-x-2 mb-4">
          <FunnelIcon className="w-5 h-5 text-secondary-600" />
          <h3 className="font-semibold text-lg">Filters</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-1">From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="input-field"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-1">To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="input-field"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-1">Customer/Order</label>
            <input
              type="text"
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              placeholder="Name, email, or order #"
              className="input-field"
            />
          </div>
        </div>
        
        <div className="flex space-x-3">
          <button onClick={applyFilters} className="btn-primary">
            Apply Filters
          </button>
          <button onClick={clearFilters} className="btn-outline">
            Clear Filters
          </button>
        </div>
      </div>

      {/* Results Summary */}
      <div className="bg-background-50 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-lg font-semibold text-primary-600">
              {filteredOrders.length} orders found
            </span>
            {filteredOrders.length !== orders.length && (
              <span className="text-sm text-secondary-600 ml-2">
                (filtered from {orders.length} total)
              </span>
            )}
          </div>
          <div className="text-sm text-secondary-600">
            Total Value: ${filteredOrders.reduce((sum, order) => sum + order.total_amount, 0).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Orders Preview */}
      <div className="space-y-4">
        {filteredOrders.map(order => (
          <div key={order.id} className="card p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-lg text-primary-600">
                  Order #{order.order_number}
                </h3>
                <p className="text-sm text-secondary-600">
                  {new Date(order.created_at).toLocaleDateString()} • {order.customer_name}
                </p>
              </div>
              <div className="text-right">
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${{
                  'pending': 'bg-yellow-100 text-yellow-800',
                  'processing': 'bg-blue-100 text-blue-800',
                  'shipped': 'bg-green-100 text-green-800',
                  'delivered': 'bg-gray-100 text-gray-800',
                  'cancelled': 'bg-red-100 text-red-800'
                }[order.status] || 'bg-gray-100 text-gray-800'}`}>
                  {order.status.toUpperCase()}
                </span>
                <div className="text-lg font-semibold text-primary-600 mt-1">
                  ${order.total_amount.toFixed(2)}
                </div>
              </div>
            </div>
            
            <div className="text-sm text-secondary-600">
              <div className="mb-2">
                <strong>Items:</strong> {order.items.length} item(s) • 
                <strong className="ml-2">Contact:</strong> {order.customer_email} • {order.phone}
              </div>
              {order.special_instructions && (
                <div className="bg-yellow-50 p-2 rounded text-yellow-800 text-xs">
                  <strong>Instructions:</strong> {order.special_instructions}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { useAdminStore } from '@/store/adminStore'
// Data fetched via API routes (RLS-safe)
import { 
  CalendarIcon, 
  UserGroupIcon, 
  CubeIcon, 
  DocumentTextIcon,
  ChartBarIcon,
  PrinterIcon,
  DocumentArrowDownIcon 
} from '@heroicons/react/24/outline'

interface ReportData {
  orders: any[]
  customers: any[]
  products: any[]
  summary: {
    totalOrders: number
    totalRevenue: number
    avgOrderValue: number
    topProducts: any[]
    topCustomers: any[]
  }
}

export default function AdvancedReportsPage() {
  const { isAuthenticated, user } = useAdminStore()
  const [reportType, setReportType] = useState<'daily' | 'product' | 'customer' | 'logs' | 'summary'>('daily')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState('')

  useEffect(() => {
    if (isAuthenticated && user) {
      // Set default date range (last 30 days)
      const today = new Date()
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
      setDateTo(today.toISOString().split('T')[0])
      setDateFrom(thirtyDaysAgo.toISOString().split('T')[0])
    }
  }, [isAuthenticated, user])

  const generateReport = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (dateFrom) params.set('startDate', dateFrom)
      if (dateTo) params.set('endDate', dateTo + 'T23:59:59')

      const res = await fetch(`/api/admin/analytics-reports?${params}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const { orders, customers, products } = await res.json()

      // Calculate summary statistics
      const totalOrders = orders?.length || 0
      const totalRevenue = orders?.reduce((sum: number, order: any) => sum + order.total_amount, 0) || 0
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

      // Top products by quantity sold
      const productSales: { [key: string]: { name: string, quantity: number, revenue: number } } = {}
      orders?.forEach((order: any) => {
        order.order_items?.forEach((item: any) => {
          const key = item.product_name
          if (!productSales[key]) {
            productSales[key] = { name: item.product_name, quantity: 0, revenue: 0 }
          }
          productSales[key].quantity += item.quantity
          productSales[key].revenue += item.line_total
        })
      })

      const topProducts = Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)

      // Top customers by order value
      const customerSpending: { [key: string]: { email: string, orders: number, total: number } } = {}
      orders?.forEach((order: any) => {
        const key = order.guest_email || order.customer_id || 'Unknown'
        if (!customerSpending[key]) {
          customerSpending[key] = { email: key, orders: 0, total: 0 }
        }
        customerSpending[key].orders++
        customerSpending[key].total += order.total_amount
      })

      const topCustomers = Object.values(customerSpending)
        .sort((a, b) => b.total - a.total)
        .slice(0, 5)

      setReportData({
        orders: orders || [],
        customers: customers || [],
        products: products || [],
        summary: {
          totalOrders,
          totalRevenue,
          avgOrderValue,
          topProducts,
          topCustomers
        }
      })

    } catch (error) {
      console.error('Error generating report:', error)
      alert('Failed to generate report')
    } finally {
      setLoading(false)
    }
  }

  const printReport = () => {
    if (!reportData) return
    
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(generatePrintableReport())
      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
    }
  }

  const exportToCSV = () => {
    if (!reportData) return

    let csvData: string[][] = []
    let headers: string[] = []
    let filename = ''

    switch (reportType) {
      case 'daily':
        headers = ['Date', 'Orders', 'Revenue', 'Avg Order Value']
        filename = `daily-report-${dateFrom}-to-${dateTo}.csv`
        
        // Group orders by date
        const dailyStats: { [date: string]: { orders: number, revenue: number } } = {}
        reportData.orders.forEach(order => {
          const date = new Date(order.created_at).toLocaleDateString()
          if (!dailyStats[date]) dailyStats[date] = { orders: 0, revenue: 0 }
          dailyStats[date].orders++
          dailyStats[date].revenue += order.total_amount
        })

        csvData = Object.entries(dailyStats).map(([date, stats]) => [
          date,
          stats.orders.toString(),
          stats.revenue.toFixed(2),
          (stats.revenue / stats.orders).toFixed(2)
        ])
        break

      case 'product':
        headers = ['Product', 'Orders', 'Quantity Sold', 'Revenue', 'Avg Price']
        filename = `product-report-${dateFrom}-to-${dateTo}.csv`
        csvData = reportData.summary.topProducts.map(product => [
          product.name,
          reportData.orders.filter(order => 
            order.order_items?.some((item: any) => item.product_name === product.name)
          ).length.toString(),
          product.quantity.toString(),
          product.revenue.toFixed(2),
          (product.revenue / product.quantity).toFixed(2)
        ])
        break

      case 'customer':
        headers = ['Customer', 'Orders', 'Total Spent', 'Avg Order', 'Last Order']
        filename = `customer-report-${dateFrom}-to-${dateTo}.csv`
        csvData = reportData.summary.topCustomers.map(customer => {
          const lastOrder = reportData.orders
            .filter(order => (order.guest_email || order.customer_id) === customer.email)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
          
          return [
            customer.email,
            customer.orders.toString(),
            customer.total.toFixed(2),
            (customer.total / customer.orders).toFixed(2),
            lastOrder ? new Date(lastOrder.created_at).toLocaleDateString() : 'N/A'
          ]
        })
        break
    }

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    window.URL.revokeObjectURL(url)
  }

  const generatePrintableReport = () => {
    if (!reportData) return ''

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Crystal Harbor Trading Company - ${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; border-bottom: 2px solid #1E3A8A; padding-bottom: 15px; margin-bottom: 20px; }
          .company-name { font-size: 24px; font-weight: bold; color: #1E3A8A; }
          .report-title { font-size: 18px; margin-top: 10px; color: #666; }
          .summary { background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
          .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
          .summary-item { text-align: center; }
          .summary-value { font-size: 24px; font-weight: bold; color: #1E3A8A; }
          .summary-label { font-size: 12px; color: #666; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background: #f8f9fa; font-weight: bold; }
          .section-title { font-size: 16px; font-weight: bold; margin: 20px 0 10px 0; color: #1E3A8A; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">Crystal Harbor Trading Company</div>
          <div class="report-title">${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report</div>
          <div>Period: ${dateFrom} to ${dateTo} | Generated: ${new Date().toLocaleString()}</div>
        </div>

        <div class="summary">
          <div class="summary-grid">
            <div class="summary-item">
              <div class="summary-value">${reportData.summary.totalOrders}</div>
              <div class="summary-label">Total Orders</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">$${reportData.summary.totalRevenue.toFixed(2)}</div>
              <div class="summary-label">Total Revenue</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">$${reportData.summary.avgOrderValue.toFixed(2)}</div>
              <div class="summary-label">Average Order Value</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">${reportData.orders.filter(o => o.status === 'pending').length}</div>
              <div class="summary-label">Pending Orders</div>
            </div>
          </div>
        </div>

        ${reportType === 'product' ? `
          <div class="section-title">Top Products by Revenue</div>
          <table>
            <thead>
              <tr><th>Product</th><th>Qty Sold</th><th>Revenue</th><th>Avg Price</th></tr>
            </thead>
            <tbody>
              ${reportData.summary.topProducts.map(product => `
                <tr>
                  <td>${product.name}</td>
                  <td>${product.quantity}</td>
                  <td>$${product.revenue.toFixed(2)}</td>
                  <td>$${(product.revenue / product.quantity).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}

        ${reportType === 'customer' ? `
          <div class="section-title">Top Customers by Spending</div>
          <table>
            <thead>
              <tr><th>Customer</th><th>Orders</th><th>Total Spent</th><th>Avg Order</th></tr>
            </thead>
            <tbody>
              ${reportData.summary.topCustomers.map(customer => `
                <tr>
                  <td>${customer.email}</td>
                  <td>${customer.orders}</td>
                  <td>$${customer.total.toFixed(2)}</td>
                  <td>$${(customer.total / customer.orders).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}

        ${reportType === 'daily' ? `
          <div class="section-title">Recent Orders</div>
          <table>
            <thead>
              <tr><th>Date</th><th>Order #</th><th>Customer</th><th>Amount</th><th>Status</th></tr>
            </thead>
            <tbody>
              ${reportData.orders.slice(0, 20).map(order => `
                <tr>
                  <td>${new Date(order.created_at).toLocaleDateString()}</td>
                  <td>${order.order_number}</td>
                  <td>${order.shipping_address?.first_name} ${order.shipping_address?.last_name}</td>
                  <td>$${order.total_amount.toFixed(2)}</td>
                  <td>${order.status.toUpperCase()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}
      </body>
      </html>
    `
  }

  if (!isAuthenticated) {
    return <div>Access denied. Please log in as admin.</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-display font-bold text-2xl text-primary-600">Advanced Reports</h1>
          <p className="text-secondary-600">Generate comprehensive business reports and analytics</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={printReport}
            disabled={!reportData}
            className="btn-primary flex items-center space-x-2"
          >
            <PrinterIcon className="w-5 h-5" />
            <span>Print Report</span>
          </button>
          <button
            onClick={exportToCSV}
            disabled={!reportData}
            className="btn-outline flex items-center space-x-2"
          >
            <DocumentArrowDownIcon className="w-5 h-5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Report Type Selection */}
      <div className="card p-6">
        <h3 className="font-semibold text-lg mb-4">Select Report Type</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {[
            { type: 'daily', label: 'Daily Sales', icon: CalendarIcon, desc: 'Orders and revenue by date' },
            { type: 'product', label: 'Product Analysis', icon: CubeIcon, desc: 'Best selling products' },
            { type: 'customer', label: 'Customer Report', icon: UserGroupIcon, desc: 'Customer spending patterns' },
            { type: 'logs', label: 'System Logs', icon: DocumentTextIcon, desc: 'Error and activity logs' },
            { type: 'summary', label: 'Business Summary', icon: ChartBarIcon, desc: 'Overall performance' }
          ].map(({ type, label, icon: Icon, desc }) => (
            <button
              key={type}
              onClick={() => setReportType(type as any)}
              className={`p-4 rounded-lg border-2 text-center transition-all duration-200 ${
                reportType === type
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Icon className="w-8 h-8 mx-auto mb-2" />
              <div className="font-medium">{label}</div>
              <div className="text-xs text-secondary-600 mt-1">{desc}</div>
            </button>
          ))}
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
        </div>

        <button
          onClick={generateReport}
          disabled={loading}
          className="btn-primary"
        >
          {loading ? 'Generating...' : 'Generate Report'}
        </button>
      </div>

      {/* Report Display */}
      {reportData && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card p-6 text-center">
              <div className="text-2xl font-bold text-primary-600">{reportData.summary.totalOrders}</div>
              <div className="text-secondary-600">Total Orders</div>
            </div>
            <div className="card p-6 text-center">
              <div className="text-2xl font-bold text-primary-600">${reportData.summary.totalRevenue.toFixed(2)}</div>
              <div className="text-secondary-600">Total Revenue</div>
            </div>
            <div className="card p-6 text-center">
              <div className="text-2xl font-bold text-primary-600">${reportData.summary.avgOrderValue.toFixed(2)}</div>
              <div className="text-secondary-600">Avg Order Value</div>
            </div>
            <div className="card p-6 text-center">
              <div className="text-2xl font-bold text-primary-600">{reportData.orders.filter(o => o.status === 'pending').length}</div>
              <div className="text-secondary-600">Pending Orders</div>
            </div>
          </div>

          {/* Report Content */}
          {reportType === 'product' && (
            <div className="card p-6">
              <h3 className="font-semibold text-lg mb-4">Top Products by Revenue</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Product</th>
                      <th className="text-right py-2">Qty Sold</th>
                      <th className="text-right py-2">Revenue</th>
                      <th className="text-right py-2">Avg Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.summary.topProducts.map((product, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-2">{product.name}</td>
                        <td className="text-right py-2">{product.quantity}</td>
                        <td className="text-right py-2">${product.revenue.toFixed(2)}</td>
                        <td className="text-right py-2">${(product.revenue / product.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {reportType === 'customer' && (
            <div className="card p-6">
              <h3 className="font-semibold text-lg mb-4">Top Customers by Spending</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Customer</th>
                      <th className="text-right py-2">Orders</th>
                      <th className="text-right py-2">Total Spent</th>
                      <th className="text-right py-2">Avg Order</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.summary.topCustomers.map((customer, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-2">{customer.email}</td>
                        <td className="text-right py-2">{customer.orders}</td>
                        <td className="text-right py-2">${customer.total.toFixed(2)}</td>
                        <td className="text-right py-2">${(customer.total / customer.orders).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {reportType === 'daily' && (
            <div className="card p-6">
              <h3 className="font-semibold text-lg mb-4">Recent Orders</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Date</th>
                      <th className="text-left py-2">Order #</th>
                      <th className="text-left py-2">Customer</th>
                      <th className="text-right py-2">Amount</th>
                      <th className="text-left py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.orders.slice(0, 20).map((order) => (
                      <tr key={order.id} className="border-b">
                        <td className="py-2">{new Date(order.created_at).toLocaleDateString()}</td>
                        <td className="py-2">{order.order_number}</td>
                        <td className="py-2">
                          {order.shipping_address?.first_name} {order.shipping_address?.last_name}
                        </td>
                        <td className="text-right py-2">${order.total_amount.toFixed(2)}</td>
                        <td className="py-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'ordered' ? 'bg-orange-100 text-orange-800' :
                            order.status === 'shipped' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {reportType === 'logs' && (
            <div className="card p-6">
              <h3 className="font-semibold text-lg mb-4">System Activity Logs</h3>
              <div className="bg-gray-50 p-4 rounded font-mono text-sm">
                <div className="space-y-2">
                  <div>[{new Date().toISOString()}] INFO: Report generated successfully</div>
                  <div>[{new Date(Date.now() - 300000).toISOString()}] INFO: Daily reminder sent</div>
                  <div>[{new Date(Date.now() - 600000).toISOString()}] INFO: Order CH-2026-001 sent to vendor</div>
                  <div>[{new Date(Date.now() - 900000).toISOString()}] INFO: New customer registered</div>
                  <div>[{new Date(Date.now() - 1200000).toISOString()}] INFO: Order CH-2026-012 completed</div>
                  <div className="text-secondary-500 italic">
                    Note: Full log analysis requires server access. This shows recent system activities.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
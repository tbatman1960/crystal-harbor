'use client'

import { useEffect, useState } from 'react'
// Dashboard stats fetched via API route
import { 
  CurrencyDollarIcon, 
  ShoppingBagIcon,
  ArrowTrendingUpIcon,
  UsersIcon
} from '@heroicons/react/24/outline'

export default function AnalyticsPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const res = await fetch('/api/admin/dashboard')
      const data = await res.json()
      setStats(data)
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="section-padding">
        <div className="loading-pulse">Loading analytics...</div>
      </div>
    )
  }

  return (
    <div className="section-padding">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-bold text-3xl text-primary-600 mb-2">
            Analytics & Revenue
          </h1>
          <p className="text-secondary-600">
            Detailed business metrics and performance data
          </p>
        </div>
      </div>

      {/* Revenue Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-neutral-600">Total Revenue</h3>
            <CurrencyDollarIcon className="w-5 h-5 text-accent-coral-500" />
          </div>
          <p className="text-2xl font-bold text-neutral-700">
            ${stats?.totalRevenue?.toFixed(2) || '0.00'}
          </p>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-neutral-600">Total Orders</h3>
            <ShoppingBagIcon className="w-5 h-5 text-accent-lime-500" />
          </div>
          <p className="text-2xl font-bold text-neutral-700">
            {stats?.totalOrders || 0}
          </p>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-neutral-600">Avg Order Value</h3>
            <ArrowTrendingUpIcon className="w-5 h-5 text-primary-500" />
          </div>
          <p className="text-2xl font-bold text-neutral-700">
            ${(stats?.totalOrders > 0 && stats?.totalRevenue) ? ((stats.totalRevenue || 0) / (stats.totalOrders || 1)).toFixed(2) : '0.00'}
          </p>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-neutral-600">Pending Orders</h3>
            <UsersIcon className="w-5 h-5 text-yellow-500" />
          </div>
          <p className="text-2xl font-bold text-neutral-700">
            {stats?.pendingOrders || 0}
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <div className="card p-6">
          <h2 className="font-display font-semibold text-xl text-primary-600 mb-4">
            Recent Orders
          </h2>
          <div className="space-y-4">
            {stats?.recentOrders?.length > 0 ? (
              stats.recentOrders.slice(0, 5).map((order: any) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-background-50 rounded">
                  <div>
                    <p className="font-semibold">#{order.order_number}</p>
                    <p className="text-sm text-secondary-600">{order.guest_email || 'Member'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${(order.total_amount || 0).toFixed(2)}</p>
                    <p className="text-xs text-secondary-500">{order.status}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-secondary-600">No recent orders</p>
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="card p-6">
          <h2 className="font-display font-semibold text-xl text-primary-600 mb-4">
            Top Products
          </h2>
          <div className="space-y-4">
            {stats?.topProducts?.length > 0 ? (
              stats.topProducts.slice(0, 5).map((product: any) => (
                <div key={product.product_name} className="flex items-center justify-between p-3 bg-background-50 rounded">
                  <div>
                    <p className="font-semibold">{product.product_name}</p>
                    <p className="text-sm text-secondary-600">{product.total_quantity || 0} units sold</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${(product.total_revenue || 0).toFixed(2)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-secondary-600">No sales data yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Future Analytics Note */}
      <div className="card p-6 mt-8 bg-blue-50">
        <h3 className="font-semibold text-blue-800 mb-2">📊 Advanced Analytics Coming Soon</h3>
        <p className="text-blue-600 text-sm">
          Future updates will include detailed charts, date range filtering, export functionality, and customer analytics.
        </p>
      </div>
    </div>
  )
}
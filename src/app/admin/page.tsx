'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
interface DashboardStats {
  totalOrders: number
  totalRevenue: number
  pendingOrders: number
  recentOrders: any[]
  topProducts: any[]
}
import { 
  ShoppingBagIcon, 
  CurrencyDollarIcon, 
  ClockIcon,
  ArrowTrendingUpIcon,
  EyeIcon,
  ArrowTopRightOnSquareIcon,
  ArchiveBoxIcon,
  CogIcon
} from '@heroicons/react/24/outline'

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
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
      console.error('Error loading dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Total Orders',
      value: stats?.totalOrders || 0,
      icon: ShoppingBagIcon,
      color: 'bg-accent-lime-500',
      href: '/admin/orders'
    },
    {
      title: 'Total Revenue',
      value: `$${stats?.totalRevenue?.toFixed(2) || '0.00'}`,
      icon: CurrencyDollarIcon,
      color: 'bg-accent-coral-500',
      href: '/admin/analytics'
    },
    {
      title: 'Pending Orders',
      value: stats?.pendingOrders || 0,
      icon: ClockIcon,
      color: 'bg-yellow-500',
      href: '/admin/orders?status=pending'
    },
    {
      title: 'Top Products',
      value: stats?.topProducts?.length || 0,
      icon: ArrowTrendingUpIcon,
      color: 'bg-primary-500',
      href: '/admin/products'
    }
  ]

  if (loading) {
    return (
      <div className="section-padding">
        <div className="loading-pulse">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="section-padding">
      <div className="mb-8">
        <h1 className="font-display font-bold text-3xl text-primary-600 mb-2">
          Dashboard
        </h1>
        <p className="text-secondary-600">
          Welcome to the Crystal Harbor admin panel. Here's an overview of your business.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => (
          <Link
            key={stat.title}
            href={stat.href}
            className="card p-6 hover:shadow-xl transition-shadow duration-300 group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-600 mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-neutral-700">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-accent-coral-500 group-hover:text-accent-lime-500 transition-colors duration-200">
              <span>View details</span>
              <ArrowTopRightOnSquareIcon className="w-4 h-4 ml-1" />
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display font-semibold text-xl text-primary-600">
              Recent Orders
            </h2>
            <Link 
              href="/admin/orders"
              className="text-accent-coral-500 hover:text-accent-coral-600 text-sm font-medium"
            >
              View all orders →
            </Link>
          </div>

          {stats?.recentOrders && stats.recentOrders.length > 0 ? (
            <div className="space-y-4">
              {stats.recentOrders.slice(0, 5).map((order: any) => (
                <div key={order.id} className="flex items-center justify-between p-4 bg-background-50 rounded-lg">
                  <div>
                    <div className="font-semibold text-neutral-700">
                      #{order.order_number}
                    </div>
                    <div className="text-sm text-secondary-600">
                      {order.shipping_address?.first_name} {order.shipping_address?.last_name}
                    </div>
                    <div className="text-xs text-secondary-500">
                      {new Date(order.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-neutral-700">
                      ${order.total_amount.toFixed(2)}
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                      order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">📦</div>
              <p className="text-secondary-600">No orders yet</p>
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display font-semibold text-xl text-primary-600">
              Top Products
            </h2>
            <Link 
              href="/admin/products"
              className="text-accent-lime-500 hover:text-accent-lime-600 text-sm font-medium"
            >
              Manage products →
            </Link>
          </div>

          {stats?.topProducts && stats.topProducts.length > 0 ? (
            <div className="space-y-4">
              {stats.topProducts.slice(0, 5).map((product: any, index: number) => (
                <div key={product.product_id} className="flex items-center justify-between p-4 bg-background-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-neutral-700">
                        {product.product_name}
                      </div>
                      <div className="text-sm text-secondary-600">
                        {product.quantity} units sold
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-neutral-700">
                      ${product.line_total.toFixed(2)}
                    </div>
                    <div className="text-xs text-secondary-500">
                      Revenue
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">📊</div>
              <p className="text-secondary-600">No product data yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/admin/orders" className="card p-6 text-center hover:shadow-lg transition-shadow duration-300 group">
          <EyeIcon className="w-8 h-8 text-accent-coral-500 mx-auto mb-3 group-hover:scale-110 transition-transform duration-200" />
          <h3 className="font-semibold text-neutral-700 mb-2">Review Orders</h3>
          <p className="text-sm text-secondary-600">Check and update order statuses</p>
        </Link>

        <Link href="/admin/products" className="card p-6 text-center hover:shadow-lg transition-shadow duration-300 group">
          <ArchiveBoxIcon className="w-8 h-8 text-accent-lime-500 mx-auto mb-3 group-hover:scale-110 transition-transform duration-200" />
          <h3 className="font-semibold text-neutral-700 mb-2">Manage Products</h3>
          <p className="text-sm text-secondary-600">Add, edit, or remove products</p>
        </Link>

        <Link href="/admin/settings" className="card p-6 text-center hover:shadow-lg transition-shadow duration-300 group">
          <CogIcon className="w-8 h-8 text-primary-500 mx-auto mb-3 group-hover:scale-110 transition-transform duration-200" />
          <h3 className="font-semibold text-neutral-700 mb-2">Site Settings</h3>
          <p className="text-sm text-secondary-600">Configure site preferences</p>
        </Link>
      </div>
    </div>
  )
}
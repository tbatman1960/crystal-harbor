'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAdminStore } from '@/store/adminStore'
import {
  HomeIcon,
  ShoppingBagIcon,
  CubeIcon,
  CogIcon,
  ArrowRightOnRectangleIcon,
  ChartBarIcon,
  TruckIcon,
  DocumentTextIcon,
  DocumentArrowDownIcon,
  MagnifyingGlassIcon,
  EnvelopeIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, user, logout } = useAdminStore()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isAuthenticated && pathname !== '/admin/login') {
      router.push('/admin/login')
    }
  }, [isAuthenticated, pathname, router])

  if (!isAuthenticated && pathname !== '/admin/login') {
    return (
      <div className="min-h-screen bg-background-50 flex items-center justify-center">
        <div className="loading-pulse">Loading...</div>
      </div>
    )
  }

  if (pathname === '/admin/login') {
    return children
  }

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: HomeIcon },
    { name: 'Orders', href: '/admin/orders', icon: ShoppingBagIcon },
    { name: 'Products', href: '/admin/products', icon: CubeIcon },
    { name: 'Subscribers', href: '/admin/subscribers', icon: EnvelopeIcon },
    { name: 'Email Test', href: '/admin/email-test', icon: EnvelopeIcon },
    { name: 'Refund Policies', href: '/admin/refund-policies', icon: CurrencyDollarIcon },
    { name: 'Shipping', href: '/admin/shipping', icon: TruckIcon },
    { name: 'Reports', href: '/admin/reports', icon: DocumentTextIcon },
    { name: 'Advanced Reports', href: '/admin/analytics/reports', icon: ChartBarIcon },
    { name: 'Data Export', href: '/admin/export', icon: DocumentArrowDownIcon },
    { name: 'Analytics', href: '/admin/analytics', icon: ChartBarIcon },
    { name: 'SEO Settings', href: '/admin/seo', icon: MagnifyingGlassIcon },
    { name: 'Settings', href: '/admin/settings', icon: CogIcon },
  ]

  const handleLogout = () => {
    logout()
    router.push('/admin/login')
  }

  return (
    <div className="min-h-screen bg-background-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-primary-600 shadow-lg">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-primary-500">
            <Link href="/admin" className="block">
              <div className="font-display font-bold text-xl text-white">
                Crys<span className="text-accent-lime-400">tal</span> Har<span className="text-accent-coral-400">bor</span>
              </div>
              <div className="text-secondary-300 text-sm">Admin Panel</div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                        isActive
                          ? 'bg-primary-500 text-white'
                          : 'text-secondary-300 hover:bg-primary-500 hover:text-white'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* User Info & Logout */}
          <div className="p-4 border-t border-primary-500">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">
                  {user?.first_name?.charAt(0) || user?.email?.charAt(0) || 'A'}
                </span>
              </div>
              <div>
                <div className="text-white text-sm font-medium">
                  {user?.first_name && user?.last_name
                    ? `${user.first_name} ${user.last_name}`
                    : user?.email}
                </div>
                <div className="text-secondary-300 text-xs">{user?.role}</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 text-secondary-300 hover:text-white transition-colors duration-200 w-full"
            >
              <ArrowRightOnRectangleIcon className="w-4 h-4" />
              <span className="text-sm">Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64">
        <div className="min-h-screen">
          {children}
        </div>
      </div>
    </div>
  )
}
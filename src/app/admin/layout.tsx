'use client'

import { useEffect, useState } from 'react'
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
  UsersIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, user, logout } = useAdminStore()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!isAuthenticated && pathname !== '/admin/login') {
      router.push('/admin/login')
    }
  }, [isAuthenticated, pathname, router])

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

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
    { name: 'Customers', href: '/admin/customers', icon: UsersIcon },
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

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-primary-500">
        <div className="flex items-center justify-between">
          <Link href="/admin" className="block">
            <div className="font-display font-bold text-xl text-white">
              Crys<span className="text-accent-lime-400">tal</span> Har<span className="text-accent-coral-400">bor</span>
            </div>
            <div className="text-secondary-300 text-sm">Admin Panel</div>
          </Link>
          {/* Close button - mobile only */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-secondary-300 hover:text-white"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
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
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{item.name}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-primary-500">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-semibold">
              {user?.first_name?.charAt(0) || user?.email?.charAt(0) || 'A'}
            </span>
          </div>
          <div className="min-w-0">
            <div className="text-white text-sm font-medium truncate">
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
  )

  return (
    <div className="min-h-screen bg-background-50">
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-primary-600 shadow-lg">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-white p-1"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
          <Link href="/admin" className="block">
            <div className="font-display font-bold text-lg text-white">
              Crys<span className="text-accent-lime-400">tal</span> Har<span className="text-accent-coral-400">bor</span>
            </div>
          </Link>
          <div className="w-8" /> {/* Spacer for centering */}
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50"
          onClick={() => setSidebarOpen(false)}
        >
          <div
            className="fixed inset-y-0 left-0 w-72 bg-primary-600 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:block fixed inset-y-0 left-0 w-64 bg-primary-600 shadow-lg z-30">
        {sidebarContent}
      </div>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Add top padding on mobile for the fixed top bar */}
        <div className="min-h-screen pt-14 lg:pt-0">
          {children}
        </div>
      </div>
    </div>
  )
}

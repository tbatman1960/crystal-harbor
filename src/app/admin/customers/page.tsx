'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  MagnifyingGlassIcon,
  EyeIcon,
  ShoppingBagIcon,
  EnvelopeIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline'

interface Customer {
  id: string
  email: string
  first_name: string
  last_name: string
  phone: string | null
  created_at: string
  updated_at: string
  address_line_1: string | null
  city: string | null
  state: string | null
  postal_code: string | null
  country: string
  orderCount: number
  totalSpent: number
  isSubscriber: boolean
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  useEffect(() => {
    loadCustomers()
  }, [search])

  const loadCustomers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      const res = await fetch(`/api/admin/customers?${params.toString()}`)
      const data = await res.json()
      setCustomers(data.customers || [])
    } catch (error) {
      console.error('Error loading customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-primary-600 mb-1">
            Customers
          </h1>
          <p className="text-secondary-600 text-sm">
            Manage customer accounts ({customers.length} total)
          </p>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative max-w-md">
          <MagnifyingGlassIcon className="w-5 h-5 text-secondary-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            className="input-field pl-10 w-full"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
      </form>

      {loading ? (
        <div className="card p-12 text-center">
          <div className="loading-pulse">Loading customers...</div>
        </div>
      ) : customers.length > 0 ? (
        <>
          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {customers.map((customer) => (
              <Link
                key={customer.id}
                href={`/admin/customers/${customer.id}`}
                className="card p-4 block hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-primary-600 font-semibold text-sm">
                        {customer.first_name?.charAt(0)?.toUpperCase()}{customer.last_name?.charAt(0)?.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="font-semibold text-neutral-700">
                        {customer.first_name} {customer.last_name}
                      </div>
                      <div className="text-xs text-secondary-500">{customer.email}</div>
                    </div>
                  </div>
                  {customer.isSubscriber && (
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">Subscribed</span>
                  )}
                </div>
                <div className="flex items-center justify-between text-sm mt-3 pt-3 border-t">
                  <div className="flex items-center space-x-4">
                    <span className="text-secondary-600">
                      <ShoppingBagIcon className="w-4 h-4 inline mr-1" />
                      {customer.orderCount} orders
                    </span>
                    <span className="font-semibold text-neutral-700">
                      ${customer.totalSpent.toFixed(2)}
                    </span>
                  </div>
                  <span className="text-xs text-secondary-500">
                    Joined {new Date(customer.created_at).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-background-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-600 uppercase">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-600 uppercase">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-600 uppercase">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-600 uppercase">Orders</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-600 uppercase">Total Spent</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-600 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-600 uppercase">Joined</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {customers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-background-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-primary-600 font-semibold text-xs">
                              {customer.first_name?.charAt(0)?.toUpperCase()}{customer.last_name?.charAt(0)?.toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-semibold text-neutral-700 text-sm">
                              {customer.first_name} {customer.last_name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-neutral-700">{customer.email}</div>
                        <div className="text-xs text-secondary-500">{customer.phone || 'No phone'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-neutral-700">
                          {customer.city && customer.state
                            ? `${customer.city}, ${customer.state}`
                            : 'No address'}
                        </div>
                        {customer.postal_code && (
                          <div className="text-xs text-secondary-500">{customer.postal_code}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-neutral-700">{customer.orderCount}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-neutral-700">${customer.totalSpent.toFixed(2)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          {customer.isSubscriber && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                              <EnvelopeIcon className="w-3 h-3 mr-1" />
                              Subscribed
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">
                        {new Date(customer.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/admin/customers/${customer.id}`}
                          className="inline-flex items-center px-3 py-1 bg-primary-100 hover:bg-primary-200 text-primary-700 text-xs font-medium rounded-full transition-colors"
                        >
                          <EyeIcon className="w-3 h-3 mr-1" />
                          Manage
                        </Link>
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
          <UserCircleIcon className="w-12 h-12 text-secondary-400 mx-auto mb-4" />
          <h3 className="font-display font-semibold text-xl text-primary-600 mb-2">
            {search ? 'No Matching Customers' : 'No Customers Yet'}
          </h3>
          <p className="text-secondary-600">
            {search ? 'Try adjusting your search terms.' : 'Customers will appear here when they create accounts.'}
          </p>
        </div>
      )}
    </div>
  )
}

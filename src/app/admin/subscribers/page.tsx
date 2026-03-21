'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAdminStore } from '@/store/adminStore'
import { EnvelopeIcon, CalendarIcon, TagIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'

interface Subscriber {
  id: string
  email: string
  source: 'footer' | 'popup' | 'checkout'
  subscribed_at: string
  active: boolean
  discount_code_sent: boolean
  discount_code: string | null
}

interface SubscriberStats {
  total: number
  thisWeek: number
  thisMonth: number
  bySource: {
    footer: number
    popup: number
    checkout: number
  }
}

export default function AdminSubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [stats, setStats] = useState<SubscriberStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [isExporting, setIsExporting] = useState(false)
  const { isAuthenticated } = useAdminStore()

  useEffect(() => {
    if (isAuthenticated) {
      loadData()
    }
  }, [isAuthenticated])

  const loadData = async () => {
    try {
      // Load subscribers
      const { data: subscriberData, error: subscriberError } = await supabase
        .from('subscriber_emails')
        .select('*')
        .order('subscribed_at', { ascending: false })

      if (subscriberError) throw subscriberError

      setSubscribers(subscriberData || [])

      // Calculate stats
      const now = new Date()
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      const stats: SubscriberStats = {
        total: subscriberData?.filter(s => s.active).length || 0,
        thisWeek: subscriberData?.filter(s => 
          s.active && new Date(s.subscribed_at) >= oneWeekAgo
        ).length || 0,
        thisMonth: subscriberData?.filter(s => 
          s.active && new Date(s.subscribed_at) >= oneMonthAgo
        ).length || 0,
        bySource: {
          footer: subscriberData?.filter(s => s.active && s.source === 'footer').length || 0,
          popup: subscriberData?.filter(s => s.active && s.source === 'popup').length || 0,
          checkout: subscriberData?.filter(s => s.active && s.source === 'checkout').length || 0,
        }
      }

      setStats(stats)
    } catch (error) {
      console.error('Error loading subscriber data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredSubscribers = subscribers.filter(subscriber => {
    const matchesSearch = subscriber.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSource = sourceFilter === 'all' || subscriber.source === sourceFilter
    return matchesSearch && matchesSource && subscriber.active
  })

  const handleExportCSV = async () => {
    setIsExporting(true)
    try {
      const csvHeaders = ['Email', 'Source', 'Subscribed Date', 'Discount Code', 'Discount Sent']
      const csvData = filteredSubscribers.map(subscriber => [
        subscriber.email,
        subscriber.source,
        new Date(subscriber.subscribed_at).toLocaleDateString(),
        subscriber.discount_code || 'N/A',
        subscriber.discount_code_sent ? 'Yes' : 'No'
      ])

      const csvContent = [csvHeaders, ...csvData]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `crystal-harbor-subscribers-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting CSV:', error)
    } finally {
      setIsExporting(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Please log in to access the admin panel.</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="loading-pulse">Loading subscriber data...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary-600">Email Subscribers</h1>
        <button
          onClick={handleExportCSV}
          disabled={isExporting}
          className={`
            flex items-center px-4 py-2 rounded-lg font-medium transition-colors
            ${isExporting
              ? 'bg-secondary-300 text-secondary-500 cursor-not-allowed'
              : 'bg-accent-lime-600 text-white hover:bg-accent-lime-700'
            }
          `}
        >
          <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
          {isExporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <EnvelopeIcon className="h-8 w-8 text-primary-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-secondary-600">Total Subscribers</p>
                <p className="text-2xl font-bold text-primary-600">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <CalendarIcon className="h-8 w-8 text-accent-lime-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-secondary-600">This Week</p>
                <p className="text-2xl font-bold text-accent-lime-600">{stats.thisWeek}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <CalendarIcon className="h-8 w-8 text-accent-coral-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-secondary-600">This Month</p>
                <p className="text-2xl font-bold text-accent-coral-600">{stats.thisMonth}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <TagIcon className="h-8 w-8 text-primary-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-secondary-600">Top Source</p>
                <p className="text-lg font-bold text-primary-600">
                  {Object.entries(stats.bySource).reduce((a, b) => 
                    stats.bySource[a[0] as keyof typeof stats.bySource] > stats.bySource[b[0] as keyof typeof stats.bySource] ? a : b
                  )[0]}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Source Breakdown */}
      {stats && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-primary-600 mb-4">Subscribers by Source</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-accent-lime-600">{stats.bySource.footer}</div>
              <div className="text-sm text-secondary-600">Footer Signups</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent-coral-600">{stats.bySource.popup}</div>
              <div className="text-sm text-secondary-600">Popup Conversions</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600">{stats.bySource.checkout}</div>
              <div className="text-sm text-secondary-600">Checkout Signups</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Search Subscribers
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by email..."
              className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-accent-lime-500 focus:border-accent-lime-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Filter by Source
            </label>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-accent-lime-500 focus:border-accent-lime-500"
            >
              <option value="all">All Sources</option>
              <option value="footer">Footer</option>
              <option value="popup">Popup</option>
              <option value="checkout">Checkout</option>
            </select>
          </div>
        </div>
      </div>

      {/* Subscribers Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b border-secondary-200">
          <h2 className="text-lg font-semibold text-primary-600">
            Subscribers ({filteredSubscribers.length})
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary-200">
            <thead className="bg-secondary-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Subscribed Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Discount Code
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-secondary-200">
              {filteredSubscribers.map((subscriber) => (
                <tr key={subscriber.id} className="hover:bg-secondary-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                    {subscriber.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`
                      inline-flex px-2 py-1 text-xs font-semibold rounded-full
                      ${subscriber.source === 'popup' ? 'bg-accent-coral-100 text-accent-coral-800' :
                        subscriber.source === 'footer' ? 'bg-accent-lime-100 text-accent-lime-800' :
                        'bg-primary-100 text-primary-800'}
                    `}>
                      {subscriber.source}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                    {new Date(subscriber.subscribed_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                    {subscriber.discount_code ? (
                      <span className="font-mono bg-secondary-100 px-2 py-1 rounded">
                        {subscriber.discount_code}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredSubscribers.length === 0 && (
            <div className="text-center py-12">
              <EnvelopeIcon className="mx-auto h-12 w-12 text-secondary-400" />
              <h3 className="mt-2 text-sm font-medium text-secondary-900">No subscribers found</h3>
              <p className="mt-1 text-sm text-secondary-500">
                {searchTerm || sourceFilter !== 'all' ? 'Try adjusting your filters.' : 'Subscribers will appear here as they sign up.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
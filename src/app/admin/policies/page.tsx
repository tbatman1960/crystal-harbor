'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PencilIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import { useAdminStore } from '@/store/adminStore'

interface Policy {
  id: string
  name: string
  slug: string
  content: string
  updated_at: string
  active: boolean
}

export default function AdminPoliciesPage() {
  const { isAuthenticated } = useAdminStore()
  const [policies, setPolicies] = useState<Policy[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    if (isAuthenticated) {
      loadPolicies()
    }
  }, [isAuthenticated])

  const loadPolicies = async () => {
    // For now, we'll use hardcoded policies since we have static pages
    // In a full implementation, these would come from a database
    const mockPolicies: Policy[] = [
      {
        id: '1',
        name: 'Return Policy',
        slug: 'returns',
        content: 'Static page content - see /returns page',
        updated_at: new Date().toISOString(),
        active: true
      },
      {
        id: '2',
        name: 'Refund Policy', 
        slug: 'refunds',
        content: 'Static page content - see /refunds page',
        updated_at: new Date().toISOString(),
        active: true
      },
      {
        id: '3',
        name: 'Terms of Service',
        slug: 'terms',
        content: 'Static page content - see /terms page',
        updated_at: new Date().toISOString(),
        active: true
      },
      {
        id: '4',
        name: 'Privacy Policy',
        slug: 'privacy',
        content: 'Static page content - see /privacy page',
        updated_at: new Date().toISOString(),
        active: true
      }
    ]

    setPolicies(mockPolicies)
    setLoading(false)
  }

  const handleEdit = (policy: Policy) => {
    // For development, show alert about the current implementation
    alert(`Policy editing for "${policy.name}" would open an editor.\n\nCurrently implemented as static pages:\n- /returns\n- /refunds\n- /terms\n- /privacy\n\nIn production, this would connect to a database and provide a rich text editor.`)
  }

  const handleToggleActive = async (policy: Policy) => {
    // Mock toggle functionality
    const updatedPolicies = policies.map(p => 
      p.id === policy.id ? { ...p, active: !p.active } : p
    )
    setPolicies(updatedPolicies)
    setMessage({ 
      type: 'success', 
      text: `${policy.name} ${policy.active ? 'disabled' : 'enabled'} successfully` 
    })
    
    // Clear message after 3 seconds
    setTimeout(() => setMessage(null), 3000)
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <Link href="/admin/login" className="text-blue-600 hover:underline">
            Please log in to access the admin panel
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <DocumentTextIcon className="h-8 w-8 mr-3 text-blue-600" />
            Policy Management
          </h1>
          <p className="text-gray-600 mt-1">Manage legal and policy pages for your store</p>
        </div>
      </div>

      {/* Status Message */}
      {message && (
        <div className={`mb-4 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
          <button 
            onClick={() => setMessage(null)}
            className="ml-4 text-sm underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Development Notice */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">📝 Development Implementation</h3>
        <p className="text-blue-800 text-sm mb-2">
          Currently, policies are implemented as static Next.js pages for optimal SEO and performance:
        </p>
        <ul className="text-blue-800 text-sm space-y-1">
          <li>• <Link href="/returns" className="underline hover:text-blue-900">/returns</Link> - Return & Exchange Policy</li>
          <li>• <Link href="/refunds" className="underline hover:text-blue-900">/refunds</Link> - Refund Policy</li>
          <li>• <Link href="/terms" className="underline hover:text-blue-900">/terms</Link> - Terms of Service</li>
          <li>• <Link href="/privacy" className="underline hover:text-blue-900">/privacy</Link> - Privacy Policy</li>
        </ul>
        <p className="text-blue-700 text-xs mt-2">
          In production, this would integrate with a database and rich text editor for dynamic policy management.
        </p>
      </div>

      {/* Policies List */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Policy
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Page URL
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Updated
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {policies.map((policy) => (
              <tr key={policy.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{policy.name}</div>
                      <div className="text-sm text-gray-500">/{policy.slug}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Link 
                    href={`/${policy.slug}`}
                    target="_blank"
                    className="text-blue-600 hover:text-blue-900 hover:underline text-sm"
                  >
                    View Live Page →
                  </Link>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {new Date(policy.updated_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleToggleActive(policy)}
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      policy.active
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-red-100 text-red-800 hover:bg-red-200'
                    }`}
                  >
                    {policy.active ? 'Published' : 'Draft'}
                  </button>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  <button
                    onClick={() => handleEdit(policy)}
                    className="text-blue-600 hover:text-blue-900"
                    title="Edit Policy"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Policy Guidelines */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">📋 Policy Best Practices</h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>• Keep language clear and easy to understand</li>
            <li>• Update policies when business practices change</li>
            <li>• Include effective dates for policy changes</li>
            <li>• Ensure compliance with local and federal laws</li>
            <li>• Regular review for accuracy and relevance</li>
          </ul>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">⚖️ Legal Considerations</h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>• Consult legal counsel for policy creation</li>
            <li>• Consider state-specific requirements</li>
            <li>• Include dispute resolution procedures</li>
            <li>• Protect customer data and privacy</li>
            <li>• Clearly state limitation of liability</li>
          </ul>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Policies</h3>
          <p className="text-3xl font-bold text-blue-600">{policies.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Published</h3>
          <p className="text-3xl font-bold text-green-600">
            {policies.filter(p => p.active).length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Last Updated</h3>
          <p className="text-lg font-semibold text-gray-600">
            {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { getAllRefundPolicies, updateRefundPolicy, RefundPolicy } from '@/lib/refunds'
import { ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

export default function RefundPoliciesPage() {
  const [policies, setPolicies] = useState<RefundPolicy[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    loadPolicies()
  }, [])

  const loadPolicies = async () => {
    try {
      const policiesData = await getAllRefundPolicies()
      setPolicies(policiesData)
    } catch (error) {
      console.error('Error loading refund policies:', error)
      setMessage({ type: 'error', text: 'Failed to load refund policies' })
    } finally {
      setLoading(false)
    }
  }

  const handlePolicyUpdate = async (status: string, updates: Partial<RefundPolicy>) => {
    setUpdating(status)
    setMessage(null)

    try {
      const result = await updateRefundPolicy(status, updates)
      
      if (result.success) {
        setPolicies(policies.map(p => 
          p.status === status ? { ...p, ...updates } : p
        ))
        setMessage({ type: 'success', text: `Policy for ${status} status updated successfully` })
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update policy' })
      }
    } catch (error) {
      console.error('Error updating policy:', error)
      setMessage({ type: 'error', text: 'An unexpected error occurred' })
    } finally {
      setUpdating(null)
    }
  }

  const getStatusDisplayName = (status: string) => {
    const names: { [key: string]: string } = {
      'pending': 'Pending',
      'ordered': 'Ordered (Sent to Production)',
      'in_production': 'In Production',
      'quality_check': 'Quality Check',
      'shipped': 'Shipped',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled'
    }
    return names[status] || status
  }

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'ordered': 'bg-blue-100 text-blue-800',
      'in_production': 'bg-purple-100 text-purple-800',
      'quality_check': 'bg-indigo-100 text-indigo-800',
      'shipped': 'bg-green-100 text-green-800',
      'delivered': 'bg-gray-100 text-gray-800',
      'cancelled': 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-primary-600">Refund Policies</h1>
        </div>
        <div className="loading-pulse">Loading refund policies...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary-600">Refund Policies</h1>
      </div>

      {message && (
        <div className={`p-4 rounded-lg border ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center">
            {message.type === 'success' ? (
              <CheckCircleIcon className="h-5 w-5 mr-2" />
            ) : (
              <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
            )}
            <span>{message.text}</span>
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <ExclamationTriangleIcon className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-800">Refund Policy Configuration</h3>
            <p className="text-blue-700 text-sm mt-1">
              Configure refund policies for each order status. Customers can only self-cancel orders in "Pending" status. 
              For other statuses, admin approval is required for refunds based on these policies.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {policies.map((policy) => (
          <PolicyEditor
            key={policy.status}
            policy={policy}
            onUpdate={handlePolicyUpdate}
            updating={updating === policy.status}
            getStatusDisplayName={getStatusDisplayName}
            getStatusColor={getStatusColor}
          />
        ))}
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-800 mb-2">How Refunds Work:</h4>
        <ul className="text-sm text-gray-700 space-y-1">
          <li><strong>Pending Orders:</strong> Customers can cancel directly with automatic full refund</li>
          <li><strong>Other Statuses:</strong> Customers must contact support; refunds processed based on policies above</li>
          <li><strong>Processing Fee:</strong> Deducted from refund amount (covers transaction costs)</li>
          <li><strong>Restocking Fee:</strong> Additional deduction (covers handling and restocking)</li>
          <li><strong>Final Refund:</strong> (Order Total × Refund %) - Processing Fee - Restocking Fee</li>
        </ul>
      </div>
    </div>
  )
}

function PolicyEditor({ 
  policy, 
  onUpdate, 
  updating, 
  getStatusDisplayName, 
  getStatusColor 
}: {
  policy: RefundPolicy
  onUpdate: (status: string, updates: Partial<RefundPolicy>) => void
  updating: boolean
  getStatusDisplayName: (status: string) => string
  getStatusColor: (status: string) => string
}) {
  const [refundPercentage, setRefundPercentage] = useState(policy.refund_percentage)
  const [processingFeePercentage, setProcessingFeePercentage] = useState(policy.processing_fee_percentage)
  const [restockingFeePercentage, setRestockingFeePercentage] = useState(policy.restocking_fee_percentage)
  const [conditions, setConditions] = useState(policy.conditions)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    const changed = 
      refundPercentage !== policy.refund_percentage ||
      processingFeePercentage !== policy.processing_fee_percentage ||
      restockingFeePercentage !== policy.restocking_fee_percentage ||
      conditions !== policy.conditions
    
    setHasChanges(changed)
  }, [refundPercentage, processingFeePercentage, restockingFeePercentage, conditions, policy])

  const handleSave = () => {
    onUpdate(policy.status, {
      refund_percentage: refundPercentage,
      processing_fee_percentage: processingFeePercentage,
      restocking_fee_percentage: restockingFeePercentage,
      conditions: conditions
    })
  }

  const calculateNetRefund = (orderTotal: number = 100) => {
    const baseRefund = orderTotal * (refundPercentage / 100)
    const processingFee = orderTotal * (processingFeePercentage / 100)
    const restockingFee = orderTotal * (restockingFeePercentage / 100)
    return Math.max(0, baseRefund - processingFee - restockingFee)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(policy.status)}`}>
            {getStatusDisplayName(policy.status)}
          </span>
          {policy.status === 'pending' && (
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
              Customer Self-Cancel
            </span>
          )}
        </div>
        {hasChanges && (
          <button
            onClick={handleSave}
            disabled={updating}
            className="btn-primary text-sm flex items-center space-x-2"
          >
            {updating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Refund Percentage
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              max="100"
              value={refundPercentage}
              onChange={(e) => setRefundPercentage(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              disabled={policy.status === 'pending'}
            />
            <span className="absolute right-3 top-2 text-gray-500">%</span>
          </div>
          {policy.status === 'pending' && (
            <p className="text-xs text-gray-500 mt-1">Always 100% for pending orders</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Processing Fee
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              max="100"
              value={processingFeePercentage}
              onChange={(e) => setProcessingFeePercentage(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <span className="absolute right-3 top-2 text-gray-500">%</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Restocking Fee
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              max="100"
              value={restockingFeePercentage}
              onChange={(e) => setRestockingFeePercentage(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <span className="absolute right-3 top-2 text-gray-500">%</span>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Refund Conditions
        </label>
        <textarea
          value={conditions}
          onChange={(e) => setConditions(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          placeholder="Describe the conditions for refunds at this status..."
        />
      </div>

      <div className="bg-gray-50 p-3 rounded-lg">
        <h5 className="font-medium text-gray-700 mb-2">Refund Calculation Example (on $100 order):</h5>
        <div className="text-sm text-gray-600 space-y-1">
          <div>Base Refund: ${(100 * refundPercentage / 100).toFixed(2)} ({refundPercentage}% of $100)</div>
          <div>Processing Fee: -${(100 * processingFeePercentage / 100).toFixed(2)} ({processingFeePercentage}% of $100)</div>
          <div>Restocking Fee: -${(100 * restockingFeePercentage / 100).toFixed(2)} ({restockingFeePercentage}% of $100)</div>
          <div className="font-medium text-primary-600 border-t pt-1">
            Net Refund: ${calculateNetRefund(100).toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  )
}
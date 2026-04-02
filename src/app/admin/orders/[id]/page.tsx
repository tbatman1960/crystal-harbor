'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
// All data fetched via API routes (not direct lib imports)
import {
  ArrowLeftIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface OrderPageProps {
  params: {
    id: string
  }
}

export default function AdminOrderViewPage({ params }: OrderPageProps) {
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [showRefundModal, setShowRefundModal] = useState(false)
  const [labelData, setLabelData] = useState<any>(null)
  const [creatingLabels, setCreatingLabels] = useState(false)
  const [trackingData, setTrackingData] = useState<any>(null)
  const [loadingTracking, setLoadingTracking] = useState(false)
  const [statusUpdateData, setStatusUpdateData] = useState({
    status: '',
    trackingNumber: '',
    estimatedDelivery: '',
    statusMessage: '',
    sendEmail: true
  })
  const [refundData, setRefundData] = useState({
    refundType: 'full' as 'full' | 'partial',
    refundAmount: 0,
    refundReason: '',
    processRefund: true
  })
  const router = useRouter()

  useEffect(() => {
    loadOrder()
    loadLabelData()
  }, [])

  const loadOrder = async () => {
    try {
      const res = await fetch(`/api/admin/orders/${params.id}`)
      const result = await res.json()
      if (res.ok && result.order) {
        setOrder(result.order)
      } else {
        router.push('/admin/orders')
      }
    } catch (error) {
      console.error('Error loading order:', error)
      router.push('/admin/orders')
    } finally {
      setLoading(false)
    }
  }

  const loadLabelData = async () => {
    try {
      const res = await fetch(`/api/admin/orders/${params.id}/labels`)
      const result = await res.json()
      if (res.ok) {
        setLabelData(result)
      }
    } catch (error) {
      console.error('Error loading label data:', error)
    }
  }

  const handleCreateLabels = async () => {
    setCreatingLabels(true)
    try {
      const res = await fetch(`/api/admin/orders/${params.id}/labels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      const result = await res.json()
      
      if (res.ok && result.success) {
        alert(`Shipping labels created successfully! ${result.packages_count} package(s) processed.`)
        loadLabelData() // Refresh label data
        loadOrder() // Refresh order data
      } else {
        alert(`Failed to create labels: ${result.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error creating labels:', error)
      alert('Error creating shipping labels')
    } finally {
      setCreatingLabels(false)
    }
  }

  const handlePrintLabel = (labelIndex: number) => {
    const labelUrl = `/api/admin/orders/${params.id}/labels/${labelIndex}`
    window.open(labelUrl, '_blank')
  }

  const handleLoadTracking = async () => {
    if (!labelData?.has_labels) return
    
    setLoadingTracking(true)
    try {
      const res = await fetch(`/api/admin/orders/${params.id}/tracking`)
      const result = await res.json()
      
      if (res.ok && result.success) {
        setTrackingData(result)
      } else {
        alert(`Failed to load tracking: ${result.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error loading tracking:', error)
      alert('Error loading tracking information')
    } finally {
      setLoadingTracking(false)
    }
  }

  const handleStatusUpdate = async (newStatus: string) => {
    if (!order) return
    
    // If it's cancellation, show refund modal first
    if (newStatus === 'cancelled') {
      await handleCancellationRequest()
      return
    }
    
    // If it's just a simple status change, update directly
    if (newStatus === 'pending' || newStatus === 'processing') {
      setUpdating(true)
      try {
        const res = await fetch('/api/admin/orders', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: order.id, status: newStatus })
        })
        const result = await res.json()
        if (result.success) {
          setOrder({ ...order, status: newStatus })
        } else {
          alert('Failed to update order status')
        }
      } catch (error) {
        console.error('Error updating status:', error)
        alert('Error updating order status')
      } finally {
        setUpdating(false)
      }
    } else {
      // For shipped, delivered - show modal for additional details
      setStatusUpdateData({
        status: newStatus,
        trackingNumber: '',
        estimatedDelivery: '',
        statusMessage: '',
        sendEmail: true
      })
      setShowStatusModal(true)
    }
  }

  const handleCancellationRequest = async () => {
    if (!order) return

    try {
      // Calculate recommended refund amount based on current status
      // Simple refund calculation (full refund for pending/processing, partial otherwise)
      const refundAmount = (order.status === 'pending' || order.status === 'processing') 
        ? order.total_amount 
        : order.total_amount * 0.85 // 15% restocking for shipped orders
      
      setRefundData({
        refundType: refundAmount === order.total_amount ? 'full' : 'partial',
        refundAmount: Math.round(refundAmount * 100) / 100,
        refundReason: `Order cancelled by admin from ${order.status} status`,
        processRefund: refundAmount > 0
      })
      
      setShowRefundModal(true)
    } catch (error) {
      console.error('Error calculating refund:', error)
      alert('Error calculating refund amount')
    }
  }

  const handleOrderCancellationWithRefund = async () => {
    if (!order) return
    
    setUpdating(true)
    try {
      // First update order status to cancelled
      const cancelRes = await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, status: 'cancelled', statusMessage: refundData.refundReason, sendEmail: true })
      })
      const statusResult = await cancelRes.json()

      if (!statusResult.success) {
        alert('Failed to cancel order')
        return
      }

      // Process refund if requested
      if (refundData.processRefund && refundData.refundAmount > 0 && order.stripe_payment_intent_id) {
        if (order.stripe_payment_intent_id.startsWith('dev_test_') || order.stripe_payment_intent_id.startsWith('mobile_')) {
          // Test payment - simulate refund
          console.log(`🧪 Test refund simulated: $${refundData.refundAmount.toFixed(2)}`)
          alert(`Order cancelled successfully. Test refund of $${refundData.refundAmount.toFixed(2)} simulated.`)
        } else {
          // Process real Stripe refund
          const refundRes = await fetch('/api/refunds/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              payment_intent_id: order.stripe_payment_intent_id,
              amount: Math.round(refundData.refundAmount * 100),
              order_number: order.order_number
            })
          })
          const refundResult = await refundRes.json()

          if (refundResult.success || refundRes.ok) {
            alert(`Order cancelled successfully. Refund of $${refundData.refundAmount.toFixed(2)} processed.`)
          } else {
            alert(`Order cancelled successfully, but refund failed: ${refundResult.error}. Manual processing required.`)
          }
        }
      } else {
        alert('Order cancelled successfully. No refund processed.')
      }

      // Update local order state
      setOrder({ ...order, status: 'cancelled' })
      setShowRefundModal(false)
      
    } catch (error) {
      console.error('Error cancelling order:', error)
      alert('Error cancelling order')
    } finally {
      setUpdating(false)
    }
  }

  const handleEnhancedStatusUpdate = async () => {
    if (!order) return
    
    setUpdating(true)
    try {
      const { status, trackingNumber, estimatedDelivery, statusMessage, sendEmail } = statusUpdateData
      
      const updateRes = await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          status,
          trackingNumber: trackingNumber || undefined,
          estimatedDelivery: estimatedDelivery || undefined,
          statusMessage: statusMessage || undefined,
          sendEmail
        })
      })
      const result = await updateRes.json()
      
      if (result.success) {
        setOrder({ ...order, status })
        setShowStatusModal(false)
        alert(`Order status updated to ${status}${sendEmail ? ' and customer notified by email' : ''}`)
      } else {
        alert('Failed to update order status')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Error updating order status')
    } finally {
      setUpdating(false)
    }
  }

  const downloadOrderPDF = () => {
    // TODO: Implement PDF generation
    alert('PDF generation not implemented yet. Would generate order details as PDF.')
  }

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="section-padding">
        <div className="loading-pulse">Loading order...</div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="section-padding">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Order Not Found</h1>
          <button onClick={() => router.push('/admin/orders')} className="btn-primary">
            Back to Orders
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="section-padding">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-display font-bold text-3xl text-primary-600">
                Order #{order.order_number}
              </h1>
              <p className="text-secondary-600">
                Placed on {new Date(order.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={downloadOrderPDF}
              className="btn-outline flex items-center space-x-2"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <div className="card p-6">
              <h2 className="font-display font-semibold text-xl text-primary-600 mb-4">
                Order Items ({order.order_items?.length || 0})
              </h2>
              
              <div className="space-y-4">
                {order.order_items?.map((item: any, index: number) => (
                  <div key={index} className="flex items-center space-x-4 p-4 bg-background-50 rounded-lg">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">📦</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-neutral-700">{item.product_name}</h3>
                      <div className="text-sm text-secondary-600 space-x-4">
                        <span>Size: {item.selected_size}</span>
                        <span>Color: {item.selected_color}</span>
                        <span>Qty: {item.quantity}</span>
                      </div>
                      {item.custom_text && (
                        <div className="text-sm text-secondary-600 mt-1">
                          <strong>Custom Text:</strong> {item.custom_text}
                        </div>
                      )}
                      {item.tier_applied && (
                        <div className="text-xs text-accent-lime-600 mt-1">
                          {item.tier_applied}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">${item.unit_price.toFixed(2)} each</div>
                      <div className="text-lg font-bold text-primary-600">${item.line_total.toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Customer Information */}
            <div className="card p-6">
              <h2 className="font-display font-semibold text-xl text-primary-600 mb-4">
                Customer Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-neutral-700 mb-2">Contact Details</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Name:</span>
                      <span>{order.shipping_address?.first_name} {order.shipping_address?.last_name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <EnvelopeIcon className="w-4 h-4 text-secondary-500" />
                      <span>{order.guest_email || 'Member Account'}</span>
                    </div>
                    {order.shipping_address?.phone && (
                      <div className="flex items-center space-x-2">
                        <PhoneIcon className="w-4 h-4 text-secondary-500" />
                        <span>{order.shipping_address.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-neutral-700 mb-2">Shipping Address</h3>
                  <div className="flex items-start space-x-2">
                    <MapPinIcon className="w-4 h-4 text-secondary-500 mt-0.5" />
                    <div className="text-sm">
                      <div>{order.shipping_address?.address_line_1}</div>
                      {order.shipping_address?.address_line_2 && (
                        <div>{order.shipping_address.address_line_2}</div>
                      )}
                      <div>
                        {order.shipping_address?.city}, {order.shipping_address?.state} {order.shipping_address?.postal_code}
                      </div>
                      <div>{order.shipping_address?.country}</div>
                    </div>
                  </div>
                </div>
              </div>

              {order.special_instructions && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-1">Special Instructions</h4>
                  <p className="text-blue-700 text-sm">{order.special_instructions}</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Status */}
            <div className="card p-6">
              <h3 className="font-semibold text-neutral-700 mb-4">Order Status</h3>
              <select
                value={order.status}
                onChange={(e) => handleStatusUpdate(e.target.value)}
                disabled={updating}
                className={`w-full p-3 rounded-lg font-semibold ${getStatusColor(order.status)}`}
              >
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
              {updating && (
                <div className="text-sm text-secondary-500 mt-2">Updating...</div>
              )}
            </div>

            {/* Order Summary */}
            <div className="card p-6">
              <h3 className="font-semibold text-neutral-700 mb-4">Order Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping:</span>
                  <span>${order.shipping_cost.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold text-lg">
                  <span>Total:</span>
                  <span className="text-primary-600">${order.total_amount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Shipping Labels */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-neutral-700">Shipping Labels</h3>
                {labelData?.has_labels && (
                  <button
                    onClick={handleLoadTracking}
                    disabled={loadingTracking}
                    className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
                  >
                    {loadingTracking ? 'Loading...' : 'Refresh Tracking'}
                  </button>
                )}
              </div>
              
              {labelData?.has_labels ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-green-600 font-semibold">✓ Labels Created</span>
                    <span className="text-secondary-600">
                      {labelData.labels.length} package(s)
                    </span>
                  </div>
                  
                  {labelData.labels.map((label: any, index: number) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">{label.package_name}</div>
                          <div className="text-xs text-secondary-600">
                            Tracking: {label.tracking_number}
                          </div>
                          {label.service_name && (
                            <div className="text-xs text-secondary-600">
                              Service: {label.service_name}
                            </div>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handlePrintLabel(index)}
                            className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Print Label
                          </button>
                          <a
                            href={`https://tools.usps.com/go/TrackConfirmAction?tRef=fullpage&tLc=2&text28777=${label.tracking_number}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
                          >
                            Track
                          </a>
                        </div>
                      </div>
                      
                      {trackingData?.tracking?.find((t: any) => t.tracking_number === label.tracking_number) && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <div className="text-xs">
                            <div className="font-medium text-secondary-700">
                              Status: {trackingData.tracking.find((t: any) => t.tracking_number === label.tracking_number).tracking_info.status}
                            </div>
                            {trackingData.tracking.find((t: any) => t.tracking_number === label.tracking_number).tracking_info.events?.length > 0 && (
                              <div className="text-secondary-600 mt-1">
                                Latest: {trackingData.tracking.find((t: any) => t.tracking_number === label.tracking_number).tracking_info.events[0].activity}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {/* Show mock label indicator if applicable */}
                  {process.env.NODE_ENV === 'development' && !process.env.USPS_CLIENT_ID && (
                    <div className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
                      ⚠️ Mock labels generated (USPS API not configured)
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-sm text-secondary-600">
                    {order?.status === 'pending' ? (
                      'Create shipping labels when ready to ship this order.'
                    ) : order?.status === 'cancelled' ? (
                      'Order cancelled - no labels needed.'
                    ) : (
                      'No shipping labels created yet.'
                    )}
                  </div>
                  
                  {order?.status !== 'cancelled' && (
                    <button
                      onClick={handleCreateLabels}
                      disabled={creatingLabels}
                      className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                    >
                      {creatingLabels ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Creating Labels...</span>
                        </>
                      ) : (
                        <span>Create Shipping Labels</span>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Large Order Alert */}
            {order.order_items?.reduce((sum: number, item: any) => sum + item.quantity, 0) >= 100 && (
              <div className="card p-6 bg-yellow-50 border-yellow-200">
                <div className="flex items-center space-x-2 mb-2">
                  <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />
                  <h3 className="font-semibold text-yellow-800">Large Order Alert</h3>
                </div>
                <p className="text-yellow-700 text-sm">
                  This order contains 100+ units. Verify stock availability and contact customer if needed.
                </p>
                {order.large_order_alert_sent && (
                  <div className="text-xs text-yellow-600 mt-2">✓ Telegram alert sent</div>
                )}
              </div>
            )}

            {/* Payment Info */}
            <div className="card p-6">
              <h3 className="font-semibold text-neutral-700 mb-4">Payment</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Method:</span>
                  <span>Credit Card</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="text-green-600 font-semibold">Paid</span>
                </div>
                {order.stripe_payment_intent_id && (
                  <div className="text-xs text-secondary-500">
                    Stripe ID: {order.stripe_payment_intent_id}
                  </div>
                )}
              </div>
            </div>

            {/* Refund Actions */}
            {order.status !== 'cancelled' && (
              <div className="card p-6 border-red-200 bg-red-50">
                <h3 className="font-semibold text-red-800 mb-3">Refund / Cancel</h3>
                <p className="text-sm text-red-700 mb-4">
                  {order.status === 'pending' || order.status === 'processing'
                    ? 'Full refund available — order has not shipped.'
                    : 'Partial refund per policy — order has progressed.'}
                </p>
                <button
                  onClick={() => handleCancellationRequest()}
                  disabled={updating}
                  className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  {updating ? 'Processing...' : 'Process Refund & Cancel Order'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Status Update Modal */}
        {showStatusModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-primary-600 mb-4">
                Update Order Status to "{statusUpdateData.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}"
              </h3>
              
              <div className="space-y-4">
                {(statusUpdateData.status === 'shipped' || statusUpdateData.status === 'delivered') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tracking Number
                    </label>
                    <input
                      type="text"
                      value={statusUpdateData.trackingNumber}
                      onChange={(e) => setStatusUpdateData({
                        ...statusUpdateData,
                        trackingNumber: e.target.value
                      })}
                      placeholder="1Z999AA1012345675"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estimated Delivery Date
                  </label>
                  <input
                    type="text"
                    value={statusUpdateData.estimatedDelivery}
                    onChange={(e) => setStatusUpdateData({
                      ...statusUpdateData,
                      estimatedDelivery: e.target.value
                    })}
                    placeholder="March 25, 2024"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Message (Optional)
                  </label>
                  <textarea
                    value={statusUpdateData.statusMessage}
                    onChange={(e) => setStatusUpdateData({
                      ...statusUpdateData,
                      statusMessage: e.target.value
                    })}
                    placeholder="Any additional information for the customer..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="sendEmail"
                    checked={statusUpdateData.sendEmail}
                    onChange={(e) => setStatusUpdateData({
                      ...statusUpdateData,
                      sendEmail: e.target.checked
                    })}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="sendEmail" className="ml-2 block text-sm text-gray-700">
                    Send email notification to customer
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={updating}
                >
                  Cancel
                </button>
                <button
                  onClick={handleEnhancedStatusUpdate}
                  disabled={updating}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  {updating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Updating...</span>
                    </>
                  ) : (
                    <span>Update Status</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Refund Modal for Cancellations */}
        {showRefundModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
              <h3 className="text-lg font-semibold text-red-600 mb-4">
                Cancel Order #{order?.order_number}
              </h3>
              
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-800 mb-2">⚠️ Order Cancellation</h4>
                  <p className="text-yellow-700 text-sm">
                    This will permanently cancel the order and notify the customer. 
                    Choose your refund option carefully.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Refund Type
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="full"
                        checked={refundData.refundType === 'full'}
                        onChange={(e) => setRefundData({
                          ...refundData,
                          refundType: 'full',
                          refundAmount: order?.total_amount || 0
                        })}
                        className="mr-2"
                      />
                      <span>Full Refund (${order?.total_amount.toFixed(2)})</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="partial"
                        checked={refundData.refundType === 'partial'}
                        onChange={(e) => setRefundData({
                          ...refundData,
                          refundType: 'partial'
                        })}
                        className="mr-2"
                      />
                      <span>Partial Refund (based on return policy)</span>
                    </label>
                  </div>
                </div>

                {refundData.refundType === 'partial' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Refund Amount
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-500">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max={order?.total_amount || 0}
                        value={refundData.refundAmount}
                        onChange={(e) => setRefundData({
                          ...refundData,
                          refundAmount: parseFloat(e.target.value) || 0
                        })}
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Policy suggests: ${refundData.refundAmount.toFixed(2)} based on current order status
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cancellation Reason
                  </label>
                  <textarea
                    value={refundData.refundReason}
                    onChange={(e) => setRefundData({
                      ...refundData,
                      refundReason: e.target.value
                    })}
                    placeholder="Reason for cancellation (will be sent to customer)..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="processRefund"
                    checked={refundData.processRefund}
                    onChange={(e) => setRefundData({
                      ...refundData,
                      processRefund: e.target.checked
                    })}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="processRefund" className="ml-2 block text-sm text-gray-700">
                    Process refund automatically (${refundData.refundAmount.toFixed(2)})
                  </label>
                </div>

                {!refundData.processRefund && refundData.refundAmount > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-blue-700 text-sm">
                      💡 Refund will need to be processed manually through your payment processor.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowRefundModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={updating}
                >
                  Cancel
                </button>
                <button
                  onClick={handleOrderCancellationWithRefund}
                  disabled={updating}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  {updating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>Cancel Order {refundData.processRefund ? '& Process Refund' : ''}</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
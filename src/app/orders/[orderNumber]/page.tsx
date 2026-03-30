'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  TruckIcon,
  CogIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline'

interface OrderPageProps {
  params: {
    orderNumber: string
  }
}

export default function CustomerOrderPage({ params }: OrderPageProps) {
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState('')
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadOrder()
  }, [params.orderNumber])

  const loadOrder = async () => {
    try {
      const response = await fetch(`/api/orders/${params.orderNumber}`)
      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Order not found')
        return
      }

      setOrder(result.order)
    } catch (error) {
      console.error('Error loading order:', error)
      setError('Failed to load order details')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelOrder = async () => {
    if (!order) return

    setCancelling(true)
    setError('')

    try {
      const response = await fetch('/api/orders/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_id: order.id,
          order_number: order.order_number
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Failed to cancel order')
        return
      }

      // Update order status locally
      setOrder({ ...order, status: 'cancelled' })
      setShowCancelConfirm(false)
      
      alert(result.refundProcessed 
        ? `Order cancelled successfully! A refund of $${result.refundAmount.toFixed(2)} will be processed within 3-5 business days.`
        : 'Order cancelled successfully! Refund processing is pending.'
      )

    } catch (error) {
      console.error('Error cancelling order:', error)
      setError('Network error occurred. Please try again.')
    } finally {
      setCancelling(false)
    }
  }

  const getStatusInfo = (status: string) => {
    const statusConfig = {
      'pending': {
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        icon: CogIcon,
        title: 'Order Pending',
        description: 'Your order has been received and is being reviewed.',
        canCancel: true
      },
      'ordered': {
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        icon: CogIcon,
        title: 'Sent to Production',
        description: 'Your order has been sent to our printing facility.',
        canCancel: false
      },
      'in_production': {
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
        icon: CogIcon,
        title: 'In Production',
        description: 'Your items are currently being printed.',
        canCancel: false
      },
      'quality_check': {
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-100',
        icon: CheckCircleIcon,
        title: 'Quality Review',
        description: 'Your items are being inspected for quality.',
        canCancel: false
      },
      'shipped': {
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        icon: TruckIcon,
        title: 'Shipped',
        description: 'Your order is on its way!',
        canCancel: false
      },
      'delivered': {
        color: 'text-green-700',
        bgColor: 'bg-green-200',
        icon: CheckCircleIcon,
        title: 'Delivered',
        description: 'Your order has been delivered.',
        canCancel: false
      },
      'cancelled': {
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        icon: XCircleIcon,
        title: 'Cancelled',
        description: 'This order has been cancelled.',
        canCancel: false
      }
    }

    return statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
  }

  if (loading) {
    return (
      <div className="section-padding">
        <div className="container mx-auto max-w-4xl">
          <div className="loading-pulse">Loading order details...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="section-padding">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center">
            <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-red-600 mb-4">Order Not Found</h1>
            <p className="text-secondary-600 mb-6">{error}</p>
            <button 
              onClick={() => router.push('/')}
              className="btn-primary"
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="section-padding">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Order Not Found</h1>
            <button 
              onClick={() => router.push('/')}
              className="btn-primary"
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  const statusInfo = getStatusInfo(order.status)
  const StatusIcon = statusInfo.icon

  return (
    <div className="section-padding bg-background-50">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-display font-bold text-3xl text-primary-600 mb-2">
            Order #{order.order_number}
          </h1>
          <p className="text-secondary-600">
            Placed on {new Date(order.created_at).toLocaleDateString()}
          </p>
        </div>

        {/* Order Status */}
        <div className="card p-8 mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className={`p-4 rounded-full ${statusInfo.bgColor}`}>
              <StatusIcon className={`h-12 w-12 ${statusInfo.color}`} />
            </div>
          </div>
          
          <div className="text-center">
            <h2 className={`text-2xl font-bold ${statusInfo.color} mb-2`}>
              {statusInfo.title}
            </h2>
            <p className="text-secondary-600 mb-6">
              {statusInfo.description}
            </p>

            {statusInfo.canCancel && (
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="btn-outline border-red-500 text-red-600 hover:bg-red-50"
                disabled={cancelling}
              >
                Cancel Order
              </button>
            )}

            {!statusInfo.canCancel && order.status !== 'cancelled' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-700 text-sm">
                  💡 Need to cancel or modify your order? 
                  Contact us at <a href="mailto:info@crystalharbortc.com" className="underline">info@crystalharbortc.com</a> or (317) 997-5503
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Order Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Items */}
          <div className="card p-6">
            <h3 className="font-display font-semibold text-xl text-primary-600 mb-4">
              Order Items
            </h3>
            
            <div className="space-y-4">
              {order.items?.map((item: any, index: number) => (
                <div key={index} className="flex items-center space-x-4 p-4 bg-background-50 rounded-lg">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-xl">📦</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-neutral-700">{item.product_name}</h4>
                    <div className="text-sm text-secondary-600">
                      {item.selected_size && <span>Size: {item.selected_size} • </span>}
                      {item.selected_color && <span>Color: {item.selected_color} • </span>}
                      <span>Qty: {item.quantity}</span>
                    </div>
                    {item.custom_text && (
                      <div className="text-sm text-secondary-600 mt-1">
                        <strong>Custom Text:</strong> {item.custom_text}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-primary-600">${item.line_total.toFixed(2)}</div>
                    <div className="text-sm text-secondary-500">${item.unit_price.toFixed(2)} each</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary & Shipping */}
          <div className="space-y-6">
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
                {order.tax_amount > 0 && (
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>${order.tax_amount.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between font-semibold text-lg">
                  <span>Total:</span>
                  <span className="text-primary-600">${order.total_amount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="card p-6">
              <h3 className="font-semibold text-neutral-700 mb-4">Shipping Address</h3>
              <div className="text-sm text-secondary-600">
                <div>{order.shipping_address?.first_name} {order.shipping_address?.last_name}</div>
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

            {/* Help */}
            <div className="card p-6 bg-background-50">
              <h3 className="font-semibold text-neutral-700 mb-4">Need Help?</h3>
              <div className="space-y-2 text-sm">
                <div>📧 <a href="mailto:info@crystalharbortc.com" className="text-primary-600 hover:underline">info@crystalharbortc.com</a></div>
                <div>📞 (317) 997-5503</div>
                <div className="text-secondary-500 mt-3">
                  Business Hours: Monday - Friday, 9 AM - 5 PM EST
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cancellation Confirmation Modal */}
        {showCancelConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-red-600 mb-4">
                Cancel Order?
              </h3>
              
              <p className="text-secondary-600 mb-6">
                Are you sure you want to cancel order #{order.order_number}? 
                This action cannot be undone, but you will receive a full refund within 3-5 business days.
              </p>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={cancelling}
                >
                  Keep Order
                </button>
                <button
                  onClick={handleCancelOrder}
                  disabled={cancelling}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  {cancelling ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Cancelling...</span>
                    </>
                  ) : (
                    <span>Yes, Cancel Order</span>
                  )}
                </button>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                  {error}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
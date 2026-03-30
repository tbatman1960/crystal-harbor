'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { PrinterIcon, CheckCircleIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
// Order data fetched via API route (not direct Supabase) due to RLS
import { generateOrderPDF, generatePDFFromElement, printPage, isPDFSupported } from '@/lib/pdf-generator'
import { trackPurchase } from '@/lib/analytics'
import { useCartStore } from '@/store/cartStore'

export interface OrderDetails {
  id: string
  order_number: string
  status: string
  total_amount: number
  subtotal: number
  shipping_cost: number
  tax_amount?: number
  payment_intent_id: string | null
  created_at: string
  estimated_delivery: string | null
  order_items: Array<{
    id: string
    product_name: string
    selected_size: string | null
    selected_color: string | null
    quantity: number
    unit_price: number
    line_total: number
    custom_text: string | null
    selected_design: any
  }>
  shipping_address: {
    first_name: string
    last_name: string
    email: string
    phone: string
    address_line_1: string
    address_line_2: string | null
    city: string
    state: string
    postal_code: string
    country: string
  }
}

function OrderSuccessContent() {
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()
  const orderNumber = searchParams.get('order')
  const { clearCart } = useCartStore()

  useEffect(() => {
    if (!orderNumber) {
      setError('Order number not provided')
      setLoading(false)
      return
    }

    // Check if this is a fresh order completion
    const orderCompleted = sessionStorage.getItem('orderCompleted')
    if (orderCompleted === orderNumber) {
      // Clear the flag and cart
      sessionStorage.removeItem('orderCompleted')
      clearCart()
      console.log('Order success page loaded - cart cleared for order:', orderNumber)
    }

    loadOrderDetails()
  }, [orderNumber, clearCart])

  const loadOrderDetails = async () => {
    try {
      const res = await fetch(`/api/orders/${orderNumber}`)
      if (!res.ok) throw new Error('Failed to load order')
      const data = await res.json()
      const orderData = data.order

      if (!orderData) throw new Error('Order not found')

      setOrder(orderData)

      // Track purchase completion for analytics
      if (orderData?.order_items) {
        const purchaseItems = orderData.order_items.map((item: any) => ({
          item_id: item.product_id || item.id,
          item_name: item.product_name,
          item_category: 'custom-printed-products', // Default category
          quantity: item.quantity,
          price: item.unit_price
        }))

        trackPurchase({
          transaction_id: orderData.order_number,
          value: orderData.total_amount,
          items: purchaseItems
        })
      }
    } catch (err: any) {
      console.error('Error loading order:', err)
      setError('Order not found or could not be loaded')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelOrder = async () => {
    if (!order) return
    if (!confirm(`Cancel order ${order.order_number}? You will receive a full refund of $${order.total_amount.toFixed(2)}.`)) return
    
    setCancelling(true)
    try {
      const res = await fetch('/api/orders/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: order.id, order_number: order.order_number })
      })
      const result = await res.json()
      
      if (res.ok && result.success) {
        alert(result.refundProcessed 
          ? `Order cancelled! A refund of $${result.refundAmount?.toFixed(2) || order.total_amount.toFixed(2)} will be processed within 3-5 business days.`
          : 'Order cancelled successfully!')
        // Reload to show updated status
        await loadOrderDetails()
      } else {
        alert(result.error || 'Failed to cancel order')
      }
    } catch (error) {
      console.error('Error cancelling order:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setCancelling(false)
    }
  }

  const handlePrint = () => {
    printPage()
  }

  const handleDownloadPDF = async () => {
    if (!order) return

    if (!isPDFSupported()) {
      alert('PDF download is not supported in your browser. Please try printing instead.')
      return
    }

    try {
      const filename = `order-${order.order_number}.pdf`
      
      // Try to generate PDF from the order data
      const result = await generateOrderPDF(order, filename)
      
      if (!result.success) {
        // Fallback to generating from HTML element
        const htmlResult = await generatePDFFromElement('order-summary-content', filename)
        
        if (!htmlResult.success) {
          alert(`Failed to generate PDF: ${result.error || htmlResult.error}`)
        }
      }
    } catch (error) {
      console.error('Error downloading PDF:', error)
      alert('Failed to generate PDF. Please try again or use the print function.')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatEstimatedDelivery = (dateString: string | null) => {
    if (!dateString) return '2-3 weeks from order date'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="section-padding bg-background-50 min-h-screen">
        <div className="container mx-auto">
          <div className="text-center py-12">
            <div className="loading-pulse">Loading order details...</div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="section-padding bg-background-50 min-h-screen">
        <div className="container mx-auto max-w-2xl">
          <div className="card p-8 text-center">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h1 className="font-display font-bold text-2xl text-red-600 mb-4">
              Order Not Found
            </h1>
            <p className="text-secondary-600 mb-6">
              {error || 'The order you\'re looking for could not be found.'}
            </p>
            <Link href="/" className="btn-primary">
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="section-padding bg-background-50 min-h-screen">
        <div className="container mx-auto max-w-4xl">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircleIcon className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="font-display font-bold text-3xl text-primary-600 mb-2">
              Order Confirmed!
            </h1>
            <p className="text-lg text-secondary-600">
              Thank you for your order. We've received your order and will begin processing it shortly.
            </p>
          </div>

          {/* Action Buttons - Hide in Print */}
          <div className="flex justify-center space-x-4 mb-8 print:hidden">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              <PrinterIcon className="w-5 h-5" />
              <span>Print Order</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center space-x-2 bg-secondary-600 hover:bg-secondary-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              <ArrowDownTrayIcon className="w-5 h-5" />
              <span>Download PDF</span>
            </button>
          </div>

          {/* Order Summary */}
          <div id="order-summary-content" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Order Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Information */}
              <div className="card p-6">
                <h2 className="font-display font-semibold text-xl text-primary-600 mb-4">
                  Order Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-semibold text-neutral-700">Order Number</p>
                    <p className="text-lg font-mono">{order.order_number}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-neutral-700">Order Date</p>
                    <p>{formatDate(order.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-neutral-700">Status</p>
                    <span className="inline-block bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full capitalize">
                      {order.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-neutral-700">Estimated Delivery</p>
                    <p>{formatEstimatedDelivery(order.estimated_delivery)}</p>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="card p-6">
                <h2 className="font-display font-semibold text-xl text-primary-600 mb-4">
                  Shipping Address
                </h2>
                <div className="bg-background-50 p-4 rounded-lg">
                  <p className="font-semibold">
                    {order.shipping_address.first_name} {order.shipping_address.last_name}
                  </p>
                  <p>{order.shipping_address.address_line_1}</p>
                  {order.shipping_address.address_line_2 && (
                    <p>{order.shipping_address.address_line_2}</p>
                  )}
                  <p>
                    {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}
                  </p>
                  <p>{order.shipping_address.country}</p>
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-sm text-secondary-600">
                      <span className="font-semibold">Email:</span> {order.shipping_address.email}
                    </p>
                    <p className="text-sm text-secondary-600">
                      <span className="font-semibold">Phone:</span> {order.shipping_address.phone}
                    </p>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="card p-6">
                <h2 className="font-display font-semibold text-xl text-primary-600 mb-4">
                  Order Items
                </h2>
                <div className="space-y-4">
                  {order.order_items.map((item) => (
                    <div key={item.id} className="flex justify-between items-start p-4 bg-background-50 rounded-lg">
                      <div className="flex-grow">
                        <h3 className="font-semibold text-neutral-700">{item.product_name}</h3>
                        <div className="text-sm text-secondary-600 space-y-1 mt-1">
                          {item.selected_size && (
                            <p>Size: <span className="font-medium">{item.selected_size}</span></p>
                          )}
                          {item.selected_color && (
                            <p>Color: <span className="font-medium">{item.selected_color}</span></p>
                          )}
                          {item.selected_design && (
                            <p>Design: <span className="font-medium">{item.selected_design.name}</span></p>
                          )}
                          {item.custom_text && (
                            <p>Custom Text: "<span className="font-medium">{item.custom_text}</span>"</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-semibold">${item.line_total.toFixed(2)}</p>
                        <p className="text-sm text-secondary-600">
                          ${item.unit_price.toFixed(2)} × {item.quantity}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="card p-6 sticky top-24">
                <h2 className="font-display font-semibold text-xl text-primary-600 mb-4">
                  Order Summary
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-secondary-600">Subtotal</span>
                    <span className="font-medium">${order.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-600">Shipping</span>
                    <span className="font-medium">${order.shipping_cost.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between">
                      <span className="font-semibold text-lg text-neutral-700">Total</span>
                      <span className="font-bold text-2xl text-primary-600">
                        ${order.total_amount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* What's Next Section */}
                <div className="mt-8 p-4 bg-accent-lime-50 rounded-lg">
                  <h3 className="font-semibold text-accent-lime-800 mb-2">What's Next?</h3>
                  <ul className="text-sm text-accent-lime-700 space-y-1">
                    <li>• Order confirmation email sent</li>
                    <li>• Design review (if applicable)</li>
                    <li>• Professional printing begins</li>
                    <li>• Quality check and packaging</li>
                    <li>• Shipment with tracking info</li>
                  </ul>
                </div>

                {/* Cancel Order - only for pending */}
                {order.status === 'pending' && (
                  <div className="mt-6 p-4 bg-red-50 rounded-lg">
                    <h3 className="font-semibold text-red-800 mb-2">Changed Your Mind?</h3>
                    <p className="text-sm text-red-700 mb-3">
                      Cancel now for a full refund. Once production begins, cancellations are subject to our refund policy.
                    </p>
                    <button
                      onClick={handleCancelOrder}
                      disabled={cancelling}
                      className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                      {cancelling ? 'Cancelling...' : 'Cancel Order & Get Full Refund'}
                    </button>
                  </div>
                )}

                {/* Continue Shopping */}
                <div className="mt-6 space-y-3">
                  <Link href="/products" className="btn-primary w-full text-center block">
                    Continue Shopping
                  </Link>
                  <Link href="/account" className="btn-outline w-full text-center block">
                    View All Orders
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="mt-12 text-center text-sm text-secondary-600">
            <p className="mb-2">
              Questions about your order? Contact us at{' '}
              <a href="mailto:info@crystalharbortc.com" className="text-accent-coral-500 hover:underline">
                info@crystalharbortc.com
              </a>{' '}
              or call (317) 997-5503
            </p>
            <p>
              Order processing time: 2-3 weeks • Free design review included
            </p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:block, .print\\:block * {
            visibility: visible;
          }
          .print\\:hidden {
            display: none !important;
          }
          .section-padding {
            padding: 20px !important;
          }
          .card {
            box-shadow: none !important;
            border: 1px solid #ccc !important;
          }
        }
      `}</style>
    </>
  )
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="section-padding bg-background-50 min-h-screen">
        <div className="container mx-auto max-w-4xl text-center py-12">
          <div className="loading-pulse">Loading order confirmation...</div>
        </div>
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  )
}
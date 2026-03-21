'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useCartStore } from '@/store/cartStore'
import { calculateShipping, formatShippingBreakdown } from '@/lib/shipping'

export default function OrderSummary() {
  const { items, subtotal, totalItems } = useCartStore()
  const [mounted, setMounted] = useState(false)
  
  // Calculate sophisticated shipping
  const shippingCalc = calculateShipping(items.map(item => ({
    product_name: item.product_name,
    category_slug: item.category_slug,
    quantity: item.quantity,
    unit_price: item.unit_price,
    line_total: item.line_total
  })))
  
  const shippingCost = shippingCalc.cost
  const total = subtotal + shippingCost

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="card p-6">
        <div className="loading-pulse">Loading order summary...</div>
      </div>
    )
  }

  return (
    <div className="card p-6 sticky top-24">
      <h2 className="font-display font-semibold text-xl text-primary-600 mb-4">
        Order Summary
      </h2>

      {/* Items List */}
      <div className="space-y-3 mb-6">
        {items.map((item) => (
          <div key={item.id} className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
              {item.image_url ? (
                <Image
                  src={item.image_url}
                  alt={item.product_name}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary-100 to-secondary-200">
                  <div className="text-secondary-400 text-xs">📷</div>
                </div>
              )}
            </div>
            
            <div className="flex-grow min-w-0">
              <h3 className="font-medium text-sm text-neutral-700 truncate">
                {item.product_name}
              </h3>
              <div className="text-xs text-secondary-600">
                {item.selected_size && `${item.selected_size} • `}
                {item.selected_color && `${item.selected_color} • `}
                Qty: {item.quantity}
              </div>
              {item.tier_applied && (
                <div className="text-xs text-accent-lime-600 font-medium">
                  {item.tier_applied}
                </div>
              )}
            </div>
            
            <div className="text-sm font-medium text-neutral-700">
              ${item.line_total.toFixed(2)}
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between text-sm">
          <span className="text-secondary-600">Subtotal ({totalItems} items)</span>
          <span className="font-medium">${subtotal.toFixed(2)}</span>
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-secondary-600">Shipping ({shippingCalc.method})</span>
            <span className="font-medium">${shippingCost.toFixed(2)}</span>
          </div>
          {shippingCalc.estimatedDays && (
            <div className="text-xs text-secondary-500">
              Estimated delivery: {shippingCalc.estimatedDays}
            </div>
          )}
        </div>
        
        <div className="border-t border-gray-200 pt-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-lg text-neutral-700">Total</span>
            <span className="font-bold text-2xl text-primary-600">
              ${total.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Processing Info */}
      <div className="p-4 bg-background-50 rounded-lg">
        <h3 className="font-semibold text-sm text-neutral-700 mb-2">
          What happens next?
        </h3>
        <ul className="text-xs text-secondary-600 space-y-1">
          <li>• Payment processed securely via Stripe</li>
          <li>• Order review and design preparation</li>
          <li>• Professional printing on quality materials</li>
          <li>• Shipping within 2-3 weeks</li>
        </ul>
      </div>

      {/* Large Order Notice */}
      {items.some(item => item.quantity >= 100) && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="text-blue-600">ℹ️</div>
            <div>
              <p className="text-sm font-semibold text-blue-800">Large Order</p>
              <p className="text-xs text-blue-600">
                Orders 100+ units reviewed for availability
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
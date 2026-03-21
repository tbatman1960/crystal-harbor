'use client'

import { useState, useEffect } from 'react'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'

export default function DebugCartPage() {
  const { items, subtotal, totalItems, clearCart } = useCartStore()
  const { user, isAuthenticated } = useAuthStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div>Loading...</div>
  }

  return (
    <div className="section-padding">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Cart Debug Information</h1>
        
        {/* User Info */}
        <div className="card p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current User</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify({ 
              isAuthenticated,
              user: user ? {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName
              } : null
            }, null, 2)}
          </pre>
        </div>

        {/* Cart Summary */}
        <div className="card p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Cart Summary</h2>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">{totalItems}</div>
              <div className="text-sm text-secondary-600">Total Items</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">${subtotal.toFixed(2)}</div>
              <div className="text-sm text-secondary-600">Subtotal</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">${(subtotal + 9.99).toFixed(2)}</div>
              <div className="text-sm text-secondary-600">Total (+ $9.99 shipping)</div>
            </div>
          </div>
          
          <button
            onClick={clearCart}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
          >
            Clear Entire Cart
          </button>
        </div>

        {/* Cart Items Detail */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4">Cart Items ({items.length})</h2>
          {items.length === 0 ? (
            <p className="text-secondary-600">Cart is empty</p>
          ) : (
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={item.id} className="p-4 border border-gray-200 rounded">
                  <h3 className="font-semibold">{item.product_name}</h3>
                  <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                    <div>
                      <div><strong>Quantity:</strong> {item.quantity}</div>
                      <div><strong>Size:</strong> {item.selected_size}</div>
                      <div><strong>Color:</strong> {item.selected_color}</div>
                    </div>
                    <div>
                      <div><strong>Unit Price:</strong> ${item.unit_price.toFixed(2)}</div>
                      <div><strong>Line Total:</strong> ${item.line_total.toFixed(2)}</div>
                      <div><strong>Tier:</strong> {item.tier_applied}</div>
                    </div>
                  </div>
                  {item.custom_text && (
                    <div className="mt-2"><strong>Custom Text:</strong> {item.custom_text}</div>
                  )}
                  {item.uploaded_file && (
                    <div className="mt-2"><strong>Uploaded File:</strong> {item.uploaded_file.name}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Basic Cart Info */}
        <div className="card p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Basic Calculations</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-secondary-600">Items Array Length</div>
              <div className="text-lg font-bold">{items.length}</div>
            </div>
            <div>
              <div className="text-sm text-secondary-600">Store Subtotal</div>
              <div className="text-lg font-bold">${subtotal.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-sm text-secondary-600">Manual Subtotal</div>
              <div className="text-lg font-bold">
                ${items.reduce((sum, item) => sum + (item.line_total || 0), 0).toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-8 text-center space-x-4">
          <a href="/cart" className="btn-primary">Go to Cart</a>
          <a href="/checkout" className="btn-secondary">Go to Checkout</a>
          <a href="/test-pricing" className="btn-outline">Pricing Test</a>
        </div>
      </div>
    </div>
  )
}
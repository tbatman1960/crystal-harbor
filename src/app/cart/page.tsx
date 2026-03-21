'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useCartStore } from '@/store/cartStore'
import { calculateShipping } from '@/lib/shipping'
import { TrashIcon, PlusIcon, MinusIcon } from '@heroicons/react/24/outline'

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, subtotal, totalItems } = useCartStore()
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

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="section-padding bg-background-50 min-h-screen">
        <div className="container mx-auto">
          <div className="text-center py-12">
            <div className="loading-pulse">Loading cart...</div>
          </div>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="section-padding bg-background-50 min-h-screen">
        <div className="container mx-auto max-w-4xl">
          <h1 className="font-display font-bold text-3xl text-primary-600 mb-8">
            Shopping Cart
          </h1>
          
          <div className="card p-12 text-center">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="font-display font-semibold text-2xl text-primary-600 mb-4">
              Your cart is empty
            </h2>
            <p className="text-secondary-600 mb-8">
              Add some products to get started with your custom order
            </p>
            <Link href="/products" className="btn-primary">
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="section-padding bg-background-50 min-h-screen">
      <div className="container mx-auto max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display font-bold text-3xl text-primary-600">
            Shopping Cart ({totalItems} {totalItems === 1 ? 'item' : 'items'})
          </h1>
          <button
            onClick={clearCart}
            className="text-red-600 hover:text-red-700 text-sm font-medium"
          >
            Clear Cart
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item.id} className="card p-6">
                <div className="flex items-start space-x-4">
                  {/* Product Image */}
                  <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {item.image_url ? (
                      <Image
                        src={item.image_url}
                        alt={item.product_name}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary-100 to-secondary-200">
                        <div className="text-secondary-400 text-lg">📷</div>
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="flex-grow min-w-0">
                    <Link 
                      href={`/products/${item.category_slug}/${item.product_slug}`}
                      className="font-display font-semibold text-lg text-primary-600 hover:text-accent-coral-500 transition-colors duration-200"
                    >
                      {item.product_name}
                    </Link>
                    
                    <div className="flex items-center space-x-4 text-sm text-secondary-600 mt-1">
                      {item.selected_size && (
                        <span>Size: <span className="font-medium">{item.selected_size}</span></span>
                      )}
                      {item.selected_color && (
                        <span>Color: <span className="font-medium">{item.selected_color}</span></span>
                      )}
                    </div>

                    {item.tier_applied && (
                      <div className="text-xs text-accent-lime-600 font-medium mt-1">
                        {item.tier_applied} pricing applied
                      </div>
                    )}

                    {/* Customizations */}
                    <div className="mt-2 space-y-1">
                      {item.selected_design && (
                        <div className="text-xs text-secondary-600 flex items-center space-x-1">
                          <span>🎨</span>
                          <span><span className="font-medium">Design:</span> {item.selected_design.name}</span>
                        </div>
                      )}
                      {item.uploaded_file && (
                        <div className="text-xs text-secondary-600 flex items-center space-x-1">
                          <span>📎</span>
                          <span>Custom image: {item.uploaded_file.name}</span>
                        </div>
                      )}
                      {item.custom_text && (
                        <div className="text-xs text-secondary-600">
                          <span className="font-medium">Custom text:</span> "{item.custom_text}"
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quantity & Price Controls */}
                  <div className="flex flex-col items-end space-y-3">
                    {/* Price */}
                    <div className="text-right">
                      <div className="font-semibold text-lg text-neutral-700">
                        ${item.line_total.toFixed(2)}
                      </div>
                      <div className="text-sm text-secondary-600">
                        ${item.unit_price.toFixed(2)} each
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-accent-coral-500 transition-colors duration-200"
                      >
                        <MinusIcon className="w-4 h-4" />
                      </button>
                      
                      <span className="w-12 text-center font-medium">
                        {item.quantity}
                      </span>
                      
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-accent-lime-500 transition-colors duration-200"
                      >
                        <PlusIcon className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-red-600 hover:text-red-700 transition-colors duration-200"
                      title="Remove item"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24">
              <h2 className="font-display font-semibold text-xl text-primary-600 mb-4">
                Order Summary
              </h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-secondary-600">Subtotal ({totalItems} items)</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-secondary-600">Shipping</span>
                  <span className="font-medium">${shippingCost.toFixed(2)}</span>
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

              <div className="space-y-4">
                <Link href="/checkout" className="btn-primary w-full">
                  Proceed to Checkout
                </Link>
                
                <Link 
                  href="/products" 
                  className="btn-outline w-full text-center block"
                >
                  Continue Shopping
                </Link>
              </div>

              {/* Additional Info */}
              <div className="mt-6 p-4 bg-background-50 rounded-lg">
                <h3 className="font-semibold text-sm text-neutral-700 mb-2">
                  Order Information
                </h3>
                <ul className="text-xs text-secondary-600 space-y-1">
                  <li>• 2-3 weeks processing time for custom items</li>
                  <li>• Free design review before printing</li>
                  <li>• Secure payment processing</li>
                  <li>• Order tracking provided</li>
                </ul>
              </div>

              {/* Large Order Notice */}
              {items.some(item => item.quantity >= 100) && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="text-blue-600">ℹ️</div>
                    <div>
                      <p className="text-sm font-semibold text-blue-800">Large Order Notice</p>
                      <p className="text-xs text-blue-600">
                        Your order includes 100+ units and will be reviewed for stock availability.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
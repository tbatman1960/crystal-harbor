'use client'

import { useState, useEffect } from 'react'
import { PricingTier, calculatePrice } from '@/lib/products'

interface PricingDisplayProps {
  pricingTiers: PricingTier[]
  basePrice?: number
  onPriceChange: (priceData: {
    pricePerUnit: number
    totalPrice: number
    tierName: string
    discountPercentage: number
  }) => void
  onQuantityChange: (quantity: number) => void
}

export default function PricingDisplay({ 
  pricingTiers, 
  basePrice,
  onPriceChange, 
  onQuantityChange 
}: PricingDisplayProps) {
  const [quantity, setQuantity] = useState(1)
  const [priceData, setPriceData] = useState(calculatePrice(pricingTiers, 1, basePrice))

  useEffect(() => {
    const newPriceData = calculatePrice(pricingTiers, quantity, basePrice)
    setPriceData(newPriceData)
    onPriceChange(newPriceData)
    onQuantityChange(quantity)
  }, [quantity, pricingTiers, onPriceChange, onQuantityChange])

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1) return
    if (newQuantity > 10000) return // Reasonable upper limit
    setQuantity(newQuantity)
  }

  const incrementQuantity = () => handleQuantityChange(quantity + 1)
  const decrementQuantity = () => handleQuantityChange(quantity - 1)

  return (
    <div className="space-y-6">
      {/* Quantity Selector */}
      <div>
        <label className="block text-sm font-semibold text-neutral-700 mb-2">
          Quantity
        </label>
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={decrementQuantity}
            disabled={quantity <= 1}
            className="w-10 h-10 rounded-lg border-2 border-gray-300 flex items-center justify-center text-lg font-semibold hover:border-accent-coral-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            −
          </button>
          
          <input
            type="number"
            min="1"
            max="10000"
            value={quantity}
            onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
            className="w-20 text-center border-2 border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
          />
          
          <button
            type="button"
            onClick={incrementQuantity}
            className="w-10 h-10 rounded-lg border-2 border-gray-300 flex items-center justify-center text-lg font-semibold hover:border-accent-lime-500 transition-colors duration-200"
          >
            +
          </button>
        </div>
      </div>

      {/* Current Pricing */}
      <div className="bg-background-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-secondary-600">Price per unit</span>
          <span className="font-semibold text-lg">${priceData.pricePerUnit.toFixed(2)}</span>
        </div>
        
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-secondary-600">Quantity</span>
          <span className="font-semibold">{quantity}</span>
        </div>
        
        <div className="border-t border-gray-200 pt-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-lg text-neutral-700">Total</span>
            <span className="font-bold text-2xl text-primary-600">
              ${priceData.totalPrice.toFixed(2)}
            </span>
          </div>
          
          {priceData.discountPercentage > 0 && (
            <div className="text-center mt-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                {priceData.discountPercentage}% discount applied!
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Pricing Tiers Breakdown */}
      <div>
        <h4 className="font-semibold text-sm text-neutral-700 mb-3">Volume Pricing</h4>
        <div className="space-y-2">
          {pricingTiers.map((tier) => {
            const isCurrentTier = quantity >= tier.min_quantity && 
                                 (tier.max_quantity === null || quantity <= tier.max_quantity)
            
            return (
              <div
                key={tier.id}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${
                  isCurrentTier 
                    ? 'border-accent-lime-500 bg-accent-lime-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {isCurrentTier && (
                    <div className="w-3 h-3 bg-accent-lime-500 rounded-full"></div>
                  )}
                  <span className={`text-sm ${isCurrentTier ? 'font-semibold' : ''}`}>
                    {tier.min_quantity}
                    {tier.max_quantity ? `-${tier.max_quantity}` : '+'} units
                  </span>
                </div>
                
                <div className="text-right">
                  <span className={`font-semibold ${isCurrentTier ? 'text-accent-lime-600' : 'text-neutral-700'}`}>
                    ${tier.price_per_unit.toFixed(2)}
                  </span>
                  {tier.discount_percentage > 0 && (
                    <div className="text-xs text-secondary-600">
                      Save {tier.discount_percentage}%
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Bulk Order Notice */}
      {quantity >= 100 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="text-blue-600">ℹ️</div>
            <div>
              <p className="text-sm font-semibold text-blue-800">Large Order Notice</p>
              <p className="text-xs text-blue-600">
                Orders of 100+ items will be reviewed for stock availability before processing.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
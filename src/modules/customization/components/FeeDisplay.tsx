'use client'

import type { DesignLayer, CustomizationPricing } from '../types'
import { calculateFees } from '../utils/pricing'

interface FeeDisplayProps {
  layers: DesignLayer[]
  pricing: CustomizationPricing
  baseProductPrice: number
}

export function FeeDisplay({ layers, pricing, baseProductPrice }: FeeDisplayProps) {
  const fees = calculateFees(layers, pricing)

  if (fees.totalFee === 0 && layers.length === 0) return null

  return (
    <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-sm">
      <div className="flex justify-between text-gray-600">
        <span>Product base price</span>
        <span>${baseProductPrice.toFixed(2)}</span>
      </div>
      {fees.baseFee > 0 && (
        <div className="flex justify-between text-gray-600">
          <span>Customization fee</span>
          <span>+${fees.baseFee.toFixed(2)}</span>
        </div>
      )}
      {fees.textFees > 0 && (
        <div className="flex justify-between text-gray-600">
          <span>Text ({fees.textCount}×)</span>
          <span>+${fees.textFees.toFixed(2)}</span>
        </div>
      )}
      {fees.imageFees > 0 && (
        <div className="flex justify-between text-gray-600">
          <span>Images ({fees.imageCount}×)</span>
          <span>+${fees.imageFees.toFixed(2)}</span>
        </div>
      )}
      {(fees.totalFee > 0 || layers.length > 0) && (
        <div className="flex justify-between font-semibold text-gray-900 pt-1 border-t border-gray-200">
          <span>Total per unit</span>
          <span>${(baseProductPrice + fees.totalFee).toFixed(2)}</span>
        </div>
      )}
    </div>
  )
}

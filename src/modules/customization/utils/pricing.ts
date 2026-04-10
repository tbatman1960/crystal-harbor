import type { DesignLayer, CustomizationPricing } from '../types'

export interface FeeBreakdown {
  baseFee: number
  textFees: number
  imageFees: number
  totalFee: number
  textCount: number
  imageCount: number
}

/** Calculate customization fees from layers and pricing config */
export function calculateFees(layers: DesignLayer[], pricing: CustomizationPricing): FeeBreakdown {
  const textCount = layers.filter(l => l.type === 'text').length
  const imageCount = layers.filter(l => l.type === 'image' || l.type === 'catalog-design').length

  const baseFee = layers.length > 0 ? pricing.baseFee : 0
  const textFees = textCount * pricing.perTextElementFee
  const imageFees = imageCount * pricing.perImageFee
  const totalFee = baseFee + textFees + imageFees

  return { baseFee, textFees, imageFees, totalFee, textCount, imageCount }
}

/** Format a dollar amount */
export function formatPrice(amount: number): string {
  return amount === 0 ? 'Free' : `$${amount.toFixed(2)}`
}

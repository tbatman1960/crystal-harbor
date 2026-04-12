'use client'

import { useState } from 'react'
import { SparklesIcon, ArrowPathIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import type { CustomizationPricing } from '../types'

interface StyleTransferModalProps {
  imageUrl: string
  pricing: CustomizationPricing
  maxGenerations: number
  currentGenerations: number
  onApplyStyle: (sourceImageUrl: string, styleName: string, resultImageUrl: string, transferId: string) => void
  onCancel: () => void
}

const ARTISTIC_STYLES = [
  { 
    name: 'Watercolor', 
    description: 'Soft, flowing watercolor painting effect',
    example: '🎨'
  },
  { 
    name: 'Oil painting', 
    description: 'Classic oil painting with rich textures',
    example: '🖼️'
  },
  { 
    name: 'Cartoon', 
    description: 'Bright, colorful cartoon style',
    example: '📺'
  },
  { 
    name: 'Pop art', 
    description: 'Bold colors and high contrast',
    example: '🎭'
  },
  { 
    name: 'Pencil sketch', 
    description: 'Detailed pencil drawing effect',
    example: '✏️'
  },
  { 
    name: 'Abstract', 
    description: 'Artistic abstract interpretation',
    example: '🌀'
  },
  { 
    name: 'Vintage/retro', 
    description: 'Nostalgic vintage aesthetic',
    example: '📼'
  }
]

interface StyleTransferResult {
  sourceImageUrl: string
  styleName: string
  resultImageUrl: string
  transferId: string
}

export function StyleTransferModal({
  imageUrl,
  pricing,
  maxGenerations,
  currentGenerations,
  onApplyStyle,
  onCancel
}: StyleTransferModalProps) {
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null)
  const [isTransferring, setIsTransferring] = useState(false)
  const [showFeeConfirmation, setShowFeeConfirmation] = useState(false)
  const [transferResult, setTransferResult] = useState<StyleTransferResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const remainingGenerations = maxGenerations - currentGenerations
  const canTransfer = remainingGenerations > 0 && selectedStyle && !isTransferring

  const handleStartTransfer = async () => {
    if (!selectedStyle || !canTransfer) return

    if (pricing.styleTransferFee > 0 && !showFeeConfirmation) {
      setShowFeeConfirmation(true)
      return
    }

    setShowFeeConfirmation(false)
    setIsTransferring(true)
    setError(null)

    try {
      const response = await fetch('/api/customization/style-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl,
          styleName: selectedStyle
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to apply style transfer')
      }

      if (result.success && result.imageUrl) {
        setTransferResult({
          sourceImageUrl: imageUrl,
          styleName: selectedStyle,
          resultImageUrl: result.imageUrl,
          transferId: result.transferId
        })
      } else {
        throw new Error('No styled image received')
      }
    } catch (error) {
      console.error('Style transfer error:', error)
      setError(error instanceof Error ? error.message : 'Failed to apply style transfer')
    } finally {
      setIsTransferring(false)
    }
  }

  const handleAcceptStyled = () => {
    if (transferResult) {
      onApplyStyle(
        transferResult.sourceImageUrl,
        transferResult.styleName,
        transferResult.resultImageUrl,
        transferResult.transferId
      )
    }
  }

  const handleTryDifferentStyle = () => {
    setTransferResult(null)
    setError(null)
    setSelectedStyle(null)
  }

  const handleKeepOriginal = () => {
    onCancel()
  }

  if (showFeeConfirmation) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <SparklesIcon className="w-5 h-5 text-purple-600" />
          <h3 className="font-medium text-gray-800">Style Transfer Fee</h3>
        </div>
        
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            <p>Applying <strong>{selectedStyle}</strong> style will add ${pricing.styleTransferFee.toFixed(2)} to your order.</p>
            <p className="mt-2 text-xs text-gray-500">
              You have {remainingGenerations} AI operations remaining in this session.
            </p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleStartTransfer}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
            >
              Apply Style (${pricing.styleTransferFee.toFixed(2)})
            </button>
            <button
              onClick={() => setShowFeeConfirmation(false)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
        <div className="text-center space-y-4">
          <div className="text-red-600">
            <XMarkIcon className="w-8 h-8 mx-auto mb-2" />
            <h3 className="font-medium">Style Transfer Failed</h3>
          </div>
          
          <p className="text-sm text-gray-600">{error}</p>
          
          <div className="flex gap-2">
            <button
              onClick={handleStartTransfer}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
            >
              Try Again
            </button>
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (isTransferring) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
        <div className="text-center space-y-4">
          <ArrowPathIcon className="w-8 h-8 mx-auto text-purple-600 animate-spin" />
          <div>
            <h3 className="font-medium text-gray-800">Applying Style</h3>
            <p className="text-sm text-gray-600 mt-1">
              Transforming your image with <strong>{selectedStyle}</strong> style
            </p>
          </div>
          <div className="text-xs text-gray-500">
            This may take a few moments...
          </div>
        </div>
      </div>
    )
  }

  if (transferResult) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="font-medium text-gray-800 mb-2">Style Transfer Complete</h3>
            <p className="text-sm text-gray-600">
              <strong>{transferResult.styleName}</strong> style has been applied to your image
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700 text-center">Original</h4>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <img
                  src={transferResult.sourceImageUrl}
                  alt="Original image"
                  className="w-full h-48 object-contain bg-gray-50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700 text-center">{transferResult.styleName} Style</h4>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <img
                  src={transferResult.resultImageUrl}
                  alt={`${transferResult.styleName} styled image`}
                  className="w-full h-48 object-contain bg-gray-50"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleAcceptStyled}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 flex items-center justify-center gap-2"
            >
              <CheckIcon className="w-4 h-4" />
              Use Styled Version
            </button>
            <button
              onClick={handleKeepOriginal}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
            >
              Keep Original
            </button>
            <button
              onClick={handleTryDifferentStyle}
              className="px-4 py-2 border border-purple-300 text-purple-600 rounded-lg text-sm hover:bg-purple-50"
            >
              Try Different Style
            </button>
          </div>

          <div className="text-xs text-gray-500 text-center bg-gray-50 p-2 rounded">
            💡 Styled images add artistic flair to your design
          </div>
        </div>
      </div>
    )
  }

  // Initial state - style selection
  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="space-y-4">
        <div className="text-center">
          <SparklesIcon className="w-8 h-8 mx-auto text-purple-600 mb-2" />
          <h3 className="font-medium text-gray-800">Apply Artistic Style</h3>
          <p className="text-sm text-gray-600 mt-1">
            Choose an artistic style to transform your image
          </p>
        </div>

        {/* Generation limit warning */}
        {remainingGenerations <= 2 && remainingGenerations > 0 && (
          <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg text-center">
            ⚠️ You have {remainingGenerations} AI operation{remainingGenerations === 1 ? '' : 's'} remaining.
          </div>
        )}

        {remainingGenerations === 0 && (
          <div className="text-xs text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-lg text-center">
            🚫 You've reached your AI generation limit for this session.
          </div>
        )}

        {/* Original image preview */}
        <div className="text-center">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Original Image</h4>
          <div className="inline-block border border-gray-200 rounded-lg overflow-hidden">
            <img
              src={imageUrl}
              alt="Original image"
              className="h-32 object-contain bg-gray-50"
            />
          </div>
        </div>

        {/* Style selection grid */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Choose Artistic Style:</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {ARTISTIC_STYLES.map((style) => (
              <button
                key={style.name}
                onClick={() => setSelectedStyle(style.name)}
                disabled={remainingGenerations === 0}
                className={`p-3 text-left rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  selectedStyle === style.name
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{style.example}</span>
                  <div>
                    <div className="font-medium text-sm">{style.name}</div>
                    <div className="text-xs text-gray-500">{style.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleStartTransfer}
            disabled={!canTransfer || remainingGenerations === 0}
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <SparklesIcon className="w-4 h-4" />
            Apply Style
            {pricing.styleTransferFee > 0 && (
              <span className="text-xs opacity-80">
                (+${pricing.styleTransferFee.toFixed(2)})
              </span>
            )}
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
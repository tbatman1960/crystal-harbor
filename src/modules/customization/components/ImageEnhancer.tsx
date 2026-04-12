'use client'

import { useState } from 'react'
import { ArrowPathIcon, SparklesIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import type { CustomizationPricing } from '../types'

interface ImageEnhancerProps {
  imageUrl: string
  originalWidth: number
  originalHeight: number
  currentDPI: number
  pricing: CustomizationPricing
  onEnhanced: (enhancedImageUrl: string, upscaleId: string) => void
  onCancel: () => void
}

interface EnhancementResult {
  originalUrl: string
  enhancedUrl: string
  upscaleId: string
}

export function ImageEnhancer({
  imageUrl,
  originalWidth,
  originalHeight,
  currentDPI,
  pricing,
  onEnhanced,
  onCancel
}: ImageEnhancerProps) {
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [showFeeConfirmation, setShowFeeConfirmation] = useState(false)
  const [enhancementResult, setEnhancementResult] = useState<EnhancementResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const targetDPI = 300
  const scaleFactor = targetDPI / currentDPI
  const targetWidth = Math.round(originalWidth * scaleFactor)
  const targetHeight = Math.round(originalHeight * scaleFactor)

  const handleStartEnhancement = async () => {
    if (pricing.aiUpscalingFee > 0 && !showFeeConfirmation) {
      setShowFeeConfirmation(true)
      return
    }

    setShowFeeConfirmation(false)
    setIsEnhancing(true)
    setError(null)

    try {
      const response = await fetch('/api/customization/upscale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl,
          targetWidth,
          targetHeight,
          originalWidth,
          originalHeight
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to enhance image')
      }

      if (result.success && result.imageUrl) {
        setEnhancementResult({
          originalUrl: imageUrl,
          enhancedUrl: result.imageUrl,
          upscaleId: result.upscaleId
        })
      } else {
        throw new Error('No enhanced image received')
      }
    } catch (error) {
      console.error('Enhancement error:', error)
      setError(error instanceof Error ? error.message : 'Failed to enhance image')
    } finally {
      setIsEnhancing(false)
    }
  }

  const handleAcceptEnhanced = () => {
    if (enhancementResult) {
      onEnhanced(enhancementResult.enhancedUrl, enhancementResult.upscaleId)
    }
  }

  const handleKeepOriginal = () => {
    onCancel()
  }

  const handleTryDifferent = () => {
    setEnhancementResult(null)
    setError(null)
  }

  if (showFeeConfirmation) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <SparklesIcon className="w-5 h-5 text-blue-600" />
          <h3 className="font-medium text-gray-800">Image Enhancement Fee</h3>
        </div>
        
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            <p>We'll enhance your image from {currentDPI} DPI to {targetDPI} DPI for crisp printing.</p>
            <p className="mt-2 font-medium">Enhancement fee: ${pricing.aiUpscalingFee.toFixed(2)}</p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleStartEnhancement}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Enhance (${pricing.aiUpscalingFee.toFixed(2)})
            </button>
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
            >
              Skip Enhancement
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
            <h3 className="font-medium">Enhancement Failed</h3>
          </div>
          
          <p className="text-sm text-gray-600">{error}</p>
          
          <div className="flex gap-2">
            <button
              onClick={handleStartEnhancement}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
            >
              Try Again
            </button>
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
            >
              Keep Original
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (isEnhancing) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
        <div className="text-center space-y-4">
          <ArrowPathIcon className="w-8 h-8 mx-auto text-blue-600 animate-spin" />
          <div>
            <h3 className="font-medium text-gray-800">Enhancing Image</h3>
            <p className="text-sm text-gray-600 mt-1">
              Upscaling from {originalWidth}×{originalHeight} to {targetWidth}×{targetHeight}
            </p>
          </div>
          <div className="text-xs text-gray-500">
            This may take a few moments...
          </div>
        </div>
      </div>
    )
  }

  if (enhancementResult) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="font-medium text-gray-800 mb-2">Enhancement Complete</h3>
            <p className="text-sm text-gray-600">
              Compare the original and enhanced versions below
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700 text-center">Original ({currentDPI} DPI)</h4>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <img
                  src={enhancementResult.originalUrl}
                  alt="Original image"
                  className="w-full h-48 object-contain bg-gray-50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700 text-center">Enhanced ({targetDPI} DPI)</h4>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <img
                  src={enhancementResult.enhancedUrl}
                  alt="Enhanced image"
                  className="w-full h-48 object-contain bg-gray-50"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleAcceptEnhanced}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 flex items-center justify-center gap-2"
            >
              <CheckIcon className="w-4 h-4" />
              Use Enhanced Version
            </button>
            <button
              onClick={handleKeepOriginal}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
            >
              Keep Original
            </button>
            <button
              onClick={handleTryDifferent}
              className="px-4 py-2 border border-blue-300 text-blue-600 rounded-lg text-sm hover:bg-blue-50"
            >
              Try Again
            </button>
          </div>

          <div className="text-xs text-gray-500 text-center bg-gray-50 p-2 rounded">
            💡 Enhanced images provide sharper, more detailed prints at larger sizes
          </div>
        </div>
      </div>
    )
  }

  // Initial state - show enhancement option
  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="space-y-4">
        <div className="text-center">
          <SparklesIcon className="w-8 h-8 mx-auto text-blue-600 mb-2" />
          <h3 className="font-medium text-gray-800">Enhance Image Quality</h3>
        </div>

        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Current resolution:</span>
            <span className="font-medium">{originalWidth}×{originalHeight} ({currentDPI} DPI)</span>
          </div>
          <div className="flex justify-between">
            <span>Enhanced resolution:</span>
            <span className="font-medium text-green-600">{targetWidth}×{targetHeight} ({targetDPI} DPI)</span>
          </div>
          <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
            ⚠️ Current resolution may not print clearly at larger sizes
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleStartEnhancement}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center justify-center gap-2"
          >
            <SparklesIcon className="w-4 h-4" />
            Enhance Image
            {pricing.aiUpscalingFee > 0 && (
              <span className="text-xs opacity-80">
                (+${pricing.aiUpscalingFee.toFixed(2)})
              </span>
            )}
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  )
}
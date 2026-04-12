'use client'

import { useState } from 'react'
import { SparklesIcon, ArrowPathIcon, XMarkIcon } from '@heroicons/react/24/outline'
import type { CustomizationPricing } from '../types'

interface AIGenerationToolbarProps {
  pricing: CustomizationPricing
  maxGenerations: number
  currentGenerations: number
  onGenerate: (prompt: string, options?: { style?: string }) => void
  onGenerationComplete: (imageUrl: string, prompt: string, generationId: string) => void
}

const EXAMPLE_PROMPTS = [
  "A golden retriever wearing a party hat",
  "Beautiful sunset over mountains",
  "Colorful geometric abstract pattern",
  "Vintage coffee shop illustration",
  "Cute cartoon cat with big eyes",
  "Space scene with planets and stars",
  "Hand-drawn floral border design",
  "Retro 80s neon cityscape"
]

const AI_STYLES = [
  { value: 'realistic', label: 'Realistic' },
  { value: 'cartoon', label: 'Cartoon' },
  { value: 'watercolor', label: 'Watercolor' },
  { value: 'vintage', label: 'Vintage' },
  { value: 'minimalist', label: 'Minimalist' },
  { value: 'abstract', label: 'Abstract' }
]

interface GeneratedImage {
  imageUrl: string
  prompt: string
  generationId: string
  timestamp: number
}

export function AIGenerationToolbar({
  pricing,
  maxGenerations,
  currentGenerations,
  onGenerate,
  onGenerationComplete
}: AIGenerationToolbarProps) {
  const [prompt, setPrompt] = useState('')
  const [selectedStyle, setSelectedStyle] = useState('realistic')
  const [isGenerating, setIsGenerating] = useState(false)
  const [sessionImages, setSessionImages] = useState<GeneratedImage[]>([])
  const [showFeeConfirmation, setShowFeeConfirmation] = useState(false)

  const remainingGenerations = maxGenerations - currentGenerations
  const canGenerate = remainingGenerations > 0 && prompt.trim().length > 0 && !isGenerating

  const handleGenerate = async () => {
    if (!canGenerate) return

    if (pricing.aiGenerationFee > 0 && !showFeeConfirmation) {
      setShowFeeConfirmation(true)
      return
    }

    setShowFeeConfirmation(false)
    setIsGenerating(true)

    try {
      const response = await fetch('/api/customization/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          style: selectedStyle,
          width: 512,
          height: 512
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate image')
      }

      if (result.success && result.imageUrl) {
        const newImage: GeneratedImage = {
          imageUrl: result.imageUrl,
          prompt: prompt.trim(),
          generationId: result.generationId,
          timestamp: Date.now()
        }
        
        setSessionImages(prev => [newImage, ...prev])
        onGenerationComplete(result.imageUrl, prompt.trim(), result.generationId)
      } else {
        throw new Error('No image generated')
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to generate image')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleUseExample = (examplePrompt: string) => {
    setPrompt(examplePrompt)
  }

  const handleAddToCanvas = (image: GeneratedImage) => {
    onGenerationComplete(image.imageUrl, image.prompt, image.generationId)
  }

  if (showFeeConfirmation) {
    return (
      <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-2">
          <SparklesIcon className="w-5 h-5 text-blue-600" />
          <h3 className="font-medium text-blue-800">AI Generation Fee</h3>
        </div>
        <p className="text-sm text-blue-700">
          Generating this image will add ${pricing.aiGenerationFee.toFixed(2)} to your order.
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleGenerate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            Continue (${pricing.aiGenerationFee.toFixed(2)})
          </button>
          <button
            onClick={() => setShowFeeConfirmation(false)}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <SparklesIcon className="w-5 h-5 text-purple-600" />
        <h3 className="font-medium text-gray-800">AI Image Generation</h3>
        <div className="ml-auto text-xs text-gray-500">
          {remainingGenerations} of {maxGenerations} remaining
        </div>
      </div>

      {/* Generation limit warning */}
      {remainingGenerations <= 2 && remainingGenerations > 0 && (
        <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
          ⚠️ You have {remainingGenerations} AI generation{remainingGenerations === 1 ? '' : 's'} remaining.
        </div>
      )}

      {remainingGenerations === 0 && (
        <div className="text-xs text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
          🚫 You've reached your AI generation limit for this session.
        </div>
      )}

      {/* Prompt input */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Describe the image you want
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="A cute golden retriever wearing a party hat..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
          rows={3}
          maxLength={500}
          disabled={isGenerating || remainingGenerations === 0}
        />
        <div className="text-xs text-gray-500">
          {prompt.length}/500 characters
        </div>
      </div>

      {/* Style selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Style</label>
        <select
          value={selectedStyle}
          onChange={(e) => setSelectedStyle(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          disabled={isGenerating || remainingGenerations === 0}
        >
          {AI_STYLES.map(style => (
            <option key={style.value} value={style.value}>
              {style.label}
            </option>
          ))}
        </select>
      </div>

      {/* Example prompts */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Quick ideas:</label>
        <div className="grid grid-cols-2 gap-1 text-xs">
          {EXAMPLE_PROMPTS.map((example, index) => (
            <button
              key={index}
              onClick={() => handleUseExample(example)}
              className="px-2 py-1 text-left text-blue-600 hover:bg-blue-50 rounded border border-blue-200 truncate"
              disabled={isGenerating || remainingGenerations === 0}
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={!canGenerate || remainingGenerations === 0}
        className="w-full py-2.5 bg-purple-600 text-white rounded-lg font-medium text-sm hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {isGenerating ? (
          <>
            <ArrowPathIcon className="w-4 h-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <SparklesIcon className="w-4 h-4" />
            Generate Image
            {pricing.aiGenerationFee > 0 && (
              <span className="text-xs opacity-80">
                (+${pricing.aiGenerationFee.toFixed(2)})
              </span>
            )}
          </>
        )}
      </button>

      {/* Session gallery */}
      {sessionImages.length > 0 && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Session Gallery ({sessionImages.length})
          </label>
          <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
            {sessionImages.map((image, index) => (
              <div
                key={image.generationId}
                className="relative border border-gray-200 rounded-lg overflow-hidden group"
              >
                <img
                  src={image.imageUrl}
                  alt={image.prompt}
                  className="w-full h-16 object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-200 flex items-center justify-center">
                  <button
                    onClick={() => handleAddToCanvas(image)}
                    className="px-2 py-1 bg-white text-gray-800 rounded text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Use Again
                  </button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-1">
                  <div className="text-white text-xs truncate">
                    {image.prompt}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image ownership notice */}
      <div className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
        💡 Generated images become part of your design. You own the rights to use them on your customized products.
      </div>
    </div>
  )
}
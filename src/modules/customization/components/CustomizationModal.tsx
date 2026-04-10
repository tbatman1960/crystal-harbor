'use client'

import { useEffect } from 'react'
import { useCustomizationConfig } from '../hooks/useCustomizationConfig'
import { CustomizationEditor } from './CustomizationEditor'
import type { DesignSpecification } from '../types'

interface CustomizationModalProps {
  productId: string
  productName: string
  basePrice: number
  isOpen: boolean
  onClose: () => void
  onAddToCart: (spec: DesignSpecification) => void
}

export function CustomizationModal({
  productId,
  productName,
  basePrice,
  isOpen,
  onClose,
  onAddToCart,
}: CustomizationModalProps) {
  const { config, catalogDesigns, permissions, loading, error } = useCustomizationConfig(productId)

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal content */}
      <div className="relative bg-white rounded-xl shadow-2xl w-[95vw] max-w-[1200px] max-h-[90vh] overflow-y-auto p-6">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 text-lg z-10"
        >
          ✕
        </button>

        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-gray-500">Loading customization tools...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">{error}</p>
            <button onClick={onClose} className="btn-secondary">Go Back</button>
          </div>
        )}

        {!loading && !error && config && permissions && (
          <CustomizationEditor
            productId={productId}
            productName={productName}
            basePrice={basePrice}
            config={config}
            catalogDesigns={catalogDesigns}
            allowText={permissions.allowText}
            allowImageUpload={permissions.allowImageUpload}
            allowCatalogDesigns={permissions.allowCatalogDesigns}
            allowAiGeneration={permissions.allowAiGeneration}
            allowStyleTransfer={permissions.allowStyleTransfer}
            onAddToCart={onAddToCart}
            onCancel={onClose}
          />
        )}
      </div>
    </div>
  )
}

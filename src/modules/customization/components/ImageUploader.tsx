'use client'

import { useRef, useState } from 'react'
import type { CustomizationPricing, PhysicalDimensions } from '../types'
import { getImageDimensions, effectiveDpi, classifyImageQuality, qualityLabel } from '../utils/resolution'

interface ImageUploaderProps {
  pricing: CustomizationPricing
  physicalDimensions: PhysicalDimensions
  onAddImage: (dataUrl: string, filename: string, width: number, height: number) => void
}

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml', 'application/pdf']
const MAX_SIZE_MB = 50

export function ImageUploader({ pricing, physicalDimensions, onAddImage }: ImageUploaderProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<{
    dataUrl: string
    filename: string
    width: number
    height: number
    quality: ReturnType<typeof classifyImageQuality>
    dpi: number
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const handleFile = async (file: File) => {
    setError(null)
    setPreview(null)

    // Validate type
    if (!ACCEPTED_TYPES.includes(file.type) && !file.name.match(/\.(png|jpe?g|svg|pdf)$/i)) {
      setError('Accepted formats: PNG, JPG, SVG, PDF')
      return
    }

    // Validate size
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File too large. Maximum size is ${MAX_SIZE_MB}MB.`)
      return
    }

    setUploading(true)

    try {
      // Get dimensions (skip for SVG/PDF)
      let width = 0, height = 0
      if (file.type.startsWith('image/') && file.type !== 'image/svg+xml') {
        const dims = await getImageDimensions(file)
        width = dims.width
        height = dims.height
      }

      // Read as data URL
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      // Calculate DPI quality
      let quality: ReturnType<typeof classifyImageQuality> = 'excellent'
      let dpi = 300
      if (width > 0 && height > 0) {
        const result = effectiveDpi(width, height, physicalDimensions.widthInches, physicalDimensions.heightInches)
        dpi = result.minDpi
        quality = classifyImageQuality(dpi)
      }

      setPreview({ dataUrl, filename: file.name, width, height, quality, dpi })
    } catch (err) {
      setError('Failed to process image')
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  const handleConfirm = () => {
    if (!preview) return
    onAddImage(preview.dataUrl, preview.filename, preview.width, preview.height)
    setPreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleCancel = () => {
    setPreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const ql = preview ? qualityLabel(preview.quality) : null

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
        📷 Upload Image
        {pricing.perImageFee > 0 && (
          <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
            +${pricing.perImageFee.toFixed(2)}/image
          </span>
        )}
      </h4>

      <input
        ref={fileRef}
        type="file"
        accept=".png,.jpg,.jpeg,.svg,.pdf"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
        className="hidden"
      />

      {!preview && (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="w-full py-6 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors flex flex-col items-center gap-1"
        >
          <span className="text-2xl">📁</span>
          <span>{uploading ? 'Processing...' : 'Click to upload image'}</span>
          <span className="text-xs text-gray-400">PNG, JPG, SVG, PDF — max {MAX_SIZE_MB}MB</span>
        </button>
      )}

      {error && (
        <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
          {error}
        </div>
      )}

      {preview && (
        <div className="border border-gray-200 rounded-lg p-3 space-y-2">
          <div className="flex items-start gap-3">
            <img
              src={preview.dataUrl}
              alt="Preview"
              className="w-16 h-16 object-cover rounded border"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{preview.filename}</p>
              {preview.width > 0 && (
                <p className="text-xs text-gray-500">{preview.width} × {preview.height}px</p>
              )}
              {ql && (
                <p className="text-xs font-medium mt-1" style={{ color: ql.color }}>
                  {ql.text} ({preview.dpi} DPI)
                </p>
              )}
            </div>
          </div>

          {preview.quality === 'too-low' && (
            <div className="text-xs text-red-600 bg-red-50 px-2 py-1.5 rounded">
              ⚠️ This image is too low resolution for quality printing. Consider using a higher-resolution version.
            </div>
          )}
          {preview.quality === 'low' && (
            <div className="text-xs text-orange-600 bg-orange-50 px-2 py-1.5 rounded">
              ⚠️ This image may appear blurry when printed at full size. It will still work but results may vary.
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleConfirm}
              className="flex-1 py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700"
            >
              Add to Design
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

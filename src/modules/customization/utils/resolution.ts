import type { PhysicalDimensions } from '../types'

/** Calculate required pixels for 300 DPI print at given physical size */
export function requiredPixels(dimensions: PhysicalDimensions, dpi = 300) {
  return {
    width: Math.ceil(dimensions.widthInches * dpi),
    height: Math.ceil(dimensions.heightInches * dpi),
  }
}

/** Calculate effective DPI of an image placed at a physical size */
export function effectiveDpi(
  imageWidthPx: number,
  imageHeightPx: number,
  physicalWidthInches: number,
  physicalHeightInches: number,
  scalePercent = 100  // how much of the printable area the image covers
): { widthDpi: number; heightDpi: number; minDpi: number } {
  const scale = scalePercent / 100
  const effectivePhysicalW = physicalWidthInches * scale
  const effectivePhysicalH = physicalHeightInches * scale

  const widthDpi = effectivePhysicalW > 0 ? imageWidthPx / effectivePhysicalW : 0
  const heightDpi = effectivePhysicalH > 0 ? imageHeightPx / effectivePhysicalH : 0

  return {
    widthDpi: Math.round(widthDpi),
    heightDpi: Math.round(heightDpi),
    minDpi: Math.min(Math.round(widthDpi), Math.round(heightDpi)),
  }
}

export type ImageQuality = 'excellent' | 'good' | 'acceptable' | 'low' | 'too-low'

/** Classify image quality based on effective DPI */
export function classifyImageQuality(dpi: number): ImageQuality {
  if (dpi >= 300) return 'excellent'
  if (dpi >= 200) return 'good'
  if (dpi >= 150) return 'acceptable'
  if (dpi >= 100) return 'low'
  return 'too-low'
}

/** Human-readable quality label with color */
export function qualityLabel(quality: ImageQuality): { text: string; color: string } {
  switch (quality) {
    case 'excellent': return { text: 'Excellent quality (300+ DPI)', color: '#22c55e' }
    case 'good': return { text: 'Good quality (200+ DPI)', color: '#84cc16' }
    case 'acceptable': return { text: 'Acceptable quality (150+ DPI)', color: '#eab308' }
    case 'low': return { text: 'Low quality — may appear blurry', color: '#f97316' }
    case 'too-low': return { text: 'Quality too low for printing', color: '#ef4444' }
  }
}

/** Get image dimensions from a File */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
      URL.revokeObjectURL(img.src)
    }
    img.onerror = () => {
      reject(new Error('Failed to load image'))
      URL.revokeObjectURL(img.src)
    }
    img.src = URL.createObjectURL(file)
  })
}

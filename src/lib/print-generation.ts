/**
 * Print-Ready File Generation Utilities
 * Generates high-resolution print files from DesignSpecification data
 */

import type { DesignSpecification } from '@/modules/customization'
import { supabaseAdmin } from './supabase'

export interface PrintConfig {
  dpi: number
  outputFormat: 'png' | 'jpg'
  colorProfile: 'sRGB' | 'CMYK'
  transparentBackground: boolean
}

export interface PrintDimensions {
  widthInches: number
  heightInches: number
  widthPixels: number
  heightPixels: number
}

export interface GeneratePrintFileOptions {
  designSpec: DesignSpecification
  productTemplate: {
    imageUrl: string
    printableArea: { x: number; y: number; width: number; height: number }
    physicalDimensions: { widthInches: number; heightInches: number }
  }
  config?: Partial<PrintConfig>
  orderNumber: string
  itemIndex: number
}

export interface PrintFileResult {
  success: boolean
  printFileUrl?: string
  localDataUrl?: string
  error?: string
}

/**
 * Default print configuration
 */
export const DEFAULT_PRINT_CONFIG: PrintConfig = {
  dpi: 300,
  outputFormat: 'png',
  colorProfile: 'sRGB',
  transparentBackground: true
}

/**
 * Calculate pixel dimensions from physical dimensions and DPI
 */
export function calculatePrintDimensions(
  widthInches: number,
  heightInches: number,
  dpi: number = 300
): PrintDimensions {
  return {
    widthInches,
    heightInches,
    widthPixels: Math.round(widthInches * dpi),
    heightPixels: Math.round(heightInches * dpi)
  }
}

/**
 * Generate print-ready file from design specification (client-side)
 * This function runs in the browser and generates a high-resolution canvas
 */
export async function generatePrintFile({
  designSpec,
  productTemplate,
  config = {},
  orderNumber,
  itemIndex
}: GeneratePrintFileOptions): Promise<PrintFileResult> {
  try {
    const printConfig = { ...DEFAULT_PRINT_CONFIG, ...config }
    
    // Calculate print dimensions
    const dimensions = calculatePrintDimensions(
      productTemplate.physicalDimensions.widthInches,
      productTemplate.physicalDimensions.heightInches,
      printConfig.dpi
    )

    // Create offscreen canvas at full resolution
    const canvas = new OffscreenCanvas(dimensions.widthPixels, dimensions.heightPixels)
    const ctx = canvas.getContext('2d')
    
    if (!ctx) {
      throw new Error('Unable to create canvas context')
    }

    // Set high-quality rendering
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    // Clear canvas with transparent or white background
    if (!printConfig.transparentBackground) {
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, dimensions.widthPixels, dimensions.heightPixels)
    }

    // Load product template if needed
    if (productTemplate.imageUrl && !printConfig.transparentBackground) {
      try {
        const templateImg = await loadImage(productTemplate.imageUrl)
        ctx.drawImage(templateImg, 0, 0, dimensions.widthPixels, dimensions.heightPixels)
      } catch (error) {
        console.warn('Failed to load product template, continuing without:', error)
      }
    }

    // Calculate printable area in pixels
    const printableAreaPixels = {
      x: (productTemplate.printableArea.x / 100) * dimensions.widthPixels,
      y: (productTemplate.printableArea.y / 100) * dimensions.heightPixels,
      width: (productTemplate.printableArea.width / 100) * dimensions.widthPixels,
      height: (productTemplate.printableArea.height / 100) * dimensions.heightPixels
    }

    // Sort layers by order (using zIndex property from BaseLayer)
    const sortedLayers = [...designSpec.layers].sort((a, b) => a.zIndex - b.zIndex)

    // Render each layer
    for (const layer of sortedLayers) {
      // Skip locked or hidden layers (checking if properties exist for compatibility)
      const isVisible = (layer as any).visible !== false
      if (!isVisible) continue

      // Calculate layer position and size in pixels
      const layerPixels = {
        x: printableAreaPixels.x + (layer.x / 100) * printableAreaPixels.width,
        y: printableAreaPixels.y + (layer.y / 100) * printableAreaPixels.height,
        width: (layer.width / 100) * printableAreaPixels.width,
        height: (layer.height / 100) * printableAreaPixels.height
      }

      // Save context for transformations
      ctx.save()

      // Apply rotation if any
      if (layer.rotation && layer.rotation !== 0) {
        const centerX = layerPixels.x + layerPixels.width / 2
        const centerY = layerPixels.y + layerPixels.height / 2
        ctx.translate(centerX, centerY)
        ctx.rotate((layer.rotation * Math.PI) / 180)
        ctx.translate(-centerX, -centerY)
      }

      try {
        switch (layer.type) {
          case 'text':
            await renderTextLayer(ctx, layer, layerPixels, printConfig.dpi)
            break
          case 'image':
            await renderImageLayer(ctx, layer, layerPixels)
            break
          case 'catalog-design':
            await renderCatalogLayer(ctx, layer, layerPixels)
            break
          default:
            console.warn('Unknown layer type:', (layer as any).type)
        }
      } catch (layerError) {
        console.error(`Failed to render layer ${layer.id}:`, layerError)
        // Continue with other layers
      }

      // Restore context
      ctx.restore()
    }

    // Convert canvas to blob
    const blob = await canvas.convertToBlob({
      type: printConfig.outputFormat === 'png' ? 'image/png' : 'image/jpeg',
      quality: printConfig.outputFormat === 'jpg' ? 0.95 : undefined
    })

    // Upload to Supabase Storage
    const fileName = `order-${orderNumber}-print-${itemIndex}.${printConfig.outputFormat}`
    const filePath = `print-files/${fileName}`

    const { data, error } = await supabaseAdmin.storage
      .from('order-files')
      .upload(filePath, blob, {
        contentType: printConfig.outputFormat === 'png' ? 'image/png' : 'image/jpeg',
        upsert: true // Allow overwriting if file exists
      })

    if (error) {
      console.error('Failed to upload print file:', error)
      // Return local data URL as fallback
      const dataUrl = await blobToDataUrl(blob)
      return {
        success: false,
        localDataUrl: dataUrl,
        error: 'Failed to upload to storage, local file generated'
      }
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('order-files')
      .getPublicUrl(filePath)

    return {
      success: true,
      printFileUrl: urlData.publicUrl
    }

  } catch (error) {
    console.error('Print file generation failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Load an image and return a promise that resolves to the image element
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/**
 * Render a text layer to the canvas
 */
async function renderTextLayer(
  ctx: OffscreenCanvasRenderingContext2D,
  layer: any,
  layerPixels: { x: number; y: number; width: number; height: number },
  dpi: number
) {
  const data = layer.data
  
  // Calculate font size for print DPI (scale from canvas size)
  const fontSizePixels = Math.round((data.fontSize / 72) * dpi)
  
  // Set font properties
  let fontStyle = ''
  if (data.bold) fontStyle += 'bold '
  if (data.italic) fontStyle += 'italic '
  
  ctx.font = `${fontStyle}${fontSizePixels}px ${data.fontFamily || 'Arial'}`
  ctx.fillStyle = data.fontColor || '#000000'
  ctx.textBaseline = 'top'

  // Handle text alignment
  let textAlign: CanvasTextAlign = 'left'
  let textX = layerPixels.x
  
  switch (data.alignment) {
    case 'center':
      textAlign = 'center'
      textX = layerPixels.x + layerPixels.width / 2
      break
    case 'right':
      textAlign = 'right'
      textX = layerPixels.x + layerPixels.width
      break
  }
  
  ctx.textAlign = textAlign

  // Split text into lines and render
  const lines = data.text.split('\n')
  const lineHeight = fontSizePixels * 1.2
  
  lines.forEach((line: string, index: number) => {
    const y = layerPixels.y + (index * lineHeight)
    ctx.fillText(line, textX, y)
  })
}

/**
 * Render an image layer to the canvas
 */
async function renderImageLayer(
  ctx: OffscreenCanvasRenderingContext2D,
  layer: any,
  layerPixels: { x: number; y: number; width: number; height: number }
) {
  try {
    const img = await loadImage(layer.data.imageUrl)
    ctx.drawImage(
      img,
      layerPixels.x,
      layerPixels.y,
      layerPixels.width,
      layerPixels.height
    )
  } catch (error) {
    console.error('Failed to load image for layer:', layer.id, error)
    // Draw placeholder rectangle
    ctx.strokeStyle = '#ff0000'
    ctx.strokeRect(layerPixels.x, layerPixels.y, layerPixels.width, layerPixels.height)
  }
}

/**
 * Render a catalog design layer to the canvas
 */
async function renderCatalogLayer(
  ctx: OffscreenCanvasRenderingContext2D,
  layer: any,
  layerPixels: { x: number; y: number; width: number; height: number }
) {
  try {
    const img = await loadImage(layer.data.imageUrl)
    ctx.drawImage(
      img,
      layerPixels.x,
      layerPixels.y,
      layerPixels.width,
      layerPixels.height
    )
  } catch (error) {
    console.error('Failed to load catalog design for layer:', layer.id, error)
    // Draw placeholder rectangle
    ctx.strokeStyle = '#00ff00'
    ctx.strokeRect(layerPixels.x, layerPixels.y, layerPixels.width, layerPixels.height)
  }
}

/**
 * Convert blob to data URL
 */
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * Get print configuration from admin settings
 * This would typically fetch from the database
 */
export async function getPrintConfig(): Promise<PrintConfig> {
  // TODO: Fetch from admin customization settings table
  // For now, return default configuration
  return DEFAULT_PRINT_CONFIG
}

/**
 * Client-side: generate print file and upload via API (post-payment only)
 * Called from order success page after payment is confirmed.
 */
export async function generatePrintFileClient(
  designSpec: DesignSpecification,
  orderNumber: string,
  itemIndex: number,
  productTemplate?: {
    imageUrl: string
    printableArea: { x: number; y: number; width: number; height: number }
    physicalDimensions: { widthInches: number; heightInches: number }
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const template = productTemplate || {
      imageUrl: '',
      printableArea: { x: 10, y: 10, width: 80, height: 80 },
      physicalDimensions: { widthInches: 12, heightInches: 14 },
    }

    const config = DEFAULT_PRINT_CONFIG
    const dimensions = calculatePrintDimensions(
      template.physicalDimensions.widthInches,
      template.physicalDimensions.heightInches,
      config.dpi
    )

    // Create offscreen canvas
    const canvas = new OffscreenCanvas(dimensions.widthPixels, dimensions.heightPixels)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Unable to create canvas context')

    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    if (!config.transparentBackground) {
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, dimensions.widthPixels, dimensions.heightPixels)
    }

    // Calculate printable area in pixels
    const printableAreaPixels = {
      x: (template.printableArea.x / 100) * dimensions.widthPixels,
      y: (template.printableArea.y / 100) * dimensions.heightPixels,
      width: (template.printableArea.width / 100) * dimensions.widthPixels,
      height: (template.printableArea.height / 100) * dimensions.heightPixels,
    }

    // Render layers
    const sortedLayers = [...designSpec.layers].sort((a, b) => a.zIndex - b.zIndex)
    for (const layer of sortedLayers) {
      if ((layer as any).visible === false) continue
      const layerPixels = {
        x: printableAreaPixels.x + (layer.x / 100) * printableAreaPixels.width,
        y: printableAreaPixels.y + (layer.y / 100) * printableAreaPixels.height,
        width: (layer.width / 100) * printableAreaPixels.width,
        height: (layer.height / 100) * printableAreaPixels.height,
      }
      ctx.save()
      if (layer.rotation) {
        const cx = layerPixels.x + layerPixels.width / 2
        const cy = layerPixels.y + layerPixels.height / 2
        ctx.translate(cx, cy)
        ctx.rotate((layer.rotation * Math.PI) / 180)
        ctx.translate(-cx, -cy)
      }
      try {
        if (layer.type === 'text') {
          await renderTextLayer(ctx, layer, layerPixels, config.dpi)
        } else if (layer.type === 'image' || layer.type === 'catalog-design' || layer.type === 'ai-generated' || layer.type === 'style-transfer') {
          await renderImageLayer(ctx, layer, layerPixels)
        }
      } catch (e) {
        console.warn(`Failed to render layer ${layer.id}:`, e)
      }
      ctx.restore()
    }

    // Convert to base64
    const blob = await canvas.convertToBlob({ type: 'image/png' })
    const base64 = await blobToDataUrl(blob)

    // Upload via API (server validates payment before accepting)
    const res = await fetch('/api/orders/generate-print-files', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderNumber,
        itemIndex,
        imageBase64: base64,
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      return { success: false, error: err.error || 'Upload failed' }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Client print generation error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Utility to test print file generation
 */
export async function testPrintGeneration() {
  console.log('Print generation utilities loaded')
  console.log('Default DPI:', DEFAULT_PRINT_CONFIG.dpi)
  console.log('Sample 12x14 inch canvas at 300 DPI:', calculatePrintDimensions(12, 14, 300))
}
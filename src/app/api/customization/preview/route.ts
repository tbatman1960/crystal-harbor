import { NextRequest, NextResponse } from 'next/server'
import { createRealisticPreviewService } from '@/modules/customization/services/realisticPreview'

const SUPPORTED_PRODUCT_TYPES = ['mug', 'shirt', 'poster', 'canvas', 'bag', 'hoodie', 'tank-top']

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    if (!body.designImageUrl || typeof body.designImageUrl !== 'string') {
      return NextResponse.json(
        { error: 'Design image URL is required and must be a string' },
        { status: 400 }
      )
    }
    
    if (!body.productType || typeof body.productType !== 'string') {
      return NextResponse.json(
        { error: 'Product type is required and must be a string' },
        { status: 400 }
      )
    }
    
    if (!body.productColor || typeof body.productColor !== 'string') {
      return NextResponse.json(
        { error: 'Product color is required and must be a string' },
        { status: 400 }
      )
    }
    
    // Validate product type
    if (!SUPPORTED_PRODUCT_TYPES.includes(body.productType.toLowerCase())) {
      return NextResponse.json(
        { 
          error: 'Unsupported product type',
          supportedTypes: SUPPORTED_PRODUCT_TYPES
        },
        { status: 400 }
      )
    }
    
    // Validate data URL format
    if (body.designImageUrl.startsWith('data:')) {
      if (!body.designImageUrl.startsWith('data:image/')) {
        return NextResponse.json(
          { error: 'Invalid design image format' },
          { status: 400 }
        )
      }
    }
    
    // Create service and generate preview
    const service = createRealisticPreviewService()
    
    if (!service.isAvailable()) {
      return NextResponse.json(
        { error: 'Realistic preview service is not available' },
        { status: 503 }
      )
    }
    
    const result = await service.generatePreview(
      body.designImageUrl, 
      body.productType, 
      body.productColor
    )
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to generate realistic preview' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      imageUrl: result.imageUrl,
      previewId: result.previewId,
      productType: body.productType,
      productColor: body.productColor,
      designImageUrl: body.designImageUrl,
      metadata: {
        service: service.isAvailable() ? 'openai' : 'mock',
        timestamp: new Date().toISOString()
      }
    })
    
  } catch (error) {
    console.error('Realistic preview error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to list supported product types
export async function GET() {
  return NextResponse.json({
    supportedProductTypes: SUPPORTED_PRODUCT_TYPES,
    service: createRealisticPreviewService().isAvailable() ? 'openai' : 'mock'
  })
}
import { NextRequest, NextResponse } from 'next/server'
import { createStyleTransferService } from '@/modules/customization/services/styleTransfer'

const SUPPORTED_STYLES = [
  'Watercolor',
  'Oil painting', 
  'Cartoon',
  'Pop art',
  'Pencil sketch',
  'Abstract',
  'Vintage/retro'
]

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    if (!body.imageUrl || typeof body.imageUrl !== 'string') {
      return NextResponse.json(
        { error: 'Image URL is required and must be a string' },
        { status: 400 }
      )
    }
    
    if (!body.styleName || typeof body.styleName !== 'string') {
      return NextResponse.json(
        { error: 'Style name is required and must be a string' },
        { status: 400 }
      )
    }
    
    if (!SUPPORTED_STYLES.includes(body.styleName)) {
      return NextResponse.json(
        { 
          error: 'Unsupported style',
          supportedStyles: SUPPORTED_STYLES
        },
        { status: 400 }
      )
    }
    
    // Validate data URL format
    if (body.imageUrl.startsWith('data:')) {
      if (!body.imageUrl.startsWith('data:image/')) {
        return NextResponse.json(
          { error: 'Invalid image format' },
          { status: 400 }
        )
      }
    }
    
    // Create service and apply style
    const service = createStyleTransferService()
    
    if (!service.isAvailable()) {
      return NextResponse.json(
        { error: 'Style transfer service is not available' },
        { status: 503 }
      )
    }
    
    const result = await service.applyStyle(body.imageUrl, body.styleName)
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to apply style transfer' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      imageUrl: result.imageUrl,
      transferId: result.transferId,
      styleName: body.styleName,
      sourceImageUrl: body.imageUrl,
      metadata: {
        service: service.isAvailable() ? 'openai' : 'mock',
        timestamp: new Date().toISOString()
      }
    })
    
  } catch (error) {
    console.error('Style transfer error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to list supported styles
export async function GET() {
  return NextResponse.json({
    supportedStyles: SUPPORTED_STYLES,
    service: createStyleTransferService().isAvailable() ? 'openai' : 'mock'
  })
}
import { NextRequest, NextResponse } from 'next/server'
import { createImageUpscalingService } from '@/modules/customization/services/imageUpscaling'

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
    
    if (!body.targetWidth || !body.targetHeight) {
      return NextResponse.json(
        { error: 'Target width and height are required' },
        { status: 400 }
      )
    }
    
    const targetWidth = parseInt(body.targetWidth)
    const targetHeight = parseInt(body.targetHeight)
    
    if (isNaN(targetWidth) || isNaN(targetHeight) || targetWidth <= 0 || targetHeight <= 0) {
      return NextResponse.json(
        { error: 'Target dimensions must be positive numbers' },
        { status: 400 }
      )
    }
    
    if (targetWidth > 4096 || targetHeight > 4096) {
      return NextResponse.json(
        { error: 'Target dimensions too large (max 4096x4096)' },
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
    
    // Create service and upscale image
    const service = createImageUpscalingService()
    
    if (!service.isAvailable()) {
      return NextResponse.json(
        { error: 'Image upscaling service is not available' },
        { status: 503 }
      )
    }
    
    const result = await service.upscale(body.imageUrl, targetWidth, targetHeight)
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to upscale image' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      imageUrl: result.imageUrl,
      upscaleId: result.upscaleId,
      originalDimensions: {
        width: body.originalWidth || null,
        height: body.originalHeight || null
      },
      targetDimensions: {
        width: targetWidth,
        height: targetHeight
      },
      metadata: {
        service: service.isAvailable() ? 'openai' : 'mock',
        timestamp: new Date().toISOString()
      }
    })
    
  } catch (error) {
    console.error('Image upscaling error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
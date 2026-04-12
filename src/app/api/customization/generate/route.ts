import { NextRequest, NextResponse } from 'next/server'
import { createImageGenerationService } from '@/modules/customization/services/imageGeneration'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    if (!body.prompt || typeof body.prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required and must be a string' },
        { status: 400 }
      )
    }
    
    if (body.prompt.length > 1000) {
      return NextResponse.json(
        { error: 'Prompt must be 1000 characters or less' },
        { status: 400 }
      )
    }
    
    const { prompt, width, height, style } = body
    
    // Basic content moderation
    const blockedTerms = [
      'nude', 'naked', 'porn', 'sexual', 'violence', 'blood', 'weapon', 'drug',
      'hate', 'racist', 'nazi', 'terrorist', 'bomb', 'kill', 'murder'
    ]
    
    const lowerPrompt = prompt.toLowerCase()
    for (const term of blockedTerms) {
      if (lowerPrompt.includes(term)) {
        return NextResponse.json(
          { 
            error: 'Content not allowed',
            message: 'Your prompt contains content that is not suitable for our platform. Please try a different description.' 
          },
          { status: 400 }
        )
      }
    }
    
    // Create service and generate image
    const service = createImageGenerationService()
    
    if (!service.isAvailable()) {
      return NextResponse.json(
        { error: 'Image generation service is not available' },
        { status: 503 }
      )
    }
    
    const result = await service.generate(prompt, { width, height, style })
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to generate image' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      imageUrl: result.imageUrl,
      generationId: result.generationId,
      prompt,
      metadata: {
        service: service.isAvailable() ? 'openai' : 'mock',
        timestamp: new Date().toISOString()
      }
    })
    
  } catch (error) {
    console.error('Image generation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
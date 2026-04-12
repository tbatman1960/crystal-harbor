import { v4 as uuidv4 } from 'uuid'

export interface RealisticPreviewService {
  generatePreview(designImageUrl: string, productType: string, productColor: string): Promise<PreviewResult>
  isAvailable(): boolean
}

export interface PreviewResult {
  success: boolean
  imageUrl?: string // base64 data URL
  error?: string
  previewId: string
}

// Mock implementation - returns the design image as-is with a frame
class MockRealisticPreviewService implements RealisticPreviewService {
  async generatePreview(designImageUrl: string, productType: string, productColor: string): Promise<PreviewResult> {
    try {
      // Load the design image
      const img = new Image()
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        img.src = designImageUrl
      })
      
      // Create canvas with frame
      const canvas = document.createElement('canvas')
      const padding = 40
      canvas.width = img.width + (padding * 2)
      canvas.height = img.height + (padding * 2) + 60 // extra space for product info
      const ctx = canvas.getContext('2d')!
      
      // Background
      ctx.fillStyle = '#f5f5f5'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // Product frame simulation
      const frameColor = productColor.toLowerCase() === 'white' ? '#e0e0e0' : 
                        productColor.toLowerCase() === 'black' ? '#333333' : 
                        productColor.toLowerCase() === 'navy' ? '#1e3a8a' : '#8b4513'
      
      ctx.fillStyle = frameColor
      ctx.fillRect(padding - 10, padding - 10, img.width + 20, img.height + 20)
      
      // White inner area
      ctx.fillStyle = 'white'
      ctx.fillRect(padding - 5, padding - 5, img.width + 10, img.height + 10)
      
      // Draw the design
      ctx.drawImage(img, padding, padding)
      
      // Product info label
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
      ctx.fillRect(0, canvas.height - 50, canvas.width, 50)
      
      ctx.fillStyle = 'white'
      ctx.font = 'bold 16px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(`${productType} - ${productColor}`, canvas.width / 2, canvas.height - 25)
      
      // Mock indicator
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
      ctx.fillRect(canvas.width - 80, 10, 70, 25)
      ctx.fillStyle = 'black'
      ctx.font = 'bold 12px Arial'
      ctx.textAlign = 'left'
      ctx.fillText('MOCK 3D', canvas.width - 75, 25)
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000))
      
      const resultDataUrl = canvas.toDataURL('image/png')
      
      return {
        success: true,
        imageUrl: resultDataUrl,
        previewId: uuidv4()
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to generate realistic preview',
        previewId: uuidv4()
      }
    }
  }
  
  isAvailable(): boolean {
    return true
  }
}

// Real OpenAI implementation
class OpenAIRealisticPreviewService implements RealisticPreviewService {
  private readonly apiKey: string
  
  constructor(apiKey: string) {
    this.apiKey = apiKey
  }
  
  async generatePreview(designImageUrl: string, productType: string, productColor: string): Promise<PreviewResult> {
    try {
      // Create a detailed prompt for the product preview
      const productPrompts = {
        'mug': `A realistic photograph of a ${productColor} coffee mug sitting on a wooden table with natural lighting. The mug should be photographed at a slight angle to show dimension. Professional product photography style.`,
        'shirt': `A realistic photograph of a ${productColor} t-shirt laid flat or on a mannequin, showing the front clearly. Professional apparel photography with good lighting and no wrinkles.`,
        'poster': `A realistic photograph of a framed poster hanging on a white wall with natural lighting. The frame should be simple and modern. Professional interior photography style.`,
        'canvas': `A realistic photograph of a canvas print hanging on a wall with gallery lighting. The canvas should be stretched and ready to hang. Professional art gallery photography style.`
      }
      
      const basePrompt = productPrompts[productType.toLowerCase() as keyof typeof productPrompts] || 
                        `A realistic photograph of a ${productColor} ${productType} with professional product photography lighting.`
      
      const fullPrompt = `${basePrompt} Please create a photorealistic image that could be used for e-commerce. High quality, clean background, professional lighting.`
      
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: fullPrompt,
          n: 1,
          size: '1024x1024',
          quality: 'standard',
          response_format: 'b64_json'
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error?.message || `HTTP ${response.status}`)
      }
      
      const data = await response.json()
      const imageData = data.data[0]
      
      if (!imageData.b64_json) {
        throw new Error('No image data received from OpenAI')
      }
      
      // TODO: In a real implementation, we would composite the design onto the product
      // For now, we return the product mockup
      return {
        success: true,
        imageUrl: `data:image/png;base64,${imageData.b64_json}`,
        previewId: uuidv4()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        previewId: uuidv4()
      }
    }
  }
  
  isAvailable(): boolean {
    return !!this.apiKey
  }
}

// Factory function
export function createRealisticPreviewService(): RealisticPreviewService {
  const apiKey = process.env.OPENAI_API_KEY
  
  if (apiKey) {
    return new OpenAIRealisticPreviewService(apiKey)
  } else {
    return new MockRealisticPreviewService()
  }
}
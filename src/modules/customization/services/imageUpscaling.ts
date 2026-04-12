import { v4 as uuidv4 } from 'uuid'

export interface ImageUpscalingService {
  upscale(imageUrl: string, targetWidth: number, targetHeight: number): Promise<UpscaleResult>
  isAvailable(): boolean
}

export interface UpscaleResult {
  success: boolean
  imageUrl?: string // base64 data URL
  error?: string
  upscaleId: string
}

// Mock implementation - returns the original image unchanged
class MockImageUpscalingService implements ImageUpscalingService {
  async upscale(imageUrl: string, targetWidth: number, targetHeight: number): Promise<UpscaleResult> {
    try {
      // Load the original image
      const img = new Image()
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        img.src = imageUrl
      })
      
      // Create canvas with target dimensions
      const canvas = document.createElement('canvas')
      canvas.width = targetWidth
      canvas.height = targetHeight
      const ctx = canvas.getContext('2d')!
      
      // Draw the image scaled to target size
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight)
      
      // Add "MOCK UPSCALED" watermark
      ctx.globalAlpha = 0.7
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
      ctx.fillRect(targetWidth - 120, 10, 110, 30)
      
      ctx.globalAlpha = 1
      ctx.fillStyle = 'white'
      ctx.font = 'bold 12px Arial'
      ctx.textAlign = 'left'
      ctx.fillText('MOCK UPSCALED', targetWidth - 115, 28)
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000))
      
      const resultDataUrl = canvas.toDataURL('image/png')
      
      return {
        success: true,
        imageUrl: resultDataUrl,
        upscaleId: uuidv4()
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to upscale image',
        upscaleId: uuidv4()
      }
    }
  }
  
  isAvailable(): boolean {
    return true
  }
}

// Real OpenAI implementation (using image variations as upscaling alternative)
class OpenAIImageUpscalingService implements ImageUpscalingService {
  private readonly apiKey: string
  
  constructor(apiKey: string) {
    this.apiKey = apiKey
  }
  
  async upscale(imageUrl: string, targetWidth: number, targetHeight: number): Promise<UpscaleResult> {
    try {
      // Convert data URL to blob if needed
      let imageBlob: Blob
      if (imageUrl.startsWith('data:')) {
        const response = await fetch(imageUrl)
        imageBlob = await response.blob()
      } else {
        const response = await fetch(imageUrl)
        imageBlob = await response.blob()
      }
      
      // Create form data
      const formData = new FormData()
      formData.append('image', imageBlob, 'image.png')
      formData.append('n', '1')
      formData.append('size', '1024x1024') // OpenAI fixed size
      formData.append('response_format', 'b64_json')
      
      const response = await fetch('https://api.openai.com/v1/images/variations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: formData,
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
      
      // Scale the result to target dimensions if different from 1024x1024
      let finalImageUrl = `data:image/png;base64,${imageData.b64_json}`
      
      if (targetWidth !== 1024 || targetHeight !== 1024) {
        const img = new Image()
        await new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = reject
          img.src = finalImageUrl
        })
        
        const canvas = document.createElement('canvas')
        canvas.width = targetWidth
        canvas.height = targetHeight
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight)
        
        finalImageUrl = canvas.toDataURL('image/png')
      }
      
      return {
        success: true,
        imageUrl: finalImageUrl,
        upscaleId: uuidv4()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        upscaleId: uuidv4()
      }
    }
  }
  
  isAvailable(): boolean {
    return !!this.apiKey
  }
}

// Factory function
export function createImageUpscalingService(): ImageUpscalingService {
  const apiKey = process.env.OPENAI_API_KEY
  
  if (apiKey) {
    return new OpenAIImageUpscalingService(apiKey)
  } else {
    return new MockImageUpscalingService()
  }
}
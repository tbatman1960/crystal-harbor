import { v4 as uuidv4 } from 'uuid'

export interface StyleTransferService {
  applyStyle(imageUrl: string, styleName: string): Promise<StyleTransferResult>
  isAvailable(): boolean
}

export interface StyleTransferResult {
  success: boolean
  imageUrl?: string // base64 data URL
  error?: string
  transferId: string
}

const STYLE_FILTERS = {
  'Watercolor': (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.globalAlpha = 0.8
    ctx.globalCompositeOperation = 'multiply'
    const gradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width/2)
    gradient.addColorStop(0, 'rgba(135, 206, 250, 0.3)')
    gradient.addColorStop(1, 'rgba(70, 130, 180, 0.3)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)
  },
  'Oil painting': (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.filter = 'contrast(1.2) saturate(1.3)'
    ctx.globalAlpha = 0.7
    ctx.globalCompositeOperation = 'overlay'
    ctx.fillStyle = 'rgba(139, 69, 19, 0.2)'
    ctx.fillRect(0, 0, width, height)
  },
  'Cartoon': (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.filter = 'contrast(1.5) saturate(1.8) brightness(1.1)'
    ctx.globalAlpha = 0.6
    ctx.globalCompositeOperation = 'overlay'
    ctx.fillStyle = 'rgba(255, 20, 147, 0.1)'
    ctx.fillRect(0, 0, width, height)
  },
  'Pop art': (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.filter = 'contrast(2) saturate(2)'
    ctx.globalAlpha = 0.5
    ctx.globalCompositeOperation = 'screen'
    const gradient = ctx.createLinearGradient(0, 0, width, height)
    gradient.addColorStop(0, 'rgba(255, 0, 255, 0.3)')
    gradient.addColorStop(0.5, 'rgba(0, 255, 255, 0.3)')
    gradient.addColorStop(1, 'rgba(255, 255, 0, 0.3)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)
  },
  'Pencil sketch': (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.filter = 'grayscale(1) contrast(1.5)'
    ctx.globalAlpha = 0.8
    ctx.globalCompositeOperation = 'multiply'
    ctx.fillStyle = 'rgba(105, 105, 105, 0.2)'
    ctx.fillRect(0, 0, width, height)
  },
  'Abstract': (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.filter = 'hue-rotate(45deg) saturate(1.5)'
    ctx.globalAlpha = 0.6
    ctx.globalCompositeOperation = 'difference'
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = `hsla(${i * 72}, 70%, 50%, 0.2)`
      ctx.fillRect(i * width/5, 0, width/5, height)
    }
  },
  'Vintage/retro': (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.filter = 'sepia(0.7) contrast(0.8) brightness(0.9)'
    ctx.globalAlpha = 0.7
    ctx.globalCompositeOperation = 'overlay'
    const gradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width)
    gradient.addColorStop(0, 'rgba(255, 235, 205, 0.3)')
    gradient.addColorStop(1, 'rgba(139, 69, 19, 0.4)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)
  }
}

// Mock implementation - applies CSS-filter-like effects
class MockStyleTransferService implements StyleTransferService {
  async applyStyle(imageUrl: string, styleName: string): Promise<StyleTransferResult> {
    try {
      // Load the original image
      const img = new Image()
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        img.src = imageUrl
      })
      
      // Create canvas
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')!
      
      // Draw original image
      ctx.drawImage(img, 0, 0)
      
      // Apply style filter
      const styleFilter = STYLE_FILTERS[styleName as keyof typeof STYLE_FILTERS]
      if (styleFilter) {
        styleFilter(ctx, canvas.width, canvas.height)
      }
      
      // Add style name watermark
      ctx.globalAlpha = 0.8
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
      const textWidth = ctx.measureText(styleName).width + 20
      ctx.fillRect(10, canvas.height - 35, textWidth, 25)
      
      ctx.globalAlpha = 1
      ctx.fillStyle = 'white'
      ctx.font = 'bold 14px Arial'
      ctx.textAlign = 'left'
      ctx.fillText(styleName, 20, canvas.height - 18)
      
      // Add "MOCK" indicator
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
      ctx.font = 'bold 10px Arial'
      ctx.fillText('MOCK', canvas.width - 35, 15)
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 2000))
      
      const resultDataUrl = canvas.toDataURL('image/png')
      
      return {
        success: true,
        imageUrl: resultDataUrl,
        transferId: uuidv4()
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to apply style transfer',
        transferId: uuidv4()
      }
    }
  }
  
  isAvailable(): boolean {
    return true
  }
}

// Real OpenAI implementation using image editing
class OpenAIStyleTransferService implements StyleTransferService {
  private readonly apiKey: string
  
  constructor(apiKey: string) {
    this.apiKey = apiKey
  }
  
  async applyStyle(imageUrl: string, styleName: string): Promise<StyleTransferResult> {
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
      
      // Create a style prompt
      const stylePrompts = {
        'Watercolor': 'Transform this image into a beautiful watercolor painting with soft, flowing colors and artistic brush strokes',
        'Oil painting': 'Convert this image to a classic oil painting with rich textures and painterly brushwork',
        'Cartoon': 'Transform this image into a bright, colorful cartoon style with bold outlines and simplified features',
        'Pop art': 'Convert this image to pop art style with bold colors, high contrast, and Andy Warhol-like aesthetics',
        'Pencil sketch': 'Transform this image into a detailed pencil sketch with fine lines and artistic shading',
        'Abstract': 'Convert this image to an abstract art style with geometric shapes and artistic interpretation',
        'Vintage/retro': 'Transform this image to have a vintage, retro aesthetic with warm tones and nostalgic feel'
      }
      
      const prompt = stylePrompts[styleName as keyof typeof stylePrompts] || `Apply ${styleName} artistic style to this image`
      
      // Create form data for image editing
      const formData = new FormData()
      formData.append('image', imageBlob, 'image.png')
      formData.append('prompt', prompt)
      formData.append('n', '1')
      formData.append('size', '1024x1024')
      formData.append('response_format', 'b64_json')
      
      const response = await fetch('https://api.openai.com/v1/images/edits', {
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
      
      return {
        success: true,
        imageUrl: `data:image/png;base64,${imageData.b64_json}`,
        transferId: uuidv4()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        transferId: uuidv4()
      }
    }
  }
  
  isAvailable(): boolean {
    return !!this.apiKey
  }
}

// Factory function
export function createStyleTransferService(): StyleTransferService {
  const apiKey = process.env.OPENAI_API_KEY
  
  if (apiKey) {
    return new OpenAIStyleTransferService(apiKey)
  } else {
    return new MockStyleTransferService()
  }
}
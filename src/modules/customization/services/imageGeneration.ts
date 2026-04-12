import { v4 as uuidv4 } from 'uuid'

export interface ImageGenerationService {
  generate(prompt: string, options?: { width?: number; height?: number; style?: string }): Promise<GenerationResult>
  isAvailable(): boolean
}

export interface GenerationResult {
  success: boolean
  imageUrl?: string // base64 data URL
  error?: string
  generationId: string
}

// Mock implementation - creates a colored gradient with text overlay
class MockImageGenerationService implements ImageGenerationService {
  async generate(prompt: string, options: { width?: number; height?: number; style?: string } = {}): Promise<GenerationResult> {
    const { width = 512, height = 512, style = 'realistic' } = options
    
    try {
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      
      // Create gradient background based on prompt keywords
      const gradient = ctx.createLinearGradient(0, 0, width, height)
      
      // Color selection based on prompt content
      let colors = ['#FF6B6B', '#4ECDC4'] // default
      if (prompt.toLowerCase().includes('sky') || prompt.toLowerCase().includes('blue')) {
        colors = ['#87CEEB', '#4682B4']
      } else if (prompt.toLowerCase().includes('sunset') || prompt.toLowerCase().includes('orange')) {
        colors = ['#FF8C00', '#FF4500']
      } else if (prompt.toLowerCase().includes('forest') || prompt.toLowerCase().includes('green')) {
        colors = ['#228B22', '#006400']
      } else if (prompt.toLowerCase().includes('golden') || prompt.toLowerCase().includes('yellow')) {
        colors = ['#FFD700', '#FFA500']
      }
      
      gradient.addColorStop(0, colors[0])
      gradient.addColorStop(1, colors[1])
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, width, height)
      
      // Add some texture/pattern
      ctx.globalAlpha = 0.3
      for (let i = 0; i < 20; i++) {
        ctx.beginPath()
        ctx.arc(
          Math.random() * width,
          Math.random() * height,
          Math.random() * 30 + 10,
          0,
          2 * Math.PI
        )
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.5})`
        ctx.fill()
      }
      
      // Add text overlay
      ctx.globalAlpha = 1
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
      ctx.fillRect(0, height - 80, width, 80)
      
      ctx.fillStyle = 'white'
      ctx.font = `bold ${Math.min(width / 20, 24)}px Arial`
      ctx.textAlign = 'center'
      ctx.fillText('AI Generated:', width / 2, height - 50)
      
      // Wrap prompt text
      const maxWidth = width - 40
      const words = prompt.split(' ')
      let line = ''
      let lineHeight = Math.min(width / 30, 18)
      ctx.font = `${Math.min(width / 25, 16)}px Arial`
      
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' '
        const metrics = ctx.measureText(testLine)
        if (metrics.width > maxWidth && n > 0) {
          ctx.fillText(line.trim(), width / 2, height - 25)
          line = words[n] + ' '
        } else {
          line = testLine
        }
      }
      if (line.trim().length > 0) {
        ctx.fillText(line.trim(), width / 2, height - 25)
      }
      
      // Add "MOCK" watermark
      ctx.globalAlpha = 0.5
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
      ctx.font = 'bold 14px Arial'
      ctx.textAlign = 'right'
      ctx.fillText('MOCK', width - 10, 20)
      
      const dataUrl = canvas.toDataURL('image/png')
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1500))
      
      return {
        success: true,
        imageUrl: dataUrl,
        generationId: uuidv4()
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to generate mock image',
        generationId: uuidv4()
      }
    }
  }
  
  isAvailable(): boolean {
    return true
  }
}

// Real OpenAI DALL-E 3 implementation
class OpenAIImageGenerationService implements ImageGenerationService {
  private readonly apiKey: string
  
  constructor(apiKey: string) {
    this.apiKey = apiKey
  }
  
  async generate(prompt: string, options: { width?: number; height?: number; style?: string } = {}): Promise<GenerationResult> {
    const { width = 1024, height = 1024, style } = options
    
    try {
      // Build the enhanced prompt with style
      let enhancedPrompt = prompt
      if (style) {
        enhancedPrompt = `${prompt}, in ${style} style`
      }
      
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: enhancedPrompt,
          n: 1,
          size: `${width}x${height}`,
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
      
      return {
        success: true,
        imageUrl: `data:image/png;base64,${imageData.b64_json}`,
        generationId: uuidv4()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        generationId: uuidv4()
      }
    }
  }
  
  isAvailable(): boolean {
    return !!this.apiKey
  }
}

// Factory function
export function createImageGenerationService(): ImageGenerationService {
  const apiKey = process.env.OPENAI_API_KEY
  
  if (apiKey) {
    return new OpenAIImageGenerationService(apiKey)
  } else {
    return new MockImageGenerationService()
  }
}
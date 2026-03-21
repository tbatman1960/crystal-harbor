// Email capture system for Crystal Harbor Trading Company

export interface SubscriberEmail {
  id?: string
  email: string
  source: 'footer' | 'popup' | 'checkout'
  subscribed_at?: string
  active?: boolean
  discount_code_sent?: boolean
  discount_code?: string | null
}

export interface EmailCaptureSettings {
  popup_enabled: boolean
  popup_delay_seconds: number
  popup_exit_intent: boolean
  discount_percentage: number
  discount_code_prefix: string
}

// Generate a unique discount code
export const generateDiscountCode = (percentage: number = 10): string => {
  const prefix = 'WELCOME'
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${prefix}${percentage}_${timestamp}${random}`
}

// Validate email address
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Cookie management for popup tracking
export const setPopupShownCookie = (): void => {
  if (typeof document !== 'undefined') {
    const expiryDate = new Date()
    expiryDate.setTime(expiryDate.getTime() + (30 * 24 * 60 * 60 * 1000)) // 30 days
    document.cookie = `crystal_harbor_popup_shown=true; expires=${expiryDate.toUTCString()}; path=/`
  }
}

export const hasPopupBeenShown = (): boolean => {
  if (typeof document === 'undefined') return false
  return document.cookie.split(';').some(cookie => 
    cookie.trim().startsWith('crystal_harbor_popup_shown=true')
  )
}

// Exit intent detection
export const setupExitIntentDetection = (callback: () => void): (() => void) => {
  let hasTriggered = false
  
  const handleMouseLeave = (e: MouseEvent) => {
    if (hasTriggered) return
    
    // Check if mouse is leaving the top of the page (likely closing tab/window)
    if (e.clientY <= 0) {
      hasTriggered = true
      callback()
    }
  }
  
  if (typeof document !== 'undefined') {
    document.addEventListener('mouseleave', handleMouseLeave)
    
    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave)
    }
  }
  
  return () => {}
}

// Default email capture settings
export const defaultEmailCaptureSettings: EmailCaptureSettings = {
  popup_enabled: true,
  popup_delay_seconds: 30,
  popup_exit_intent: true,
  discount_percentage: 10,
  discount_code_prefix: 'WELCOME'
}
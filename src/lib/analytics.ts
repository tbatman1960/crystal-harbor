// Google Analytics 4 integration for Crystal Harbor Trading Company

declare global {
  interface Window {
    gtag: (...args: any[]) => void
    dataLayer: any[]
  }
}

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-XXXXXXXXXX'

// Initialize Google Analytics
export const initGA = () => {
  if (typeof window === 'undefined' || !GA_MEASUREMENT_ID || GA_MEASUREMENT_ID === 'G-XXXXXXXXXX') return

  // Create dataLayer if it doesn't exist
  window.dataLayer = window.dataLayer || []
  
  // Define gtag function
  window.gtag = function gtag() {
    window.dataLayer.push(arguments)
  }
  
  // Configure GA4
  window.gtag('js', new Date())
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_title: document.title,
    page_location: window.location.href,
  })
}

// Track page views (called on route changes)
export const trackPageView = (url: string, title?: string) => {
  if (typeof window === 'undefined' || !window.gtag) return

  window.gtag('config', GA_MEASUREMENT_ID, {
    page_location: url,
    page_title: title || document.title,
  })
}

// Track add to cart events
export const trackAddToCart = (item: {
  item_id: string
  item_name: string
  item_category: string
  quantity: number
  price: number
}) => {
  if (typeof window === 'undefined' || !window.gtag) return

  window.gtag('event', 'add_to_cart', {
    currency: 'USD',
    value: item.price * item.quantity,
    items: [{
      item_id: item.item_id,
      item_name: item.item_name,
      item_category: item.item_category,
      quantity: item.quantity,
      price: item.price,
    }]
  })
}

// Track begin checkout events
export const trackBeginCheckout = (items: Array<{
  item_id: string
  item_name: string
  item_category: string
  quantity: number
  price: number
}>, value: number) => {
  if (typeof window === 'undefined' || !window.gtag) return

  window.gtag('event', 'begin_checkout', {
    currency: 'USD',
    value: value,
    items: items.map(item => ({
      item_id: item.item_id,
      item_name: item.item_name,
      item_category: item.item_category,
      quantity: item.quantity,
      price: item.price,
    }))
  })
}

// Track purchase completion events
export const trackPurchase = (transaction: {
  transaction_id: string
  value: number
  items: Array<{
    item_id: string
    item_name: string
    item_category: string
    quantity: number
    price: number
  }>
}) => {
  if (typeof window === 'undefined' || !window.gtag) return

  window.gtag('event', 'purchase', {
    transaction_id: transaction.transaction_id,
    currency: 'USD',
    value: transaction.value,
    items: transaction.items.map(item => ({
      item_id: item.item_id,
      item_name: item.item_name,
      item_category: item.item_category,
      quantity: item.quantity,
      price: item.price,
    }))
  })
}

// Track user registration
export const trackSignUp = (method: 'email' | 'guest' = 'email') => {
  if (typeof window === 'undefined' || !window.gtag) return

  window.gtag('event', 'sign_up', {
    method: method
  })
}

// Track product page views
export const trackViewItem = (item: {
  item_id: string
  item_name: string
  item_category: string
  price: number
}) => {
  if (typeof window === 'undefined' || !window.gtag) return

  window.gtag('event', 'view_item', {
    currency: 'USD',
    value: item.price,
    items: [{
      item_id: item.item_id,
      item_name: item.item_name,
      item_category: item.item_category,
      price: item.price,
    }]
  })
}

// Track custom events
export const trackEvent = (action: string, category?: string, label?: string, value?: number) => {
  if (typeof window === 'undefined' || !window.gtag) return

  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  })
}
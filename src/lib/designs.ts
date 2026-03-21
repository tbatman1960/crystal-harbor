// Design catalog system for pre-selected designs

export interface Design {
  id: string
  name: string
  description: string
  imageUrl: string
  category: string
  productTypes: string[] // Which products this design works with
}

export interface ProductSettings {
  allowsCustomText: boolean
  allowFileUpload: boolean
  hasPreselectedDesigns: boolean
  requiresDesign: boolean
  instructions: string
  maxFileSize: number
}

// Available designs catalog
const designs: Design[] = [
  {
    id: 'vintage-logo',
    name: 'Vintage Logo',
    description: 'Classic vintage-style logo design',
    imageUrl: '/images/designs/vintage-logo.jpg',
    category: 'vintage',
    productTypes: ['custom-t-shirt', 'custom-blanket']
  },
  {
    id: 'modern-minimal',
    name: 'Modern Minimal', 
    description: 'Clean, modern minimalist design',
    imageUrl: '/images/designs/modern-minimal.jpg',
    category: 'modern',
    productTypes: ['custom-t-shirt', 'custom-blanket']
  },
  {
    id: 'bold-typography',
    name: 'Bold Typography',
    description: 'Eye-catching bold text design', 
    imageUrl: '/images/designs/bold-typography.jpg',
    category: 'typography',
    productTypes: ['custom-t-shirt', 'custom-banner', 'custom-flag']
  },
  {
    id: 'nature-theme',
    name: 'Nature Theme',
    description: 'Beautiful nature-inspired artwork',
    imageUrl: '/images/designs/nature-theme.jpg', 
    category: 'nature',
    productTypes: ['custom-t-shirt', 'custom-blanket', 'custom-flag']
  },
  {
    id: 'geometric-pattern',
    name: 'Geometric Pattern',
    description: 'Modern geometric pattern design',
    imageUrl: '/images/designs/geometric-pattern.jpg',
    category: 'modern', 
    productTypes: ['custom-blanket', 'custom-banner']
  },
  {
    id: 'retro-sunset',
    name: 'Retro Sunset',
    description: 'Retro-style sunset landscape',
    imageUrl: '/images/designs/retro-sunset.jpg',
    category: 'retro',
    productTypes: ['custom-t-shirt', 'custom-flag']
  }
]

// Product settings configuration
const productSettings: Record<string, ProductSettings> = {
  'custom-t-shirt': {
    allowsCustomText: true,
    allowFileUpload: true,
    hasPreselectedDesigns: true,
    requiresDesign: false,
    instructions: 'Add custom text, choose a design, or upload your own artwork',
    maxFileSize: 50 * 1024 * 1024 // 50MB
  },
  'custom-blanket': {
    allowsCustomText: true,
    allowFileUpload: true,
    hasPreselectedDesigns: true,
    requiresDesign: false,
    instructions: 'Perfect for family photos, custom text, or artistic designs',
    maxFileSize: 50 * 1024 * 1024 // 50MB
  },
  'custom-banner': {
    allowsCustomText: false,
    allowFileUpload: true,
    hasPreselectedDesigns: true,
    requiresDesign: false,
    instructions: 'Choose from our designs or upload your own high-resolution image',
    maxFileSize: 50 * 1024 * 1024 // 50MB
  },
  'custom-flag': {
    allowsCustomText: false,
    allowFileUpload: true,
    hasPreselectedDesigns: true,
    requiresDesign: false,
    instructions: 'Choose from our designs or upload your own high-resolution image',
    maxFileSize: 50 * 1024 * 1024 // 50MB
  }
}

/**
 * Get available designs for a specific product
 */
export function getDesignsByProduct(productSlug: string): Design[] {
  return designs.filter(design => 
    design.productTypes.includes(productSlug)
  )
}

/**
 * Get product-specific settings
 */
export function getProductSettings(productSlug: string): ProductSettings {
  return productSettings[productSlug] || {
    allowsCustomText: true,
    allowFileUpload: true, 
    hasPreselectedDesigns: false,
    requiresDesign: true,
    instructions: 'Upload your design or add custom text',
    maxFileSize: 50 * 1024 * 1024
  }
}

/**
 * Get all available designs
 */
export function getAllDesigns(): Design[] {
  return designs
}

/**
 * Get design by ID
 */
export function getDesignById(id: string): Design | null {
  return designs.find(design => design.id === id) || null
}

/**
 * Get designs by category
 */
export function getDesignsByCategory(category: string): Design[] {
  return designs.filter(design => design.category === category)
}
import { supabaseAdmin as supabase } from './supabase'

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  display_order: number
  active: boolean
}

export interface ProductOption {
  id: string
  product_id: string
  option_type: string
  option_value: string
  price_adjustment: number
  display_order: number
  active: boolean
}

export interface PricingTier {
  id: string
  product_id: string
  tier_name: string
  min_quantity: number
  max_quantity: number | null
  price_per_unit: number
  discount_percentage: number
}

export interface Product {
  id: string
  category_id: string | null
  name: string
  slug: string
  description: string | null
  material: string | null
  base_price: number
  active: boolean
  image_url: string | null
  created_at: string
  updated_at: string
  category?: Category
  sizes?: ProductOption[]
  colors?: ProductOption[]
  pricing_tiers?: PricingTier[]
}

export interface ProductWithOptions extends Product {
  sizes: ProductOption[]
  colors: ProductOption[]
  custom_options: Record<string, ProductOption[]>
  pricing_tiers: PricingTier[]
}

// Get all active categories
export async function getCategories(): Promise<Category[]> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('active', true)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching categories:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching categories:', error)
    return []
  }
}

// Get category by slug
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .eq('active', true)
      .single()

    if (error) {
      console.error('Error fetching category:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error fetching category:', error)
    return null
  }
}

// Get all products or products by category
export async function getProducts(categorySlug?: string): Promise<Product[]> {
  try {
    let query = supabase
      .from('products')
      .select(`
        *,
        category:categories(*)
      `)
      .eq('active', true)

    if (categorySlug) {
      const category = await getCategoryBySlug(categorySlug)
      if (category) {
        query = query.eq('category_id', category.id)
      } else {
        return []
      }
    }

    const { data, error } = await query.order('name', { ascending: true })

    if (error) {
      console.error('Error fetching products:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching products:', error)
    return []
  }
}

// Get single product with all options and pricing
export async function getProductBySlug(slug: string): Promise<ProductWithOptions | null> {
  try {
    // First get the product with category
    const { data: product, error: productError } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(*)
      `)
      .eq('slug', slug)
      .eq('active', true)
      .single()

    if (productError || !product) {
      console.error('Error fetching product:', productError)
      return null
    }

    // Get product options (sizes and colors)
    const { data: options, error: optionsError } = await supabase
      .from('product_options')
      .select('*')
      .eq('product_id', product.id)
      .eq('active', true)
      .order('option_type', { ascending: true })
      .order('display_order', { ascending: true })

    if (optionsError) {
      console.error('Error fetching product options:', optionsError)
    }

    // Get pricing tiers
    const { data: pricingTiers, error: pricingError } = await supabase
      .from('pricing_tiers')
      .select('*')
      .eq('product_id', product.id)
      .order('min_quantity', { ascending: true })

    if (pricingError) {
      console.error('Error fetching pricing tiers:', pricingError)
    }

    // Separate options by type
    const allOptions = options || []
    const sizes = allOptions.filter(option => option.option_type === 'size')
    const colors = allOptions.filter(option => option.option_type === 'color')
    
    // Group non-size/color options by type
    const custom_options: Record<string, ProductOption[]> = {}
    allOptions
      .filter(option => option.option_type !== 'size' && option.option_type !== 'color')
      .forEach(option => {
        if (!custom_options[option.option_type]) {
          custom_options[option.option_type] = []
        }
        custom_options[option.option_type].push(option)
      })

    return {
      ...product,
      sizes,
      colors,
      custom_options,
      pricing_tiers: pricingTiers || [],
    }
  } catch (error) {
    console.error('Error fetching product:', error)
    return null
  }
}

// Calculate price based on quantity and pricing tiers
export function calculatePrice(pricingTiers: PricingTier[], quantity: number, basePrice?: number): {
  pricePerUnit: number
  totalPrice: number
  tierName: string
  discountPercentage: number
} {
  if (!pricingTiers || pricingTiers.length === 0) {
    const price = basePrice || 0
    return {
      pricePerUnit: price,
      totalPrice: price * quantity,
      tierName: price > 0 ? 'Standard Price' : 'No pricing available',
      discountPercentage: 0,
    }
  }

  // Find the appropriate pricing tier
  const tier = pricingTiers.find(tier => {
    return quantity >= tier.min_quantity && 
           (tier.max_quantity === null || quantity <= tier.max_quantity)
  })

  if (!tier) {
    // Fallback to the last tier if quantity exceeds all tiers
    const lastTier = pricingTiers[pricingTiers.length - 1]
    return {
      pricePerUnit: lastTier.price_per_unit,
      totalPrice: lastTier.price_per_unit * quantity,
      tierName: lastTier.tier_name,
      discountPercentage: lastTier.discount_percentage,
    }
  }

  return {
    pricePerUnit: tier.price_per_unit,
    totalPrice: tier.price_per_unit * quantity,
    tierName: tier.tier_name,
    discountPercentage: tier.discount_percentage,
  }
}

// Get featured products (for homepage)
export async function getFeaturedProducts(limit: number = 4): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(*)
      `)
      .eq('active', true)
      .limit(limit)

    if (error) {
      console.error('Error fetching featured products:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching featured products:', error)
    return []
  }
}

// Get products by category ID
export async function getProductsByCategory(categoryId: string): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(*)
      `)
      .eq('category_id', categoryId)
      .eq('active', true)
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching products by category:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching products by category:', error)
    return []
  }
}
import { supabase } from './supabase'

export interface ShippingMethod {
  id: string
  name: string
  description: string | null
  method_type: 'flat_rate' | 'weight_based' | 'calculated' | 'free'
  flat_rate_cost: number | null
  weight_tiers: WeightTier[] | null
  carrier_code: string | null
  service_code: string | null
  min_order_for_free_shipping: number | null
  estimated_days_min: number
  estimated_days_max: number
  active: boolean
  display_order: number
  created_at: string
  updated_at: string
}

export interface WeightTier {
  max_weight: number
  cost: number
  name: string
}

export interface ShippingZone {
  id: string
  name: string
  description: string | null
  countries: string[]
  states: string[] | null
  postal_codes: string[] | null
  active: boolean
}

export interface ShippingCalculationInput {
  items: Array<{
    product_id: string
    product_name: string
    category_slug: string
    quantity: number
    unit_price: number
    line_total: number
  }>
  shipping_address: {
    country: string
    state: string
    postal_code: string
  }
  subtotal: number
}

export interface ShippingOption {
  method_id: string
  name: string
  description: string | null
  cost: number
  estimated_delivery: string
  carrier_code?: string
  service_code?: string
}

// Get all active shipping methods
export async function getActiveShippingMethods(): Promise<ShippingMethod[]> {
  const { data, error } = await supabase
    .from('shipping_methods')
    .select('*')
    .eq('active', true)
    .order('display_order', { ascending: true })

  if (error) {
    console.error('Error fetching shipping methods:', error)
    return []
  }

  return data || []
}

// Get shipping methods for a specific product
export async function getProductShippingMethods(productId: string): Promise<ShippingMethod[]> {
  const { data, error } = await supabase
    .from('product_shipping_methods')
    .select(`
      shipping_method:shipping_methods (*)
    `)
    .eq('product_id', productId)

  if (error) {
    console.error('Error fetching product shipping methods:', error)
    return []
  }

  return (data?.map((item: any) => item.shipping_method).filter(Boolean) as ShippingMethod[]) || []
}

// Calculate available shipping options for an order
export async function calculateShippingOptions(input: ShippingCalculationInput): Promise<ShippingOption[]> {
  // Get all active shipping methods
  const methods = await getActiveShippingMethods()
  
  // Calculate total weight (using our existing product weight estimates)
  const productWeights: { [key: string]: number } = {
    'custom-t-shirt': 0.5,
    'custom-fleece-blanket': 2.0, 
    'custom-vinyl-banner': 1.5,
    'custom-polyester-flag': 0.8
  }

  let totalWeight = 0
  input.items.forEach(item => {
    const productSlug = item.product_name.toLowerCase().replace(/\s+/g, '-')
    const itemWeight = productWeights[productSlug] || 1.0
    totalWeight += itemWeight * item.quantity
  })

  const options: ShippingOption[] = []

  for (const method of methods) {
    let cost = 0
    let isEligible = true

    switch (method.method_type) {
      case 'free':
        cost = 0
        break

      case 'flat_rate':
        cost = method.flat_rate_cost || 0
        
        // Check if order qualifies for free shipping
        if (method.min_order_for_free_shipping && 
            input.subtotal >= method.min_order_for_free_shipping) {
          cost = 0
        }
        break

      case 'weight_based':
        if (method.weight_tiers && method.weight_tiers.length > 0) {
          const applicableTier = method.weight_tiers.find(tier => totalWeight <= tier.max_weight)
          if (applicableTier) {
            cost = applicableTier.cost
          } else {
            // Weight exceeds all tiers
            isEligible = false
          }
        }
        break

      case 'calculated':
        // TODO: Implement ShipStation/carrier API integration
        // For now, fall back to a default rate
        cost = 15.99
        break
    }

    if (isEligible) {
      const estimatedDelivery = method.estimated_days_min === method.estimated_days_max 
        ? `${method.estimated_days_min} business days`
        : `${method.estimated_days_min}-${method.estimated_days_max} business days`

      options.push({
        method_id: method.id,
        name: method.name,
        description: method.description,
        cost,
        estimated_delivery: estimatedDelivery,
        carrier_code: method.carrier_code || undefined,
        service_code: method.service_code || undefined
      })
    }
  }

  return options.sort((a, b) => a.cost - b.cost) // Sort by cost, cheapest first
}

// Admin functions

// Create new shipping method
export async function createShippingMethod(method: Omit<ShippingMethod, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; error?: string; method?: ShippingMethod }> {
  try {
    const { data, error } = await supabase
      .from('shipping_methods')
      .insert([method])
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, method: data }
  } catch (error) {
    console.error('Error creating shipping method:', error)
    return { success: false, error: 'Failed to create shipping method' }
  }
}

// Update shipping method
export async function updateShippingMethod(id: string, updates: Partial<ShippingMethod>): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('shipping_methods')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating shipping method:', error)
    return { success: false, error: 'Failed to update shipping method' }
  }
}

// Delete shipping method
export async function deleteShippingMethod(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('shipping_methods')
      .delete()
      .eq('id', id)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error deleting shipping method:', error)
    return { success: false, error: 'Failed to delete shipping method' }
  }
}

// Assign shipping method to product
export async function assignShippingMethodToProduct(productId: string, shippingMethodId: string, isDefault: boolean = false): Promise<{ success: boolean; error?: string }> {
  try {
    // If setting as default, first remove default from other methods for this product
    if (isDefault) {
      await supabase
        .from('product_shipping_methods')
        .update({ is_default: false })
        .eq('product_id', productId)
    }

    // Insert or update the assignment
    const { error } = await supabase
      .from('product_shipping_methods')
      .upsert([{
        product_id: productId,
        shipping_method_id: shippingMethodId,
        is_default: isDefault
      }])

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error assigning shipping method to product:', error)
    return { success: false, error: 'Failed to assign shipping method' }
  }
}

// Remove shipping method from product
export async function removeShippingMethodFromProduct(productId: string, shippingMethodId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('product_shipping_methods')
      .delete()
      .eq('product_id', productId)
      .eq('shipping_method_id', shippingMethodId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error removing shipping method from product:', error)
    return { success: false, error: 'Failed to remove shipping method' }
  }
}

// Get all shipping methods (for admin)
export async function getAllShippingMethods(): Promise<ShippingMethod[]> {
  const { data, error } = await supabase
    .from('shipping_methods')
    .select('*')
    .order('display_order', { ascending: true })

  if (error) {
    console.error('Error fetching all shipping methods:', error)
    return []
  }

  return data || []
}

// ShipStation integration preparation
export interface ShipStationConfig {
  api_key: string
  api_secret: string
  base_url: string
  webhook_url: string
}

// Placeholder for ShipStation integration
export async function calculateShipStationRates(
  config: ShipStationConfig,
  shipment: {
    to_address: any
    from_address: any  
    packages: Array<{ weight: number; dimensions: any }>
  }
): Promise<ShippingOption[]> {
  // TODO: Implement actual ShipStation API integration
  // This would make HTTP requests to ShipStation's rate calculation API
  
  console.log('ShipStation integration not yet implemented')
  return []
}
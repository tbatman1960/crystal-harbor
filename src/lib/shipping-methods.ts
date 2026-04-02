import { supabaseAdmin as supabase } from './supabase'

// ============================================
// SHIPPING V2 — Size Class + Flat Rate Tiers
// ============================================

export interface ShippingSizeClass {
  id: string
  name: string
  label: string
  description: string | null
  display_order: number
}

export interface ShippingRateTier {
  id: string
  size_class_name: string
  min_quantity: number
  max_quantity: number | null  // null = unlimited (e.g., 25+)
  rate: number
  display_order: number
}

export interface ShippingCalculationInput {
  items: Array<{
    product_id: string
    product_name: string
    quantity: number
    size_class: string
    shipping_method: string
  }>
  shipping_address: {
    country: string
    state: string
    postal_code: string
  }
}

export interface ShippingResult {
  total: number
  breakdown: Array<{
    product_name: string
    quantity: number
    size_class: string
    shipping_method: string
    cost: number
  }>
}

// --- Size Class CRUD ---

export async function getSizeClasses(): Promise<ShippingSizeClass[]> {
  const { data, error } = await supabase
    .from('shipping_size_classes')
    .select('*')
    .order('display_order', { ascending: true })

  if (error) {
    console.error('Error fetching size classes:', error)
    return []
  }
  return data || []
}

export async function createSizeClass(sizeClass: { name: string; label: string; description?: string; display_order?: number }): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('shipping_size_classes')
    .insert([sizeClass])

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function updateSizeClass(id: string, updates: Partial<ShippingSizeClass>): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('shipping_size_classes')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function deleteSizeClass(id: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('shipping_size_classes')
    .delete()
    .eq('id', id)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

// --- Rate Tier CRUD ---

export async function getRateTiers(): Promise<ShippingRateTier[]> {
  const { data, error } = await supabase
    .from('shipping_rate_tiers')
    .select('*')
    .order('size_class_name, display_order', { ascending: true })

  if (error) {
    console.error('Error fetching rate tiers:', error)
    return []
  }
  return data || []
}

export async function getRateTiersBySizeClass(sizeClassName: string): Promise<ShippingRateTier[]> {
  const { data, error } = await supabase
    .from('shipping_rate_tiers')
    .select('*')
    .eq('size_class_name', sizeClassName)
    .order('min_quantity', { ascending: true })

  if (error) {
    console.error('Error fetching rate tiers for size class:', error)
    return []
  }
  return data || []
}

export async function upsertRateTiers(tiers: Array<Omit<ShippingRateTier, 'id'> & { id?: string }>): Promise<{ success: boolean; error?: string }> {
  // Delete existing tiers for affected size classes, then insert fresh
  const sizeClasses = Array.from(new Set(tiers.map(t => t.size_class_name)))

  for (const sc of sizeClasses) {
    const { error: delError } = await supabase
      .from('shipping_rate_tiers')
      .delete()
      .eq('size_class_name', sc)

    if (delError) return { success: false, error: delError.message }
  }

  const { error } = await supabase
    .from('shipping_rate_tiers')
    .insert(tiers.map(({ id, ...rest }) => rest))

  if (error) return { success: false, error: error.message }
  return { success: true }
}

// --- Shipping Calculation ---

/**
 * Calculate flat rate shipping for a given size class and quantity.
 * Finds the matching quantity bracket and returns the rate.
 */
export async function calculateFlatRate(sizeClassName: string, quantity: number): Promise<number> {
  const tiers = await getRateTiersBySizeClass(sizeClassName)

  if (tiers.length === 0) {
    console.warn(`No shipping tiers found for size class: ${sizeClassName}, using fallback $9.99`)
    return 9.99
  }

  // Find the tier that matches the quantity
  const matchingTier = tiers.find(tier => {
    if (tier.max_quantity === null) {
      return quantity >= tier.min_quantity
    }
    return quantity >= tier.min_quantity && quantity <= tier.max_quantity
  })

  if (!matchingTier) {
    // Shouldn't happen if tiers are set up correctly, but fallback to highest tier
    const lastTier = tiers[tiers.length - 1]
    return lastTier.rate
  }

  return Number(matchingTier.rate)
}

/**
 * Calculate USPS shipping rate via API.
 * Falls back to flat rate silently if USPS credentials aren't configured.
 */
export async function calculateUSPSRate(
  sizeClassName: string,
  quantity: number,
  _destinationZip: string,
  _shipFromZip: string
): Promise<{ cost: number; carrier: string; service: string }> {
  // TODO: Implement real USPS API call when credentials are available
  // For now, fall back to flat rate silently
  const flatRate = await calculateFlatRate(sizeClassName, quantity)
  return {
    cost: flatRate,
    carrier: 'usps',
    service: 'USPS Priority Mail (estimated)'
  }
}

/**
 * Calculate shipping for a full cart.
 * Each item uses its product's assigned shipping method.
 * Returns a total and per-item breakdown.
 */
export async function calculateCartShipping(input: ShippingCalculationInput): Promise<ShippingResult> {
  const breakdown: ShippingResult['breakdown'] = []
  let total = 0

  // Load ship-from ZIP for carrier calculations
  const { data: zipSetting } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'ship_from_zip')
    .single()
  const shipFromZip = zipSetting?.value || '46143'

  for (const item of input.items) {
    let cost = 0

    if (item.shipping_method === 'flat_rate') {
      cost = await calculateFlatRate(item.size_class, item.quantity)
    } else if (item.shipping_method === 'usps') {
      const result = await calculateUSPSRate(
        item.size_class,
        item.quantity,
        input.shipping_address.postal_code,
        shipFromZip
      )
      cost = result.cost
    } else {
      // fedex, ups — not yet implemented, fall back to flat rate
      cost = await calculateFlatRate(item.size_class, item.quantity)
    }

    breakdown.push({
      product_name: item.product_name,
      quantity: item.quantity,
      size_class: item.size_class,
      shipping_method: item.shipping_method,
      cost
    })

    total += cost
  }

  return { total, breakdown }
}

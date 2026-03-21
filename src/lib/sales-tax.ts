interface TaxCalculationInput {
  subtotal: number
  shipping_cost: number
  shipping_address: {
    state: string
    postal_code: string
    country: string
  }
  items: Array<{
    product_name: string
    category_slug: string
    unit_price: number
    quantity: number
    line_total: number
  }>
}

interface TaxCalculationResult {
  tax_amount: number
  tax_rate: number
  taxable_amount: number
  tax_jurisdiction: string
  breakdown: {
    state_tax: number
    county_tax: number
    city_tax: number
    special_district_tax: number
  }
  exempt_reason?: string
}

interface TaxRecord {
  order_id: string
  tax_amount: number
  tax_rate: number
  tax_jurisdiction: string
  taxable_amount: number
  reporting_period: string // YYYY-MM format
  created_at: string
}

// Indiana state tax rate (as of 2024)
const INDIANA_STATE_TAX_RATE = 0.07 // 7%

// Indiana county tax rates (sample - would need complete database)
const INDIANA_COUNTY_TAX_RATES: { [key: string]: number } = {
  // Format: county_name: additional_rate
  'marion': 0.01, // Indianapolis area
  'lake': 0.01,   // Northwest Indiana
  'allen': 0.0075, // Fort Wayne area
  'hamilton': 0.0075, // Carmel/Fishers area
  'st_joseph': 0.01, // South Bend area
  // Add more counties as needed
}

// Postal code to county mapping (sample)
const POSTAL_CODE_TO_COUNTY: { [key: string]: string } = {
  // Indianapolis area
  '46201': 'marion', '46202': 'marion', '46203': 'marion', '46204': 'marion',
  '46205': 'marion', '46206': 'marion', '46207': 'marion', '46208': 'marion',
  '46209': 'marion', '46210': 'marion', '46211': 'marion', '46214': 'marion',
  '46215': 'marion', '46216': 'marion', '46217': 'marion', '46218': 'marion',
  '46219': 'marion', '46220': 'marion', '46221': 'marion', '46222': 'marion',
  '46224': 'marion', '46225': 'marion', '46226': 'marion', '46227': 'marion',
  '46228': 'marion', '46229': 'marion', '46230': 'marion', '46231': 'marion',
  '46234': 'marion', '46235': 'marion', '46236': 'marion', '46237': 'marion',
  '46239': 'marion', '46240': 'marion', '46241': 'marion', '46250': 'marion',
  '46254': 'marion', '46256': 'marion', '46259': 'marion', '46260': 'marion',
  '46268': 'marion', '46274': 'marion', '46275': 'marion', '46278': 'marion',
  '46280': 'marion', '46282': 'marion', '46283': 'marion', '46285': 'marion',
  '46290': 'marion', '46291': 'marion', '46295': 'marion', '46296': 'marion',
  '46298': 'marion',
  
  // Fort Wayne area
  '46801': 'allen', '46802': 'allen', '46803': 'allen', '46804': 'allen',
  '46805': 'allen', '46806': 'allen', '46807': 'allen', '46808': 'allen',
  '46809': 'allen', '46814': 'allen', '46815': 'allen', '46816': 'allen',
  '46818': 'allen', '46819': 'allen', '46825': 'allen', '46835': 'allen',
  '46845': 'allen',
  
  // Add more postal codes as needed
}

// Tax-exempt categories (customize based on Indiana law)
const TAX_EXEMPT_CATEGORIES = new Set<string>([
  // Add category slugs that should be tax-exempt in Indiana
  // 'medical-supplies', 'educational-materials', etc.
])

/**
 * Calculate sales tax for an order based on shipping address
 * Currently supports Indiana only (nexus state)
 */
export function calculateSalesTax(input: TaxCalculationInput): TaxCalculationResult {
  const { subtotal, shipping_cost, shipping_address, items } = input

  // Only collect tax for Indiana orders (nexus state)
  if (shipping_address.country !== 'US' || shipping_address.state !== 'IN') {
    return {
      tax_amount: 0,
      tax_rate: 0,
      taxable_amount: 0,
      tax_jurisdiction: 'No nexus',
      breakdown: {
        state_tax: 0,
        county_tax: 0,
        city_tax: 0,
        special_district_tax: 0
      },
      exempt_reason: 'Out of state - no nexus requirement'
    }
  }

  // Calculate taxable amount
  let taxableAmount = subtotal

  // Check for tax-exempt items
  const exemptItems = items.filter(item => TAX_EXEMPT_CATEGORIES.has(item.category_slug))
  const exemptTotal = exemptItems.reduce((sum, item) => sum + item.line_total, 0)
  taxableAmount -= exemptTotal

  // Shipping is generally taxable in Indiana for tangible personal property
  taxableAmount += shipping_cost

  if (taxableAmount <= 0) {
    return {
      tax_amount: 0,
      tax_rate: 0,
      taxable_amount: 0,
      tax_jurisdiction: 'Indiana',
      breakdown: {
        state_tax: 0,
        county_tax: 0,
        city_tax: 0,
        special_district_tax: 0
      },
      exempt_reason: 'All items tax-exempt'
    }
  }

  // Determine county for local tax rates
  const postalCode = shipping_address.postal_code.substring(0, 5)
  const county = POSTAL_CODE_TO_COUNTY[postalCode] || 'unknown'
  
  // Calculate tax rates
  const stateRate = INDIANA_STATE_TAX_RATE
  const countyRate = INDIANA_COUNTY_TAX_RATES[county] || 0
  const totalRate = stateRate + countyRate

  // Calculate tax amounts
  const stateTax = Math.round(taxableAmount * stateRate * 100) / 100
  const countyTax = Math.round(taxableAmount * countyRate * 100) / 100
  const totalTax = stateTax + countyTax

  const jurisdiction = county !== 'unknown' 
    ? `Indiana - ${county.charAt(0).toUpperCase() + county.slice(1)} County`
    : 'Indiana'

  return {
    tax_amount: totalTax,
    tax_rate: totalRate,
    taxable_amount: taxableAmount,
    tax_jurisdiction: jurisdiction,
    breakdown: {
      state_tax: stateTax,
      county_tax: countyTax,
      city_tax: 0, // Not implemented yet
      special_district_tax: 0 // Not implemented yet
    }
  }
}

/**
 * Record tax for reporting purposes
 */
export async function recordTaxForReporting(
  orderId: string,
  taxCalculation: TaxCalculationResult
): Promise<void> {
  if (taxCalculation.tax_amount === 0) {
    return // No tax to record
  }

  const now = new Date()
  const reportingPeriod = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`

  const taxRecord: Omit<TaxRecord, 'created_at'> = {
    order_id: orderId,
    tax_amount: taxCalculation.tax_amount,
    tax_rate: taxCalculation.tax_rate,
    tax_jurisdiction: taxCalculation.tax_jurisdiction,
    taxable_amount: taxCalculation.taxable_amount,
    reporting_period: reportingPeriod
  }

  // TODO: Store in database table for tax reporting
  // This would go to a 'tax_records' table for generating reports
  console.log('Tax record for reporting:', taxRecord)
}

/**
 * Generate tax report for a specific period
 */
export async function generateTaxReport(year: number, month?: number): Promise<{
  period: string
  total_tax_collected: number
  total_taxable_sales: number
  breakdown_by_jurisdiction: { [jurisdiction: string]: { tax: number; sales: number } }
  record_count: number
}> {
  // TODO: Query database for tax records
  // This is a placeholder for the tax reporting functionality
  
  const period = month 
    ? `${year}-${month.toString().padStart(2, '0')}`
    : year.toString()

  return {
    period,
    total_tax_collected: 0,
    total_taxable_sales: 0,
    breakdown_by_jurisdiction: {},
    record_count: 0
  }
}

/**
 * Validate tax calculation for debugging
 */
export function validateTaxCalculation(
  input: TaxCalculationInput,
  result: TaxCalculationResult
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (result.tax_amount < 0) {
    errors.push('Tax amount cannot be negative')
  }

  if (result.taxable_amount < 0) {
    errors.push('Taxable amount cannot be negative')
  }

  if (result.tax_rate < 0 || result.tax_rate > 0.15) {
    errors.push('Tax rate seems unreasonable (should be 0-15%)')
  }

  if (input.shipping_address.state === 'IN' && result.tax_amount === 0 && !result.exempt_reason) {
    errors.push('Indiana orders should have tax unless exempt')
  }

  const calculatedTax = Math.round(result.taxable_amount * result.tax_rate * 100) / 100
  if (Math.abs(calculatedTax - result.tax_amount) > 0.01) {
    errors.push('Tax amount does not match rate calculation')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Format tax amount for display
 */
export function formatTaxDisplay(amount: number): string {
  return `$${amount.toFixed(2)}`
}

/**
 * Format tax rate for display
 */
export function formatTaxRateDisplay(rate: number): string {
  return `${(rate * 100).toFixed(3)}%`
}
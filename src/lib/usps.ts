/**
 * USPS Shipping Rate Integration
 * 
 * Supports USPS Web Tools API (XML) for rate calculations.
 * Falls back to mock data when credentials are placeholders or API is down.
 */

export interface USPSRateRequest {
  originZip: string
  destinationZip: string
  weightLbs: number
  lengthInches: number
  widthInches: number
  heightInches: number
}

export interface USPSRateOption {
  serviceName: string
  serviceCode: string
  price: number
  estimatedDays: string
  carrier: string
}

const USPS_API_URL = 'https://secure.shippingapis.com/ShippingAPI.dll'

function isPlaceholder(val: string | undefined): boolean {
  return !val || val === 'PLACEHOLDER_NEEDS_REAL_VALUE' || val.length < 3
}

/**
 * Get USPS shipping rates. Falls back to mock data if credentials are missing or API fails.
 */
export async function getUSPSRates(req: USPSRateRequest): Promise<{ rates: USPSRateOption[]; isMock: boolean; error?: string }> {
  const userId = process.env.USPS_API_USER_ID
  
  if (isPlaceholder(userId)) {
    console.log('USPS credentials not configured — returning mock rates')
    return { rates: getMockRates(req), isMock: true }
  }

  try {
    const rates = await fetchLiveRates(userId!, req)
    return { rates, isMock: false }
  } catch (error) {
    console.error('USPS API error, falling back to mock rates:', error)
    return { 
      rates: getMockRates(req), 
      isMock: true, 
      error: `USPS API unavailable: ${error instanceof Error ? error.message : String(error)}` 
    }
  }
}

async function fetchLiveRates(userId: string, req: USPSRateRequest): Promise<USPSRateOption[]> {
  // Round weight up — USPS requires pounds + ounces
  const pounds = Math.floor(req.weightLbs)
  const ounces = Math.ceil((req.weightLbs - pounds) * 16)

  const xml = `
<RateV4Request USERID="${userId}">
  <Revision>2</Revision>
  <Package ID="1">
    <Service>ALL</Service>
    <ZipOrigination>${req.originZip}</ZipOrigination>
    <ZipDestination>${req.destinationZip}</ZipDestination>
    <Pounds>${pounds}</Pounds>
    <Ounces>${ounces}</Ounces>
    <Container>VARIABLE</Container>
    <Width>${req.widthInches}</Width>
    <Length>${req.lengthInches}</Length>
    <Height>${req.heightInches}</Height>
    <Machinable>true</Machinable>
  </Package>
</RateV4Request>`.trim()

  const url = `${USPS_API_URL}?API=RateV4&XML=${encodeURIComponent(xml)}`
  
  const response = await fetch(url, { 
    method: 'GET',
    signal: AbortSignal.timeout(10000) // 10s timeout
  })

  if (!response.ok) {
    throw new Error(`USPS API returned ${response.status}`)
  }

  const text = await response.text()

  // Check for API-level errors
  if (text.includes('<Error>')) {
    const errMatch = text.match(/<Description>(.*?)<\/Description>/)
    throw new Error(errMatch?.[1] || 'USPS API returned an error')
  }

  // Parse the XML response
  return parseUSPSResponse(text)
}

function parseUSPSResponse(xml: string): USPSRateOption[] {
  const rates: USPSRateOption[] = []
  
  // Extract each <Postage> element
  const postageRegex = /<Postage CLASSID="(\d+)">([\s\S]*?)<\/Postage>/g
  let match

  while ((match = postageRegex.exec(xml)) !== null) {
    const block = match[2]
    
    const serviceName = extractXMLValue(block, 'MailService') || ''
    const rate = parseFloat(extractXMLValue(block, 'Rate') || '0')
    const commitDays = extractXMLValue(block, 'CommitmentDate') || ''
    
    if (rate > 0 && serviceName) {
      // Clean up service name (remove HTML tags USPS sometimes includes)
      const cleanName = serviceName.replace(/<[^>]+>/g, '').replace(/&lt;.*?&gt;/g, '').trim()
      
      // Map common services to friendly names and estimate days
      const { friendly, days } = mapServiceName(cleanName, commitDays)
      
      rates.push({
        serviceName: friendly,
        serviceCode: `usps_class_${match[1]}`,
        price: Math.round(rate * 100) / 100,
        estimatedDays: days,
        carrier: 'USPS',
      })
    }
  }

  // Sort by price and deduplicate similar services
  return deduplicateRates(rates.sort((a, b) => a.price - b.price))
}

function extractXMLValue(xml: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}>(.*?)</${tag}>`, 's')
  const match = xml.match(regex)
  return match ? match[1].trim() : null
}

function mapServiceName(raw: string, commitDate: string): { friendly: string; days: string } {
  const lower = raw.toLowerCase()
  
  if (lower.includes('priority mail express')) {
    return { friendly: 'USPS Priority Mail Express', days: '1-2 business days' }
  }
  if (lower.includes('priority mail')) {
    return { friendly: 'USPS Priority Mail', days: '2-3 business days' }
  }
  if (lower.includes('ground advantage')) {
    return { friendly: 'USPS Ground Advantage', days: '2-5 business days' }
  }
  if (lower.includes('first class') || lower.includes('first-class')) {
    return { friendly: 'USPS First-Class Mail', days: '3-5 business days' }
  }
  if (lower.includes('media mail')) {
    return { friendly: 'USPS Media Mail', days: '5-8 business days' }
  }
  if (lower.includes('parcel select')) {
    return { friendly: 'USPS Parcel Select', days: '2-8 business days' }
  }
  if (lower.includes('retail ground')) {
    return { friendly: 'USPS Retail Ground', days: '2-8 business days' }
  }

  return { friendly: raw, days: commitDate || '3-7 business days' }
}

function deduplicateRates(rates: USPSRateOption[]): USPSRateOption[] {
  const seen = new Map<string, USPSRateOption>()
  for (const rate of rates) {
    // Keep the cheapest option for each service name
    if (!seen.has(rate.serviceName) || seen.get(rate.serviceName)!.price > rate.price) {
      seen.set(rate.serviceName, rate)
    }
  }
  return Array.from(seen.values())
}

/**
 * Mock rates based on weight/distance for when USPS API is unavailable.
 */
function getMockRates(req: USPSRateRequest): USPSRateOption[] {
  const w = req.weightLbs
  
  // Base prices scale with weight
  const groundBase = w <= 1 ? 5.50 : w <= 3 ? 7.50 : w <= 5 ? 9.99 : 12.99 + (w - 5) * 1.50
  const priorityBase = groundBase * 1.6
  const expressBase = groundBase * 2.8

  return [
    {
      serviceName: 'USPS Ground Advantage',
      serviceCode: 'usps_ground_advantage',
      price: Math.round(groundBase * 100) / 100,
      estimatedDays: '2-5 business days',
      carrier: 'USPS',
    },
    {
      serviceName: 'USPS Priority Mail',
      serviceCode: 'usps_priority',
      price: Math.round(priorityBase * 100) / 100,
      estimatedDays: '2-3 business days',
      carrier: 'USPS',
    },
    {
      serviceName: 'USPS Priority Mail Express',
      serviceCode: 'usps_priority_express',
      price: Math.round(expressBase * 100) / 100,
      estimatedDays: '1-2 business days',
      carrier: 'USPS',
    },
  ]
}

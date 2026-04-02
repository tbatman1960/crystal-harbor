export interface USPSRate {
  service_name: string;
  cost: number;
  estimated_days: number;
}

export interface USPSShippingRequest {
  originZip: string;
  destinationZip: string;
  packages: Array<{
    length: number;
    width: number;
    height: number;
    weight: number;
    value?: number;
  }>;
}

/**
 * Get shipping rates from USPS API or return mock rates if API not configured
 */
export async function getUSPSRates(request: USPSShippingRequest): Promise<USPSRate[]> {
  const uspsApiKey = process.env.USPS_API_KEY;
  const uspsUserId = process.env.USPS_USER_ID;

  // If no API credentials, return realistic mock rates
  if (!uspsApiKey || !uspsUserId) {
    console.log('USPS API not configured, returning mock rates');
    return getMockUSPSRates(request);
  }

  try {
    // TODO: Implement real USPS API calls when credentials are available
    // For now, return mock rates even when credentials exist
    console.log('USPS API integration pending - using mock rates');
    return getMockUSPSRates(request);

  } catch (error) {
    console.error('USPS API error, falling back to mock rates:', error);
    return getMockUSPSRates(request);
  }
}

/**
 * Generate realistic mock USPS rates based on package dimensions and weight
 */
function getMockUSPSRates(request: USPSShippingRequest): USPSRate[] {
  const { packages } = request;
  
  // Calculate total weight for rate estimation
  const totalWeight = packages.reduce((sum, pkg) => sum + pkg.weight, 0);
  
  // Base rates + weight-based pricing
  const groundAdvantageBase = 5.50;
  const priorityMailBase = 8.50;
  const priorityExpressBase = 28.00;
  
  const groundAdvantageRate = 0.50;
  const priorityMailRate = 0.60;
  const priorityExpressRate = 1.00;

  // Calculate distance factor (rough estimate based on zip codes)
  const distanceFactor = getZipDistanceFactor(request.originZip, request.destinationZip);

  const rates: USPSRate[] = [
    {
      service_name: 'USPS Ground Advantage',
      cost: Number((groundAdvantageBase + (totalWeight * groundAdvantageRate) * distanceFactor).toFixed(2)),
      estimated_days: getEstimatedDays('ground', request.originZip, request.destinationZip)
    },
    {
      service_name: 'USPS Priority Mail',
      cost: Number((priorityMailBase + (totalWeight * priorityMailRate) * distanceFactor).toFixed(2)),
      estimated_days: getEstimatedDays('priority', request.originZip, request.destinationZip)
    },
    {
      service_name: 'USPS Priority Mail Express',
      cost: Number((priorityExpressBase + (totalWeight * priorityExpressRate) * distanceFactor).toFixed(2)),
      estimated_days: getEstimatedDays('express', request.originZip, request.destinationZip)
    }
  ];

  return rates;
}

/**
 * Rough distance factor based on zip code comparison
 */
function getZipDistanceFactor(originZip: string, destZip: string): number {
  if (!originZip || !destZip) return 1.0;
  
  const origin = originZip.slice(0, 3);
  const dest = destZip.slice(0, 3);
  
  // Same 3-digit zip prefix = local
  if (origin === dest) return 0.8;
  
  // Similar zip prefixes = regional
  const originNum = parseInt(origin, 10);
  const destNum = parseInt(dest, 10);
  
  if (Math.abs(originNum - destNum) < 100) return 0.9;
  if (Math.abs(originNum - destNum) < 300) return 1.0;
  
  // Cross-country = higher cost
  return 1.3;
}

/**
 * Estimate delivery days based on service and distance
 */
function getEstimatedDays(service: 'ground' | 'priority' | 'express', originZip: string, destZip: string): number {
  const distanceFactor = getZipDistanceFactor(originZip, destZip);
  
  switch (service) {
    case 'express':
      return distanceFactor > 1.2 ? 2 : 1; // 1-2 business days
    case 'priority':
      return distanceFactor > 1.2 ? 3 : 2; // 1-3 business days
    case 'ground':
    default:
      if (distanceFactor < 0.9) return 3; // Local: 2-5 days
      if (distanceFactor < 1.1) return 5; // Regional: 3-6 days
      return 7; // Cross-country: 5-8 days
  }
}

/**
 * Real USPS API integration (placeholder for future implementation)
 */
async function callUSPSAPI(request: USPSShippingRequest): Promise<USPSRate[]> {
  // TODO: Implement real USPS Web Tools API integration
  // Documentation: https://www.usps.com/business/web-tools-apis/
  
  // Example API call structure:
  // 1. Build XML request with package details
  // 2. POST to USPS API endpoint
  // 3. Parse XML response
  // 4. Extract rates and delivery times
  // 5. Return standardized rate objects
  
  throw new Error('Real USPS API integration not yet implemented');
}
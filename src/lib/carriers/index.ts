import { PackedBox } from '@/lib/packing';
import { getUSPSRates, USPSRate } from './usps';
import { supabaseAdmin as supabase } from '@/lib/supabase';

export interface ShippingRate {
  service: string;
  total_cost: number;
  estimated_days: number;
  per_package: Array<{
    package_name: string;
    cost: number;
    weight: number;
  }>;
}

export interface ShippingRatesResponse {
  rates: ShippingRate[];
  source: 'carrier' | 'fallback';
  origin_zip?: string;
  destination_zip?: string;
  packages_summary?: string;
}

/**
 * Get shipping rates for packed boxes from carriers or fallback calculation
 */
export async function getShippingRates(
  packages: PackedBox[],
  originZip: string,
  destinationZip: string
): Promise<ShippingRatesResponse> {
  
  if (!packages || packages.length === 0) {
    return {
      rates: [],
      source: 'fallback',
      origin_zip: originZip,
      destination_zip: destinationZip
    };
  }

  try {
    // Try carrier API first
    const carrierRates = await getCarrierRates(packages, originZip, destinationZip);
    
    if (carrierRates && carrierRates.length > 0) {
      return {
        rates: carrierRates,
        source: 'carrier',
        origin_zip: originZip,
        destination_zip: destinationZip,
        packages_summary: `${packages.length} package(s)`
      };
    }

  } catch (error) {
    console.error('Carrier API error, falling back to flat rates:', error);
  }

  // Fallback to calculated rates
  const fallbackRates = await calculateFallbackRates(packages);
  
  return {
    rates: fallbackRates,
    source: 'fallback',
    origin_zip: originZip,
    destination_zip: destinationZip,
    packages_summary: `${packages.length} package(s)`
  };
}

/**
 * Get rates from carrier APIs (USPS, FedEx, UPS)
 */
async function getCarrierRates(
  packages: PackedBox[],
  originZip: string,
  destinationZip: string
): Promise<ShippingRate[] | null> {
  
  // Convert packed boxes to carrier API format
  const apiPackages = packages.map(box => ({
    length: box.package_type.length_inches,
    width: box.package_type.width_inches,
    height: box.package_type.height_inches,
    weight: box.gross_weight,
    value: 100 // Default insured value
  }));

  try {
    // Get USPS rates
    const uspsRates = await getUSPSRates({
      originZip,
      destinationZip,
      packages: apiPackages
    });

    // Convert USPS rates to our format
    const shippingRates: ShippingRate[] = uspsRates.map(rate => ({
      service: rate.service_name,
      total_cost: rate.cost,
      estimated_days: rate.estimated_days,
      per_package: packages.map((box, index) => ({
        package_name: box.package_type.name,
        cost: Number((rate.cost / packages.length).toFixed(2)), // Split evenly for now
        weight: box.gross_weight
      }))
    }));

    // TODO: Add FedEx and UPS when APIs are integrated
    
    return shippingRates;

  } catch (error) {
    console.error('Error getting carrier rates:', error);
    return null;
  }
}

/**
 * Calculate fallback shipping rates based on package utilization and fallback rates
 */
async function calculateFallbackRates(packages: PackedBox[]): Promise<ShippingRate[]> {
  
  // Get fallback settings from site_settings
  const { data: settings } = await supabase
    .from('site_settings')
    .select('key, value')
    .in('key', ['shipping_fallback_min_per_package', 'shipping_fallback_markup_pct']);

  const settingsMap = new Map(settings?.map(s => [s.key, s.value]) || []);
  const minPerPackage = parseFloat(settingsMap.get('shipping_fallback_min_per_package') || '4.99');
  const markupPct = parseFloat(settingsMap.get('shipping_fallback_markup_pct') || '0') / 100;

  // Calculate cost per package based on utilization × fallback_rate
  let totalCost = 0;
  const perPackageDetails = packages.map(box => {
    const baseCost = box.utilization * box.package_type.fallback_rate;
    const actualCost = Math.max(baseCost, minPerPackage);
    const finalCost = actualCost * (1 + markupPct);
    
    totalCost += finalCost;
    
    return {
      package_name: box.package_type.name,
      cost: Number(finalCost.toFixed(2)),
      weight: box.gross_weight
    };
  });

  // Log warning that fallback was used
  console.warn(`Shipping fallback calculation used for ${packages.length} packages. Total cost: $${totalCost.toFixed(2)}`);

  return [{
    service: 'Standard Shipping',
    total_cost: Number(totalCost.toFixed(2)),
    estimated_days: 7, // Conservative estimate
    per_package: perPackageDetails
  }];
}

/**
 * Get available carriers and their status
 */
export async function getCarrierStatus(): Promise<{ 
  usps: { available: boolean; configured: boolean };
  fedex: { available: boolean; configured: boolean };
  ups: { available: boolean; configured: boolean };
}> {
  return {
    usps: {
      available: true,
      configured: !!(process.env.USPS_API_KEY && process.env.USPS_USER_ID)
    },
    fedex: {
      available: false, // Coming soon
      configured: false
    },
    ups: {
      available: false, // Coming soon
      configured: false
    }
  };
}

/**
 * Helper function to format shipping options for display
 */
export function formatShippingOptions(response: ShippingRatesResponse): string[] {
  return response.rates.map(rate => {
    const deliveryText = rate.estimated_days === 1 
      ? 'Next business day'
      : rate.estimated_days === 2 
        ? '2 business days'
        : `${rate.estimated_days} business days`;
    
    return `${rate.service} - $${rate.total_cost.toFixed(2)} (${deliveryText})`;
  });
}
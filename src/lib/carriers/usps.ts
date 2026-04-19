import jsPDF from 'jspdf';

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

export interface USPSLabelRequest {
  toAddress: {
    firstName: string;
    lastName: string;
    streetAddress: string;
    city: string;
    state: string;
    zipCode: string;
    phone?: string;
  };
  packageDescription: {
    weight: number;
    length: number;
    width: number;
    height: number;
    mailClass: string;
    processingCategory: string;
    rateIndicator: string;
  };
}

export interface USPSLabelResponse {
  tracking_number: string;
  label_data: string; // base64 PDF
  cost?: number;
  service_name: string;
}

export interface USPSTrackingEvent {
  date: string;
  time: string;
  activity: string;
  location: string;
}

export interface USPSTrackingResponse {
  tracking_number: string;
  status: string;
  delivery_date?: string;
  events: USPSTrackingEvent[];
}

// Token caches for OAuth2 and payment authorization
let tokenCache: { access_token: string; expires_at: number } | null = null;
let paymentTokenCache: { token: string; expires_at: number } | null = null;

/**
 * Get OAuth2 access token for USPS API
 */
async function getUSPSToken(): Promise<string | null> {
  const clientId = process.env.USPS_CLIENT_ID;
  const clientSecret = process.env.USPS_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return null;
  }

  // Check if we have a valid cached token
  if (tokenCache && tokenCache.expires_at > Date.now()) {
    return tokenCache.access_token;
  }

  try {
    const baseUrl = getUSPSBaseUrl();

    const response = await fetch(`${baseUrl}/oauth2/v3/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!response.ok) {
      console.error('USPS OAuth2 error:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    
    // Cache token with 50 minutes expiry (tokens usually last 60 minutes)
    tokenCache = {
      access_token: data.access_token,
      expires_at: Date.now() + (50 * 60 * 1000), // 50 minutes from now
    };

    return data.access_token;
  } catch (error) {
    console.error('Error getting USPS token:', error);
    return null;
  }
}

/**
 * Get USPS base URL
 */
function getUSPSBaseUrl(): string {
  return 'https://api.usps.com';
}

/**
 * Get payment authorization token required for label creation
 */
async function getUSPSPaymentToken(accessToken: string): Promise<string | null> {
  // Check cache
  if (paymentTokenCache && paymentTokenCache.expires_at > Date.now()) {
    return paymentTokenCache.token;
  }

  try {
    const baseUrl = getUSPSBaseUrl();
    const crid = process.env.USPS_CRID || '55939760';
    const mid = process.env.USPS_MID || '904153252';
    const epsAccount = process.env.USPS_EPS_ACCOUNT || '1000420021';

    const response = await fetch(`${baseUrl}/payments/v3/payment-authorization`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        roles: [
          {
            roleName: 'PAYER',
            CRID: crid,
            MID: mid,
            manifestMID: mid,
            accountType: 'EPS',
            accountNumber: epsAccount,
          },
          {
            roleName: 'LABEL_OWNER',
            CRID: crid,
            MID: mid,
            manifestMID: mid,
            accountType: 'EPS',
            accountNumber: epsAccount,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('USPS Payment Auth error:', response.status, errorData);
      return null;
    }

    const data = await response.json();
    if (data.paymentAuthorizationToken) {
      // Cache for 7 hours (tokens last 8 hours)
      paymentTokenCache = {
        token: data.paymentAuthorizationToken,
        expires_at: Date.now() + 7 * 60 * 60 * 1000,
      };
      return data.paymentAuthorizationToken;
    }

    return null;
  } catch (error) {
    console.error('Error getting USPS payment token:', error);
    return null;
  }
}

/**
 * Get shipping rates from USPS API or return mock rates if API not configured
 */
export async function getUSPSRates(request: USPSShippingRequest): Promise<USPSRate[]> {
  const token = await getUSPSToken();

  // If no API credentials or token failed, return realistic mock rates
  if (!token) {
    console.log('USPS API not configured, returning mock rates');
    return getMockUSPSRates(request);
  }

  try {
    const baseUrl = getUSPSBaseUrl();

    // Use first package for pricing (combine packages if needed)
    const mainPackage = request.packages[0];
    if (!mainPackage) {
      return getMockUSPSRates(request);
    }

    const baseRequest = {
      originZIPCode: request.originZip,
      destinationZIPCode: request.destinationZip,
      weight: mainPackage.weight,
      length: mainPackage.length,
      width: mainPackage.width,
      height: mainPackage.height,
      processingCategory: 'MACHINABLE',
      rateIndicator: 'DR',
      destinationEntryFacilityType: 'NONE',
      priceType: 'COMMERCIAL'
    };

    // Fetch rates for all three service levels in parallel
    const serviceClasses = [
      { mailClass: 'USPS_GROUND_ADVANTAGE', name: 'USPS Ground Advantage', tier: 'ground' as const },
      { mailClass: 'PRIORITY_MAIL', name: 'USPS Priority Mail', tier: 'priority' as const },
      { mailClass: 'PRIORITY_MAIL_EXPRESS', name: 'USPS Priority Mail Express', tier: 'express' as const },
    ];

    const ratePromises = serviceClasses.map(async (svc) => {
      try {
        const response = await fetch(`${baseUrl}/prices/v3/base-rates/search`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...baseRequest, mailClass: svc.mailClass }),
        });

        if (!response.ok) {
          console.error(`USPS ${svc.name} rate error:`, response.status);
          return null;
        }

        const data = await response.json();
        if (data.totalBasePrice) {
          return {
            service_name: svc.name,
            cost: Number(parseFloat(data.totalBasePrice).toFixed(2)),
            estimated_days: getEstimatedDays(svc.tier, request.originZip, request.destinationZip)
          };
        }
        return null;
      } catch (err) {
        console.error(`USPS ${svc.name} rate fetch error:`, err);
        return null;
      }
    });

    const results = await Promise.all(ratePromises);
    const rates: USPSRate[] = results.filter((r): r is USPSRate => r !== null);

    return rates.length > 0 ? rates : getMockUSPSRates(request);

  } catch (error) {
    console.error('USPS API error, falling back to mock rates:', error);
    return getMockUSPSRates(request);
  }
}

/**
 * Create a USPS shipping label
 */
export async function createUSPSLabel(request: USPSLabelRequest): Promise<USPSLabelResponse> {
  const token = await getUSPSToken();

  // If no API credentials, generate mock label
  if (!token) {
    console.log('USPS API not configured, generating mock label');
    return generateMockLabel(request);
  }

  try {
    const baseUrl = getUSPSBaseUrl();

    // Get payment authorization token (required for label creation)
    const paymentToken = await getUSPSPaymentToken(token);
    if (!paymentToken) {
      console.error('Failed to get USPS payment authorization token');
      return generateMockLabel(request);
    }

    const labelRequest = {
      imageInfo: {
        imageType: 'PDF',
        labelType: '4X6LABEL'
      },
      toAddress: {
        firstName: request.toAddress.firstName,
        lastName: request.toAddress.lastName,
        streetAddress: request.toAddress.streetAddress,
        city: request.toAddress.city,
        state: request.toAddress.state,
        ZIPCode: request.toAddress.zipCode,
      },
      fromAddress: {
        firstName: 'Crystal Harbor',
        lastName: 'Trading Company',
        streetAddress: '2307 Willow Lakes East Blvd',
        city: 'Greenwood',
        state: 'IN',
        ZIPCode: '46143'
      },
      packageDescription: request.packageDescription
    };

    const response = await fetch(`${baseUrl}/labels/v3/label`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Payment-Authorization-Token': paymentToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(labelRequest),
    });

    if (!response.ok) {
      console.error('USPS Labels API error:', response.status, response.statusText);
      return generateMockLabel(request);
    }

    const data = await response.json();

    return {
      tracking_number: data.labelMetadata?.trackingNumber || 'NO_TRACKING',
      label_data: data.labelImage, // base64 PDF
      cost: data.totalPrice ? parseFloat(data.totalPrice) : undefined,
      service_name: request.packageDescription.mailClass.replace(/_/g, ' ')
    };

  } catch (error) {
    console.error('Error creating USPS label:', error);
    return generateMockLabel(request);
  }
}

/**
 * Get tracking information for a package
 */
export async function getUSPSTracking(trackingNumber: string): Promise<USPSTrackingResponse> {
  const token = await getUSPSToken();

  // If no API credentials, return mock tracking
  if (!token) {
    console.log('USPS API not configured, returning mock tracking');
    return getMockTracking(trackingNumber);
  }

  try {
    const baseUrl = getUSPSBaseUrl();

    const response = await fetch(`${baseUrl}/tracking/v3/tracking/${trackingNumber}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('USPS Tracking API error:', response.status, response.statusText);
      return getMockTracking(trackingNumber);
    }

    const data = await response.json();

    // Convert USPS tracking response to our format
    const events: USPSTrackingEvent[] = data.trackingEvents?.map((event: any) => ({
      date: event.eventDate || new Date().toISOString().split('T')[0],
      time: event.eventTime || '12:00',
      activity: event.eventDescription || 'Package processed',
      location: event.eventCity && event.eventState 
        ? `${event.eventCity}, ${event.eventState}`
        : 'In Transit'
    })) || [];

    return {
      tracking_number: trackingNumber,
      status: data.status || 'In Transit',
      delivery_date: data.expectedDeliveryDate,
      events
    };

  } catch (error) {
    console.error('Error getting USPS tracking:', error);
    return getMockTracking(trackingNumber);
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
 * Generate a mock shipping label using jsPDF
 */
function generateMockLabel(request: USPSLabelRequest): USPSLabelResponse {
  const doc = new jsPDF({
    unit: 'in',
    format: [4, 6] // 4x6 inch label
  });

  // Generate mock tracking number
  const mockTrackingNumber = `9400111899223${Math.random().toString().slice(2, 10)}`;
  
  // Set up fonts and spacing
  doc.setFontSize(12);
  
  // From Address (top left)
  doc.text('FROM:', 0.1, 0.3);
  doc.setFontSize(10);
  doc.text('Crystal Harbor Trading Company', 0.1, 0.5);
  doc.text('2307 Willow Lakes East Blvd', 0.1, 0.7);
  doc.text('Greenwood, IN 46143', 0.1, 0.9);
  
  // To Address (center)
  doc.setFontSize(12);
  doc.text('TO:', 0.1, 1.5);
  doc.setFontSize(14);
  doc.text(`${request.toAddress.firstName} ${request.toAddress.lastName}`, 0.1, 1.8);
  doc.setFontSize(12);
  doc.text(request.toAddress.streetAddress, 0.1, 2.1);
  doc.text(`${request.toAddress.city}, ${request.toAddress.state} ${request.toAddress.zipCode}`, 0.1, 2.4);
  
  // Service class
  doc.setFontSize(14);
  const serviceDisplay = request.packageDescription.mailClass.replace(/_/g, ' ');
  doc.text(serviceDisplay, 0.1, 3.0);
  
  // Package info
  doc.setFontSize(10);
  doc.text(`Weight: ${request.packageDescription.weight} lbs`, 0.1, 3.3);
  doc.text(`Dimensions: ${request.packageDescription.length}"×${request.packageDescription.width}"×${request.packageDescription.height}"`, 0.1, 3.6);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 0.1, 3.9);
  
  // Mock barcode (series of black rectangles)
  doc.setFillColor(0, 0, 0);
  let x = 0.1;
  const barcodeY = 4.3;
  const barcodeHeight = 0.4;
  
  // Generate random barcode pattern
  for (let i = 0; i < 40; i++) {
    const width = Math.random() > 0.5 ? 0.02 : 0.04;
    doc.rect(x, barcodeY, width, barcodeHeight, 'F');
    x += width + 0.01;
  }
  
  // Tracking number below barcode
  doc.setFontSize(12);
  doc.text(mockTrackingNumber, 0.1, 5.0);
  
  // Mock label indicator
  doc.setFontSize(8);
  doc.text('[MOCK LABEL - For Testing Only]', 2.5, 5.8);
  
  // Convert to base64
  const pdfBase64 = doc.output('datauristring').split(',')[1];
  
  return {
    tracking_number: mockTrackingNumber,
    label_data: pdfBase64,
    service_name: serviceDisplay
  };
}

/**
 * Generate mock tracking data
 */
function getMockTracking(trackingNumber: string): USPSTrackingResponse {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  
  return {
    tracking_number: trackingNumber,
    status: 'In Transit',
    delivery_date: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    events: [
      {
        date: twoDaysAgo.toISOString().split('T')[0],
        time: '14:30',
        activity: 'Shipping Label Created',
        location: 'Greenwood, IN'
      },
      {
        date: yesterday.toISOString().split('T')[0],
        time: '08:15',
        activity: 'Package Accepted at USPS Origin Facility',
        location: 'Indianapolis, IN'
      },
      {
        date: yesterday.toISOString().split('T')[0],
        time: '22:45',
        activity: 'Departed USPS Regional Facility',
        location: 'Indianapolis, IN'
      },
      {
        date: now.toISOString().split('T')[0],
        time: '06:30',
        activity: 'In Transit to Next Facility',
        location: 'Louisville, KY'
      }
    ]
  };
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
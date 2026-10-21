import 'server-only';
import type { Address, Settings, Rate } from './types';
import { fallback } from './pricing';
let cached: { token: string; expires: number } | undefined;
async function token() {
  if (cached && cached.expires > Date.now() + 60000) return cached.token;
  const res = await fetch(
    `${process.env.USPS_API_BASE_URL || 'https://apis.usps.com'}/oauth2/v3/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: process.env.USPS_CLIENT_ID,
        client_secret: process.env.USPS_CLIENT_SECRET,
      }),
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    },
  );
  if (!res.ok) throw new Error('USPS authentication unavailable');
  const data = await res.json();
  if (!data.access_token) throw new Error('USPS token missing');
  cached = {
    token: data.access_token,
    expires: Date.now() + Number(data.expires_in || 3600) * 1000,
  };
  return cached.token;
}
export async function shipping(
  subtotal: number,
  weight: number,
  address: Address,
  s: Settings,
): Promise<Rate[]> {
  if (
    s.free_shipping_threshold_cents !== null &&
    subtotal >= s.free_shipping_threshold_cents
  )
    return [{ id: 'free', name: 'Free standard shipping', amount: 0 }];
  try {
    if (!process.env.USPS_CLIENT_ID || !process.env.USPS_CLIENT_SECRET)
      throw new Error('No USPS credentials');
    const access = await token();
    const services = [
      'USPS_GROUND_ADVANTAGE',
      'PRIORITY_MAIL',
      'PRIORITY_MAIL_EXPRESS',
    ];
    const names = [
      'USPS Ground Advantage',
      'USPS Priority Mail',
      'USPS Priority Mail Express',
    ];
    const results = await Promise.allSettled(
      services.map(async (mailClass, i) => {
        const res = await fetch(
          `${process.env.USPS_API_BASE_URL || 'https://apis.usps.com'}/prices/v3/base-rates/search`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${access}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              originZIPCode: s.origin_zip,
              destinationZIPCode: address.postal_code.slice(0, 5),
              weight: Math.max(0.001, weight + 0.25),
              length: Number(s.package_length),
              width: Number(s.package_width),
              height: Number(s.package_height),
              mailClass,
              processingCategory: 'MACHINABLE',
              rateIndicator: 'SP',
              destinationEntryFacilityType: 'NONE',
              priceType: 'RETAIL',
              mailingDate: new Date().toISOString().slice(0, 10),
            }),
            signal: AbortSignal.timeout(10000),
            cache: 'no-store',
          },
        );
        if (!res.ok) {
          if (res.status === 401) cached = undefined;
          throw new Error('USPS rate unavailable');
        }
        const data = await res.json();
        const prices = (data.rateOptions || [])
          .flatMap((o: { rates?: { price: number }[] }) =>
            (o.rates || []).map((r) => Number(r.price)),
          )
          .filter((n: number) => Number.isFinite(n) && n > 0);
        if (!prices.length) throw new Error('No rate');
        return {
          id: mailClass,
          name: names[i],
          amount: Math.round(Math.min(...prices) * 100),
        };
      }),
    );
    const rates = results.flatMap((r) =>
      r.status === 'fulfilled' ? [r.value] : [],
    );
    return rates.length ? rates : [fallback(subtotal, s)];
  } catch {
    return [fallback(subtotal, s)];
  }
}

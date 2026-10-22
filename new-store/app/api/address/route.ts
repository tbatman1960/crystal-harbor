import { NextResponse } from 'next/server';
import { z } from 'zod';
import { origin, failure } from '@/lib/http';
import { addressSchema } from '@/lib/validation';
const input = z.discriminatedUnion('action', [
  z.object({ action: z.literal('zip'), zip: z.string().regex(/^\d{5}$/) }),
  z.object({
    action: z.literal('suggest'),
    text: z.string().trim().min(4).max(200),
    session: z.string().uuid(),
  }),
  z.object({
    action: z.literal('details'),
    id: z.string().regex(/^[A-Za-z0-9_-]{1,250}$/),
    session: z.string().uuid(),
  }),
  z.object({ action: z.literal('validate'), address: addressSchema }),
]);
const reply = (value: unknown, status = 200) =>
  NextResponse.json(value, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
export async function POST(req: Request) {
  try {
    origin(req);
    const v = input.parse(await req.json());
    if (v.action === 'zip') {
      const r = await fetch(`https://api.zippopotam.us/us/${v.zip}`, {
        signal: AbortSignal.timeout(5000),
        next: { revalidate: 86400 },
      });
      if (r.status === 404)
        return reply(
          { error: 'ZIP code was not found. Check the five-digit ZIP code.' },
          400,
        );
      if (!r.ok)
        return reply(
          {
            error:
              'ZIP lookup is temporarily unavailable. You can enter your address manually.',
          },
          503,
        );
      const data = await r.json();
      return reply({
        places: (data.places || []).map((p: Record<string, string>) => ({
          city: p['place name'],
          state: p['state abbreviation'],
        })),
      });
    }
    const key = process.env.GOOGLE_MAPS_API_KEY;
    if (!key) return reply({ configured: false, suggestions: [] });
    const headers = {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': key,
    };
    if (v.action === 'suggest') {
      const r = await fetch(
        'https://places.googleapis.com/v1/places:autocomplete',
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            input: v.text,
            includedRegionCodes: ['us'],
            sessionToken: v.session,
          }),
          signal: AbortSignal.timeout(5000),
          cache: 'no-store',
        },
      );
      if (!r.ok)
        return reply(
          {
            error:
              'Address suggestions are unavailable. Please enter your address manually.',
          },
          503,
        );
      const d = await r.json();
      return reply({
        configured: true,
        suggestions: (d.suggestions || [])
          .flatMap(
            (s: {
              placePrediction?: { placeId: string; text: { text: string } };
            }) =>
              s.placePrediction
                ? [
                    {
                      id: s.placePrediction.placeId,
                      label: s.placePrediction.text.text,
                    },
                  ]
                : [],
          )
          .slice(0, 5),
      });
    }
    if (v.action === 'details') {
      const r = await fetch(
        `https://places.googleapis.com/v1/places/${encodeURIComponent(v.id)}?sessionToken=${encodeURIComponent(v.session)}`,
        {
          headers: { ...headers, 'X-Goog-FieldMask': 'addressComponents' },
          signal: AbortSignal.timeout(5000),
          cache: 'no-store',
        },
      );
      if (!r.ok)
        return reply(
          { error: 'Could not load that address. Please enter it manually.' },
          503,
        );
      const d = await r.json();
      const parts = d.addressComponents || [];
      const part = (type: string, short = false) => {
        const p = parts.find((p: { types: string[] }) =>
          p.types.includes(type),
        );
        return p ? (short ? p.shortText : p.longText) : '';
      };
      return reply({
        address: {
          line1: [part('street_number'), part('route')]
            .filter(Boolean)
            .join(' '),
          city:
            part('locality') ||
            part('sublocality_level_1') ||
            part('postal_town'),
          state: part('administrative_area_level_1', true),
          postal_code: part('postal_code'),
          country: part('country', true),
        },
      });
    }
    const r = await fetch(
      'https://addressvalidation.googleapis.com/v1:validateAddress',
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          address: {
            regionCode: 'US',
            addressLines: [v.address.line1, v.address.line2].filter(Boolean),
            locality: v.address.city,
            administrativeArea: v.address.state,
            postalCode: v.address.postal_code,
          },
          enableUspsCass: true,
        }),
        signal: AbortSignal.timeout(8000),
        cache: 'no-store',
      },
    );
    if (!r.ok)
      return reply(
        {
          error:
            'Street validation is unavailable. Please review your address manually.',
        },
        503,
      );
    const d = await r.json();
    const result = d.result || {};
    const verdict = result.verdict || {};
    const verified =
      result.uspsData?.dpvConfirmation === 'Y' &&
      verdict.addressComplete === true &&
      !verdict.hasUnconfirmedComponents;
    return reply({
      configured: true,
      verified,
      message: verified
        ? 'USPS delivery point confirmed.'
        : 'Please double-check the street, apartment, city, state and ZIP. This address could not be fully confirmed.',
    });
  } catch (e) {
    return failure(e);
  }
}

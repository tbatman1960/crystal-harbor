import { siteUrl } from '@/lib/site-url';
import { NextResponse } from 'next/server';
import { PersonalizationError } from './personalization/errors';
import { ZodError } from 'zod';
import { ShippingDestinationError } from './shipping-policy';
export class OriginError extends Error {}
export function origin(request: Request) {
  if (request.headers.get('origin') !== new URL(siteUrl()).origin)
    throw new OriginError(
      'This page is out of date. Refresh it and try again.',
    );
}
export function failure(e: unknown) {
  if (e instanceof OriginError)
    return NextResponse.json(
      { error: e.message, code: 'INVALID_ORIGIN' },
      { status: 403 },
    );
  if (e instanceof PersonalizationError)
    return NextResponse.json({ error: e.message }, { status: 400 });
  if (e instanceof ShippingDestinationError)
    return NextResponse.json(
      { error: e.message, code: 'SHIPPING_DESTINATION_RESTRICTED' },
      { status: 400 },
    );
  if (e instanceof ZodError)
    return NextResponse.json(
      {
        error: e.issues
          .map((i) => `${i.path.join('.')}: ${i.message}`)
          .join('; '),
      },
      { status: 400 },
    );
  const message = e instanceof Error ? e.message : 'Request failed';
  const status =
    message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 400;
  console.error('Request failed:', message);
  return NextResponse.json(
    {
      error:
        status === 403
          ? 'Forbidden'
          : status === 401
            ? 'Please sign in'
            : message.includes('unavailable') ||
                message.includes('cart') ||
                message.includes('stock') ||
                message.includes('price')
              ? message
              : 'Unable to complete this request. Check your input and try again.',
    },
    { status },
  );
}

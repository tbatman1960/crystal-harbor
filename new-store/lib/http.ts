import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
export function origin(request: Request) {
  if (request.headers.get('origin') !== new URL(process.env.SITE_URL!).origin)
    throw new Error('Invalid origin');
}
export function failure(e: unknown) {
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

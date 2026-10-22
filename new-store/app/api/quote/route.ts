import { NextResponse } from 'next/server';
import { quoteSchema } from '@/lib/validation';
import { quote } from '@/lib/checkout';
import { origin, failure } from '@/lib/http';
export async function POST(req: Request) {
  try {
    origin(req);
    const v = quoteSchema.parse(await req.json());
    const q = await quote(v.items, v.address);
    return NextResponse.json({
      subtotal: q.subtotal,
      tax: q.tax,
      rates: q.rates,
    });
  } catch (e) {
    return failure(e);
  }
}

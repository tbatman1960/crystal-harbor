import { NextResponse } from 'next/server';
import { z } from 'zod';
import { admin, check } from '@/lib/supabase';
import {
  productSchema,
  categorySchema,
  settingsSchema,
} from '@/lib/validation';
import { origin, failure } from '@/lib/http';
import { drainEmails } from '@/lib/email';
const envelope = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('product'), value: productSchema }),
  z.object({ kind: z.literal('category'), value: categorySchema }),
  z.object({ kind: z.literal('settings'), value: settingsSchema }),
  z.object({
    kind: z.literal('order'),
    value: z.object({
      id: z.string().uuid(),
      status: z.enum([
        'new',
        'processing',
        'shipped',
        'delivered',
        'cancelled',
      ]),
      tracking_number: z
        .string()
        .trim()
        .max(100)
        .regex(/^[a-zA-Z0-9 -]*$/)
        .nullable(),
    }),
  }),
  z.object({
    kind: z.literal('delete'),
    value: z.object({
      table: z.enum(['products', 'categories']),
      id: z.string().uuid(),
    }),
  }),
  z.object({ kind: z.literal('retry-email') }),
]);
export async function POST(req: Request) {
  try {
    origin(req);
    const client = await admin();
    const v = envelope.parse(await req.json());
    if (v.kind === 'product') {
      const { images, ...p } = v.value;
      check(
        (await client.rpc('save_product', { p_product: p, p_images: images }))
          .error,
      );
    } else if (v.kind === 'category') {
      check((await client.from('categories').upsert(v.value)).error);
    } else if (v.kind === 'settings') {
      check((await client.from('settings').update(v.value).eq('id', 1)).error);
    } else if (v.kind === 'order') {
      const { id, ...value } = v.value;
      check((await client.from('orders').update(value).eq('id', id)).error);
      await drainEmails();
    } else if (v.kind === 'delete') {
      check(
        (await client.from(v.value.table).delete().eq('id', v.value.id)).error,
      );
    } else await drainEmails();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}

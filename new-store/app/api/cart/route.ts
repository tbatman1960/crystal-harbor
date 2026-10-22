import { NextResponse } from 'next/server';
import { db, check } from '@/lib/supabase';
import { cartSchema } from '@/lib/validation';
import { origin, failure } from '@/lib/http';
export async function GET() {
  try {
    const client = db();
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user) return NextResponse.json({ items: [], authenticated: false });
    const { data, error } = await client
      .from('carts')
      .select('cart_items(product_id,quantity)')
      .eq('user_id', user.id)
      .maybeSingle();
    check(error);
    return NextResponse.json({
      authenticated: true,
      items: data?.cart_items || [],
    });
  } catch (e) {
    return failure(e);
  }
}
export async function PUT(req: Request) {
  try {
    origin(req);
    const items = cartSchema.parse(await req.json());
    const client = db();
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user) throw new Error('Unauthorized');
    check((await client.rpc('replace_cart', { p_items: items })).error);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}

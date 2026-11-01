import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db, service, check } from '@/lib/supabase';
import { origin, failure } from '@/lib/http';
import { verifyReviewToken } from '@/lib/review-token';
import { PersonalizationError } from '@/lib/personalization/errors';
export const dynamic = 'force-dynamic';
export async function GET(req: Request) {
  try {
    const product = z
      .string()
      .uuid()
      .parse(new URL(req.url).searchParams.get('product'));
    const client = service();
    const { data: p, error: pe } = await client
      .from('products')
      .select('id,design_slug')
      .eq('id', product)
      .single();
    check(pe);
    if (!p) throw new PersonalizationError('Product unavailable.');
    let q = client
      .from('studio_reviews')
      .select('id,rating,display_name,title,body,admin_reply,created_at')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(100);
    q = p.design_slug
      ? q.eq('design_slug', p.design_slug)
      : q.eq('product_id', product);
    const { data, error } = await q;
    check(error);
    return NextResponse.json(
      { reviews: data || [] },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (e) {
    return failure(e);
  }
}
export async function POST(req: Request) {
  try {
    origin(req);
    const v = z
      .object({
        order_item_id: z.string().uuid(),
        token: z.string().max(200).optional(),
        rating: z.number().int().min(1).max(5),
        display_name: z.string().trim().min(1).max(40),
        title: z.string().trim().min(2).max(100),
        body: z.string().trim().min(10).max(2000),
      })
      .parse(await req.json());
    const client = service();
    const { data: item, error } = await client
      .from('order_items')
      .select(
        'id,product_id,orders!inner(user_id,status),products(design_slug)',
      )
      .eq('id', v.order_item_id)
      .single();
    check(error);
    if (!item) throw new PersonalizationError('Order item unavailable.');
    const {
      data: { user },
    } = await db().auth.getUser();
    const o = item.orders as unknown as { user_id: string; status: string };
    const tokenId = v.token
      ? verifyReviewToken(v.token, process.env.SUPABASE_SERVICE_ROLE_KEY!)
      : null;
    if (!(user && o.user_id === user.id) && tokenId !== item.id)
      throw Error('Unauthorized');
    if (!['shipped', 'delivered'].includes(o.status))
      throw new PersonalizationError(
        'Reviews open after your order ships. Please come back then.',
      );
    const { error: write } = await client.from('studio_reviews').insert({
      order_item_id: item.id,
      product_id: item.product_id,
      design_slug:
        (item.products as unknown as { design_slug: string })?.design_slug ||
        null,
      rating: v.rating,
      display_name: v.display_name,
      title: v.title,
      body: v.body,
    });
    if (write?.code === '23505')
      throw new PersonalizationError(
        'A review has already been submitted for this item.',
      );
    check(write);
    return NextResponse.json({
      message:
        'Thank you! Your verified-purchase review is awaiting moderation.',
    });
  } catch (e) {
    return failure(e);
  }
}

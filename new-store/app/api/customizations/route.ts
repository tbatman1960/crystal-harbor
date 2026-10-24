import { PersonalizationError } from '@/lib/personalization/errors';
import { NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { origin, failure } from '@/lib/http';
import { db, service, check } from '@/lib/supabase';
import {
  customizationConfig,
  blanketSvg,
  printDimensions,
} from '@/lib/personalization/designs';
import { ensurePhotoSession, PHOTO_BUCKET } from '@/lib/personalization/server';
import { z } from 'zod';
export const runtime = 'nodejs';
export async function POST(req: Request) {
  let paths: string[] = [];
  try {
    origin(req);
    if (Number(req.headers.get('content-length') || 0) > 4500000)
      return NextResponse.json(
        { error: 'Please choose a smaller photo.' },
        { status: 413 },
      );
    const data = await req.formData();
    const config = customizationConfig.parse(
      JSON.parse(String(data.get('config'))),
    );
    const product_id = z.string().uuid().parse(data.get('product_id'));
    if (data.get('approved') !== 'true' || data.get('consent') !== 'true')
      throw new PersonalizationError(
        'Approve your preview and confirm permission to use the photo.',
      );
    const photo = data.get('photo');
    if (
      !(photo instanceof File) ||
      photo.type !== 'image/jpeg' ||
      photo.size > 3500000 ||
      photo.size < 100
    )
      throw new PersonalizationError(
        'Choose a JPEG photo smaller than 3.5 MB.',
      );
    const bytes = Buffer.from(await photo.arrayBuffer());
    if (bytes[0] !== 255 || bytes[1] !== 216 || bytes[2] !== 255)
      throw new PersonalizationError('Invalid JPEG photo.');
    const client = service();
    const { data: p, error: e } = await client
      .from('products')
      .select('id,is_active,shipping_group,size_label')
      .eq('id', product_id)
      .single();
    check(e);
    if (!p?.is_active || p.shipping_group !== 'blankets')
      throw new PersonalizationError('Choose an available blanket size.');
    const dimensions = printDimensions(p.size_label || '');
    const session_hash = ensurePhotoSession();
    const request_hash = createHash('sha256')
      .update(
        `${process.env.SUPABASE_SERVICE_ROLE_KEY}:${req.headers.get('x-nf-client-connection-ip') || req.headers.get('x-forwarded-for') || session_hash}`,
      )
      .digest('hex');
    const { count, error: limitError } = await client
      .from('personalizations')
      .select('id', { count: 'exact', head: true })
      .eq('request_hash', request_hash)
      .gte('created_at', new Date(Date.now() - 3600000).toISOString());
    check(limitError);
    if ((count || 0) >= 20)
      return NextResponse.json(
        { error: 'You have saved many designs. Please try again in an hour.' },
        { status: 429 },
      );
    const id = crypto.randomUUID();
    const source_path = `${id}/portrait.jpg`,
      artwork_path = `${id}/blanket.svg`;
    const svg = blanketSvg(
      config,
      `data:image/jpeg;base64,${bytes.toString('base64')}`,
      dimensions,
    );
    for (const [path, body, type] of [
      [source_path, bytes, 'image/jpeg'],
      [artwork_path, Buffer.from(svg), 'image/svg+xml'],
    ] as const) {
      check(
        (
          await client.storage
            .from(PHOTO_BUCKET)
            .upload(path, body, { contentType: type, upsert: false })
        ).error,
      );
      paths.push(path);
    }
    const {
      data: { user },
    } = await db().auth.getUser();
    check(
      (
        await client
          .from('personalizations')
          .insert({
            id,
            product_id,
            user_id: user?.id || null,
            session_hash,
            request_hash,
            config,
            source_path,
            artwork_path,
            approved_at: new Date().toISOString(),
          })
      ).error,
    );
    return NextResponse.json(
      { id, config },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (e) {
    if (paths.length) await service().storage.from(PHOTO_BUCKET).remove(paths);
    return failure(e);
  }
}
export async function GET() {
  try {
    const session_hash = ensurePhotoSession();
    const {
      data: { user },
    } = await db().auth.getUser();
    const client = service();
    const { data, error } = await client
      .from('personalizations')
      .select('id,config,created_at')
      .eq('deleting', false)
      .or(
        `session_hash.eq.${session_hash}${user ? `,user_id.eq.${user.id}` : ''}`,
      )
      .order('created_at', { ascending: false })
      .limit(100);
    check(error);
    const ids = (data || []).map((i) => i.id);
    const { data: ordered, error: e } = ids.length
      ? await client
          .from('order_items')
          .select('personalization_id')
          .in('personalization_id', ids)
      : { data: [], error: null };
    check(e);
    const orderedIds = new Set(
      (ordered || []).map((i) => i.personalization_id),
    );
    return NextResponse.json(
      {
        items: (data || []).map((i) => ({
          ...i,
          ordered: orderedIds.has(i.id),
        })),
      },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (e) {
    return failure(e);
  }
}

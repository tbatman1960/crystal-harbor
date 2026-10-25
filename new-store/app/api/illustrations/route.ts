import { NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { z } from 'zod';
import { origin, failure } from '@/lib/http';
import { db, service, check } from '@/lib/supabase';
import {
  customizationConfig,
  printDimensions,
} from '@/lib/personalization/designs';
import { ensurePhotoSession, PHOTO_BUCKET } from '@/lib/personalization/server';
import {
  generationSettings,
  generationSignature,
} from '@/lib/personalization/illustration';
import { PersonalizationError } from '@/lib/personalization/errors';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET() {
  const s = generationSettings();
  return NextResponse.json(
    {
      ready: s.ready,
      hourLimit: s.hourLimit,
      reason: s.ready
        ? null
        : 'Illustration generation is being set up by the store.',
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
export async function POST(req: Request) {
  let id: string | undefined;
  let path: string | undefined;
  try {
    origin(req);
    const settings = generationSettings();
    if (!settings.ready)
      return NextResponse.json(
        {
          error:
            'AI illustration generation is not enabled yet. The store must connect its image service.',
          code: 'ILLUSTRATION_SETUP_REQUIRED',
        },
        { status: 503 },
      );
    if (Number(req.headers.get('content-length') || 0) > 4500000)
      return NextResponse.json(
        { error: 'Please choose a smaller photo.' },
        { status: 413 },
      );
    const body = await req.formData();
    const config = customizationConfig.parse(
      JSON.parse(String(body.get('config'))),
    );
    const product_id = z.string().uuid().parse(body.get('product_id'));
    if (body.get('consent') !== 'true')
      throw new PersonalizationError(
        'Confirm permission to use the photo and send it to the illustration service.',
      );
    const photo = body.get('photo');
    if (
      !(photo instanceof File) ||
      photo.type !== 'image/jpeg' ||
      photo.size > 3500000 ||
      photo.size < 100
    )
      throw new PersonalizationError(
        'Choose a JPEG photo smaller than 3.5 MB.',
      );
    let normalized: Buffer;
    try {
      normalized = await sharp(Buffer.from(await photo.arrayBuffer()), {
        limitInputPixels: 40000000,
      })
        .rotate()
        .resize({
          width: 2400,
          height: 2400,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: 94 })
        .toBuffer();
    } catch {
      throw new PersonalizationError(
        'We could not read this photo. Please choose another clear portrait.',
      );
    }
    const metadata = await sharp(normalized).metadata();
    if (Math.min(metadata.width || 0, metadata.height || 0) < 300)
      throw new PersonalizationError(
        'Choose a portrait at least 300 pixels on each side.',
      );
    const client = service();
    const { data: p, error: e } = await client
      .from('products')
      .select('id,is_active,shipping_group,size_label')
      .eq('id', product_id)
      .single();
    check(e);
    if (!p?.is_active || p.shipping_group !== 'blankets')
      throw new PersonalizationError('Choose an available blanket size.');
    printDimensions(p.size_label || '');
    const session_hash = ensurePhotoSession();
    const request_hash = createHash('sha256')
      .update(
        `${process.env.SUPABASE_SERVICE_ROLE_KEY}:${req.headers.get('x-nf-client-connection-ip') || req.headers.get('x-forwarded-for') || session_hash}`,
      )
      .digest('hex');
    const {
      data: { user },
    } = await db().auth.getUser();
    id = crypto.randomUUID();
    path = `illustrations/${id}/portrait.jpg`;
    const { error: reserveError } = await client.rpc('reserve_illustration', {
      p_id: id,
      p_user: user?.id || null,
      p_session: session_hash,
      p_request: request_hash,
      p_product: product_id,
      p_config: config,
      p_source: path,
      p_hour: settings.hourLimit,
      p_daily: settings.dailyLimit,
    });
    if (reserveError) {
      if (reserveError.message.includes('Illustration limit'))
        return NextResponse.json(
          {
            error:
              'The illustration limit has been reached. Please try again later.',
          },
          { status: 429 },
        );
      check(reserveError);
    }
    check(
      (
        await client.storage
          .from(PHOTO_BUCKET)
          .upload(path, normalized, {
            contentType: 'image/jpeg',
            upsert: false,
          })
      ).error,
    );
    const expires = Date.now() + 10 * 60000;
    const response = await fetch(
      `${process.env.SITE_URL}/.netlify/functions/generate-illustration-background`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          expires,
          signature: generationSignature(
            id,
            expires,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
          ),
        }),
        signal: AbortSignal.timeout(10000),
      },
    );
    if (!response.ok)
      throw new PersonalizationError(
        'The illustration could not be started. Please try again later.',
      );
    return NextResponse.json(
      { id, status: 'queued' },
      { status: 202, headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (e) {
    if (id) {
      await service()
        .from('illustration_jobs')
        .update({
          status: 'failed',
          error_code: 'dispatch_failed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('status', 'queued');
    }
    // A dispatch timeout can be ambiguous. Keep the source if a worker claimed it.
    if (path && id) {
      const { data } = await service()
        .from('illustration_jobs')
        .select('status')
        .eq('id', id)
        .maybeSingle();
      if (data?.status === 'failed')
        await service().storage.from(PHOTO_BUCKET).remove([path]);
    }
    return failure(e);
  }
}

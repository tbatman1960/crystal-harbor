import { NextResponse } from 'next/server';
import { z } from 'zod';
import { origin, failure } from '@/lib/http';
import { service, check } from '@/lib/supabase';
import { ownedIllustration } from '@/lib/personalization/illustration-server';
import { PHOTO_BUCKET } from '@/lib/personalization/server';
import { generationErrorMessages } from '@/lib/personalization/illustration';
import { renderArtwork } from '@/lib/personalization/artwork';
import { PersonalizationError } from '@/lib/personalization/errors';
export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    z.string().uuid().parse(params.id);
    const job = await ownedIllustration(params.id);
    if (new URL(req.url).searchParams.get('image') === '1') {
      if (!['ready', 'approved'].includes(job.status) || !job.artwork_path)
        throw new PersonalizationError('The illustration is not ready yet.');
      const { data, error } = await service()
        .storage.from(PHOTO_BUCKET)
        .download(job.artwork_path);
      check(error);
      const rendered = await renderArtwork(
        Buffer.from(await data!.arrayBuffer()),
        'png',
      );
      return new NextResponse(new Uint8Array(rendered.bytes), {
        headers: {
          'Content-Type': 'image/png',
          'Content-Disposition': 'inline',
          'Cache-Control': 'private, no-store',
          'Content-Security-Policy':
            "default-src 'none'; img-src data:; sandbox",
        },
      });
    }
    return NextResponse.json(
      {
        id: job.id,
        status: job.status === 'purging' ? 'failed' : job.status,
        config: job.config,
        product_id: job.product_id,
        error:
          job.status === 'purging'
            ? 'This saved illustration was deleted. Please create a new one.'
            : job.error_code
              ? generationErrorMessages[job.error_code] ||
                generationErrorMessages.generation_failed
              : null,
        width: job.width,
        height: job.height,
      },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (e) {
    return failure(e);
  }
}
export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    origin(req);
    z.string().uuid().parse(params.id);
    z.object({ approved: z.literal(true) }).parse(await req.json());
    const job = await ownedIllustration(params.id);
    if (!['ready', 'approved'].includes(job.status))
      throw new PersonalizationError(
        'Wait for the finished illustration before approving it.',
      );
    const { data, error } = await service().rpc('approve_illustration', {
      p_id: job.id,
    });
    check(error);
    return NextResponse.json(
      { id: data, config: job.config, product_id: job.product_id },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (e) {
    return failure(e);
  }
}

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ownedCustomization, PHOTO_BUCKET } from '@/lib/personalization/server';
import { service, check } from '@/lib/supabase';
import { renderArtwork } from '@/lib/personalization/artwork';
import { failure } from '@/lib/http';
export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    z.string().uuid().parse(params.id);
    const row = await ownedCustomization(params.id);
    const search = new URL(req.url).searchParams;
    if (['artwork', 'preview'].includes(search.get('file') || '')) {
      const format =
        search.get('file') === 'preview'
          ? 'png'
          : z.enum(['png', 'jpg', 'svg']).parse(search.get('format') || 'png');
      const { data, error } = await service()
        .storage.from(PHOTO_BUCKET)
        .download(row.artwork_path);
      check(error);
      const rendered = await renderArtwork(
        Buffer.from(await data!.arrayBuffer()),
        format,
      );
      return new NextResponse(new Uint8Array(rendered.bytes), {
        headers: {
          'Content-Type': rendered.mime,
          'Content-Disposition':
            search.get('file') === 'preview'
              ? 'inline'
              : `attachment; filename="snugglebug-${row.id}.${rendered.extension}"`,
          'Cache-Control': 'private, no-store',
          'Content-Security-Policy':
            "default-src 'none'; img-src data:; style-src 'unsafe-inline'; sandbox",
        },
      });
    }
    return NextResponse.json(
      { id: row.id, config: row.config, approved_at: row.approved_at },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (e) {
    return failure(e);
  }
}
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { origin } = await import('@/lib/http');
    origin(req);
    z.string().uuid().parse(params.id);
    const row = await ownedCustomization(params.id, undefined, true);
    const client = service();
    const { data: allowed, error } = await client.rpc(
      'prepare_personalization_delete',
      { p_id: row.id },
    );
    check(error);
    if (!allowed)
      return NextResponse.json(
        {
          error:
            'This design is attached to an order, active checkout, or production export. Contact the store about deletion.',
        },
        { status: 409 },
      );
    const removed = await client.storage
      .from(PHOTO_BUCKET)
      .remove([row.source_path, row.artwork_path]);
    if (removed.error) {
      await client
        .from('personalizations')
        .update({ deleting: false })
        .eq('id', row.id);
      check(removed.error);
    }
    check(
      (await client.from('personalizations').delete().eq('id', row.id)).error,
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}

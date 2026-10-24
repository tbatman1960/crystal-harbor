import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ownedCustomization, PHOTO_BUCKET } from '@/lib/personalization/server';
import { service, check } from '@/lib/supabase';
import { failure } from '@/lib/http';
export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    z.string().uuid().parse(params.id);
    const row = await ownedCustomization(params.id);
    if (new URL(req.url).searchParams.get('file') === 'artwork') {
      const { data, error } = await service()
        .storage.from(PHOTO_BUCKET)
        .download(row.artwork_path);
      check(error);
      return new NextResponse(await data!.arrayBuffer(), {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Content-Disposition': `attachment; filename="snugglebug-${row.id}.svg"`,
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
            'This design is attached to an order or active checkout. Contact the store about deletion.',
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

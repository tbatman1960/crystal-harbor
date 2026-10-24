import { NextResponse } from 'next/server';
import { z } from 'zod';
import { admin, service, check } from '@/lib/supabase';
import { origin, failure } from '@/lib/http';
import { PHOTO_BUCKET } from '@/lib/personalization/server';
export async function POST(req: Request) {
  try {
    origin(req);
    await admin();
    z.object({ action: z.literal('cleanup') }).parse(await req.json());
    const client = service();
    const { data, error } = await client
      .from('personalizations')
      .select('id,source_path,artwork_path')
      .lt('created_at', new Date(Date.now() - 30 * 86400000).toISOString())
      .order('created_at')
      .limit(100);
    check(error);
    let removed = 0;
    for (const row of data || []) {
      const { data: allowed, error: e } = await client.rpc(
        'prepare_personalization_delete',
        { p_id: row.id },
      );
      check(e);
      if (!allowed) continue;
      const result = await client.storage
        .from(PHOTO_BUCKET)
        .remove([row.source_path, row.artwork_path]);
      if (result.error) {
        await client
          .from('personalizations')
          .update({ deleting: false })
          .eq('id', row.id);
        check(result.error);
      }
      check(
        (await client.from('personalizations').delete().eq('id', row.id)).error,
      );
      removed++;
    }
    return NextResponse.json({ removed });
  } catch (e) {
    return failure(e);
  }
}

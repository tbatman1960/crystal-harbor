import { NextResponse } from 'next/server';
import { z } from 'zod';
import { admin, service, check } from '@/lib/supabase';
import { origin, failure } from '@/lib/http';
import { PRINT_BUCKET } from '@/lib/production/spec';
import { PersonalizationError } from '@/lib/personalization/errors';
export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    await admin();
    z.string().uuid().parse(params.id);
    const client = service();
    const { data: job, error } = await client
      .from('print_exports')
      .select('*')
      .eq('id', params.id)
      .single();
    check(error);
    const query = new URL(req.url).searchParams;
    if (query.get('preview') === '1') {
      if (job.status !== 'ready' || !job.proof_path)
        throw new PersonalizationError('The print proof is not ready.');
      const { data, error: e } = await client.storage
        .from(PRINT_BUCKET)
        .download(job.proof_path);
      check(e);
      return new NextResponse(await data!.arrayBuffer(), {
        headers: {
          'Content-Type': 'image/jpeg',
          'Cache-Control': 'private, no-store',
        },
      });
    }
    if (query.get('download') === '1') {
      if (job.status !== 'ready' || !job.file_path)
        throw new PersonalizationError('The print file is not ready.');
      const manifest = query.get('file') === 'manifest';
      const filename = `snugglebug-${job.spec.size}-${job.spec.ppi}ppi-${job.id.slice(0, 8)}.${manifest ? 'json' : job.spec.format}`;
      const { data, error: e } = await client.storage
        .from(PRINT_BUCKET)
        .createSignedUrl(manifest ? job.manifest_path : job.file_path, 60, {
          download: filename,
        });
      check(e);
      return NextResponse.json(
        { url: data!.signedUrl },
        { headers: { 'Cache-Control': 'private, no-store' } },
      );
    }
    return NextResponse.json(
      {
        id: job.id,
        status: job.status,
        spec: job.spec,
        attempt: job.attempt,
        metrics: job.metrics,
        error_message: job.error_message,
        reviewed_at: job.reviewed_at,
      },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (e) {
    return failure(e);
  }
}
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    origin(req);
    const account = await admin();
    z.string().uuid().parse(params.id);
    z.object({
      reviewed: z.literal(true),
      accepted_quality: z.literal(true),
      accepted_dimensions: z.literal(true),
    }).parse(await req.json());
    const {
      data: { user },
    } = await account.auth.getUser();
    const { data, error } = await service()
      .from('print_exports')
      .update({ reviewed_at: new Date().toISOString(), reviewed_by: user!.id })
      .eq('id', params.id)
      .eq('status', 'ready')
      .select('id')
      .maybeSingle();
    check(error);
    if (!data)
      throw new PersonalizationError(
        'Wait for the completed print file before approving production.',
      );
    return NextResponse.json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    origin(req);
    await admin();
    z.string().uuid().parse(params.id);
    const client = service();
    const { data, error } = await client.rpc('prepare_print_export_delete', {
      p_id: params.id,
    });
    if (error)
      throw new PersonalizationError(
        'A processing print file cannot be removed. Wait for it to finish.',
      );
    const paths = [data.file_path, data.proof_path, data.manifest_path].filter(
      Boolean,
    );
    for (let n = 1; n <= data.attempt; n++)
      paths.push(
        `${params.id}/attempt-${n}/blanket.${data.format}`,
        `${params.id}/attempt-${n}/proof.jpg`,
        `${params.id}/attempt-${n}/specification.json`,
      );
    if (paths.length)
      check((await client.storage.from(PRINT_BUCKET).remove(paths)).error);
    check(
      (
        await client
          .from('print_exports')
          .delete()
          .eq('id', params.id)
          .eq('status', 'deleting')
      ).error,
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}

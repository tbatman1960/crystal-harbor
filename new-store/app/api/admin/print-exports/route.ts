import { NextResponse } from 'next/server';
import { z } from 'zod';
import { admin, service, check } from '@/lib/supabase';
import { origin, failure } from '@/lib/http';
import { printSpecSchema } from '@/lib/production/spec';
import { printSpecHash, printSignature } from '@/lib/production/security';
import { PersonalizationError } from '@/lib/personalization/errors';
export const dynamic = 'force-dynamic';
const fields =
  'id,personalization_id,spec,status,attempt,error_message,metrics,reviewed_at,created_at,completed_at';
export async function GET(req: Request) {
  try {
    await admin();
    const id = z
      .string()
      .uuid()
      .parse(new URL(req.url).searchParams.get('personalization_id'));
    const { data, error } = await service()
      .from('print_exports')
      .select(fields)
      .eq('personalization_id', id)
      .order('created_at', { ascending: false });
    check(error);
    return NextResponse.json(
      { items: data },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (e) {
    return failure(e);
  }
}
export async function POST(req: Request) {
  let jobId: string | undefined, attempt: number | undefined;
  try {
    origin(req);
    const account = await admin();
    const {
      data: { user },
    } = await account.auth.getUser();
    const body = z
      .object({ personalization_id: z.string().uuid(), spec: printSpecSchema })
      .parse(await req.json());
    const client = service();
    const { data: id, error } = await client.rpc('reserve_print_export', {
      p_personalization: body.personalization_id,
      p_spec: body.spec,
      p_hash: printSpecHash(body.spec),
      p_user: user!.id,
    });
    if (error)
      throw new PersonalizationError(
        error.message.includes('Two print files')
          ? error.message
          : error.message.includes('retry limit')
            ? 'Print export retry limit reached. Remove the failed export before retrying.'
            : 'The approved artwork is not available for export.',
      );
    const { data: job, error: e } = await client
      .from('print_exports')
      .select(fields)
      .eq('id', id)
      .single();
    check(e);
    if (!job) throw new PersonalizationError('Print export unavailable.');
    jobId = id;
    attempt = job.attempt;
    if (job.status === 'queued') {
      const expires = Date.now() + 10 * 60000;
      const response = await fetch(
        `${process.env.SITE_URL}/.netlify/functions/generate-print-background`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id,
            attempt,
            expires,
            signature: printSignature(
              id,
              attempt!,
              expires,
              process.env.SUPABASE_SERVICE_ROLE_KEY!,
            ),
          }),
          signal: AbortSignal.timeout(10000),
        },
      );
      if (!response.ok)
        throw new PersonalizationError(
          'The background export could not be started. Please retry.',
        );
    }
    return NextResponse.json(
      { job },
      { status: 202, headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (e) {
    if (jobId)
      await service()
        .from('print_exports')
        .update({
          status: 'failed',
          error_message: 'The export could not be started. Please retry.',
        })
        .eq('id', jobId)
        .eq('attempt', attempt)
        .eq('status', 'queued');
    return failure(e);
  }
}

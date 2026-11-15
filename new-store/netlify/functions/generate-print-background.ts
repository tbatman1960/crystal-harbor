import { z } from 'zod';
import { validPrintSignature } from '../../lib/production/security';
import { processPrintExport } from '../../lib/production/worker';
export default async function generate(req: Request) {
  if (req.method !== 'POST')
    return new Response('Method not allowed', { status: 405 });
  const v = z
    .object({
      id: z.string().uuid(),
      attempt: z.number().int().min(1).max(3),
      expires: z.number().int(),
      signature: z.string(),
    })
    .safeParse(await req.json().catch(() => null));
  if (
    !v.success ||
    !validPrintSignature(
      v.data.id,
      v.data.attempt,
      v.data.expires,
      v.data.signature,
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    )
  )
    return new Response('Unauthorized', { status: 401 });
  await processPrintExport(v.data.id, v.data.attempt);
  return new Response(null, { status: 204 });
}
export const config = { background: true };

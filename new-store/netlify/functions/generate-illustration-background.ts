import { z } from 'zod';
import { validGenerationSignature } from '../../lib/personalization/illustration';
import { processIllustration } from '../../lib/personalization/generation-worker';
export default async function generate(req: Request) {
  if (req.method !== 'POST')
    return new Response('Method not allowed', { status: 405 });
  const data = z
    .object({
      id: z.string().uuid(),
      expires: z.number().int(),
      signature: z.string(),
    })
    .safeParse(await req.json().catch(() => null));
  if (
    !data.success ||
    !validGenerationSignature(
      data.data.id,
      data.data.expires,
      data.data.signature,
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    )
  )
    return new Response('Unauthorized', { status: 401 });
  await processIllustration(data.data.id);
  return new Response(null, { status: 204 });
}
export const config = { background: true };

import { NextResponse } from 'next/server';
import { service } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
const expectedPreviewHost = 'vwljlpiwbuxzvbrwfuar.supabase.co';

/** Public readiness information only. Never returns configuration values or raw errors. */
export async function GET() {
  const values = {
    SITE_URL: process.env.SITE_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
  const missing = Object.entries(values)
    .filter(([, value]) => !value?.trim())
    .map(([name]) => name);
  const reply = (result: Record<string, unknown>, status = 503) =>
    NextResponse.json(result, {
      status,
      headers: { 'Cache-Control': 'no-store' },
    });
  if (missing.length)
    return reply({ ready: false, stage: 'configuration', missing });
  let databaseHost: string;
  let preview: boolean;
  try {
    databaseHost = new URL(values.NEXT_PUBLIC_SUPABASE_URL!).hostname;
    preview =
      new URL(values.SITE_URL!).hostname.startsWith('deploy-preview-') ||
      ['deploy-preview', 'branch-deploy'].includes(process.env.CONTEXT || '');
  } catch {
    return reply({
      ready: false,
      stage: 'configuration',
      issue: 'invalid_url',
    });
  }
  if (preview && databaseHost !== expectedPreviewHost) {
    return reply({
      ready: false,
      stage: 'configuration',
      issue: 'preview_uses_wrong_database',
    });
  }
  try {
    const client = service();
    const { data, error } = await client
      .from('settings')
      .select('id')
      .eq('id', 1)
      .maybeSingle();
    if (error) {
      const message = error.message.toLowerCase();
      const issue =
        error.code === 'PGRST205' || error.code === '42P01'
          ? 'schema_missing'
          : error.code === '42501'
            ? 'permission_denied'
            : /api.key|jwt|unauthorized|invalid.*key/.test(message)
              ? 'credentials_rejected'
              : 'database_unavailable';
      return reply({ ready: false, stage: 'database', issue });
    }
    if (!data)
      return reply({
        ready: false,
        stage: 'database',
        issue: 'settings_row_missing',
      });
    const { error: catalogError } = await client
      .from('products')
      .select('id')
      .limit(1);
    if (catalogError)
      return reply({
        ready: false,
        stage: 'database',
        issue: 'catalog_unavailable',
      });
    return reply({ ready: true, stage: 'ready' }, 200);
  } catch {
    return reply({
      ready: false,
      stage: 'database',
      issue: 'connection_failed',
    });
  }
}

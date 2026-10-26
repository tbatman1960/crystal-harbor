import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import { safeCatalogReference } from './catalog-reference';
import { blanketSvg, customizationConfig, printDimensions } from './designs';
import {
  generationSettings,
  redrawPortrait,
  illustratedBlanketSvg,
  IllustrationProviderError,
} from './illustration';
const BUCKET = 'personalization-private';
export async function processIllustration(id: string) {
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const settings = generationSettings();
  // Claim exactly once. Netlify retries must never repeat a billable model request.
  const { data: job, error: claimError } = await client
    .from('illustration_jobs')
    .update({ status: 'processing', started_at: new Date().toISOString() })
    .eq('id', id)
    .eq('status', 'queued')
    .select('*')
    .maybeSingle();
  if (claimError) throw new Error('Cannot claim illustration job');
  if (!job) return;
  let files: string[] = [];
  try {
    if (!settings.ready) throw new IllustrationProviderError('provider_setup');
    const config = customizationConfig.parse(job.config);
    const { data: product, error: productError } = await client
      .from('products')
      .select('size_label,is_active')
      .eq('id', job.product_id)
      .single();
    if (productError || !product?.is_active)
      throw new IllustrationProviderError('generation_failed');
    const { data: source, error: sourceError } = await client.storage
      .from(BUCKET)
      .download(job.source_path);
    if (sourceError || !source)
      throw new IllustrationProviderError('generation_failed');
    const photo = await sharp(Buffer.from(await source.arrayBuffer()), {
      limitInputPixels: 40000000,
    })
      .rotate()
      .jpeg({ quality: 94 })
      .toBuffer();
    let reference: Buffer;
    if (config.template === 'catalog') {
      if (!config.reference_image)
        throw new IllustrationProviderError('generation_failed');
      const url = safeCatalogReference(
        config.reference_image,
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
      );
      const response = await fetch(url, {
        redirect: 'error',
        signal: AbortSignal.timeout(20000),
      });
      if (!response.ok)
        throw new IllustrationProviderError('generation_failed');
      const bytes = Buffer.from(await response.arrayBuffer());
      if (bytes.length > 12000000)
        throw new IllustrationProviderError('generation_failed');
      reference = await sharp(bytes, { limitInputPixels: 40000000 })
        .rotate()
        .resize({
          width: 1536,
          height: 2048,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .png()
        .toBuffer();
    } else {
      reference = await sharp(Buffer.from(blanketSvg({ ...config, name: '' })))
        .resize(768, 1024)
        .png()
        .toBuffer();
    }
    const generated = await redrawPortrait(
      photo,
      reference,
      config,
      process.env.OPENAI_API_KEY!,
      settings.model,
    );
    const image = await sharp(generated, { limitInputPixels: 16000000 })
      .jpeg({ quality: 95, chromaSubsampling: '4:4:4' })
      .toBuffer();
    const metadata = await sharp(image).metadata();
    const artwork = Buffer.from(
      illustratedBlanketSvg(
        config,
        image,
        printDimensions(product.size_label || ''),
      ),
    );
    if (artwork.length > 5000000)
      throw new IllustrationProviderError('generation_failed');
    const artwork_path = `illustrations/${id}/drawn-blanket.svg`;
    const { error: uploadError } = await client.storage
      .from(BUCKET)
      .upload(artwork_path, artwork, {
        contentType: 'image/svg+xml',
        upsert: false,
      });
    if (uploadError) throw new IllustrationProviderError('generation_failed');
    files.push(artwork_path);
    const { error: saveError } = await client
      .from('illustration_jobs')
      .update({
        status: 'ready',
        artwork_path,
        width: metadata.width,
        height: metadata.height,
        completed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('status', 'processing');
    if (saveError) throw new IllustrationProviderError('generation_failed');
  } catch (e) {
    if (files.length) await client.storage.from(BUCKET).remove(files);
    const code =
      e instanceof IllustrationProviderError ? e.code : 'generation_failed';
    // Do not log photos, provider payloads, credentials or raw upstream errors.
    const { error } = await client
      .from('illustration_jobs')
      .update({
        status: 'failed',
        error_code: code,
        completed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('status', 'processing');
    if (error) throw new Error('Cannot record illustration failure');
  }
}

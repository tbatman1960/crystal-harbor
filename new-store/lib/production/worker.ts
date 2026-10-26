import { createClient } from '@supabase/supabase-js';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { makePrintFile } from './render';
import { PRINT_BUCKET, printSpecSchema } from './spec';
export async function processPrintExport(id: string, attempt: number) {
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { data: job, error: claimError } = await client
    .from('print_exports')
    .update({ status: 'processing', started_at: new Date().toISOString() })
    .eq('id', id)
    .eq('attempt', attempt)
    .eq('status', 'queued')
    .select('*')
    .maybeSingle();
  if (claimError) throw new Error('Cannot claim print export');
  if (!job) return;
  let directory: string | undefined;
  const paths: string[] = [];
  try {
    const spec = printSpecSchema.parse(job.spec);
    const { data: source, error: sourceError } = await client
      .from('personalizations')
      .select('artwork_path,deleting')
      .eq('id', job.personalization_id)
      .single();
    if (sourceError || !source || source.deleting)
      throw new Error('The approved source artwork is unavailable.');
    const { data: file, error: fileError } = await client.storage
      .from('personalization-private')
      .download(source.artwork_path);
    if (fileError || !file)
      throw new Error('The approved source artwork could not be read.');
    directory = await mkdtemp(join(tmpdir(), 'snuggle-print-'));
    const result = await makePrintFile(
      Buffer.from(await file.arrayBuffer()),
      spec,
      directory,
    );
    const prefix = `${id}/attempt-${attempt}`,
      file_path = `${prefix}/blanket.${spec.format}`,
      proof_path = `${prefix}/proof.jpg`,
      manifest_path = `${prefix}/specification.json`;
    const { filePath, proofPath, ...metrics } = result;
    const manifest = {
      export_id: id,
      personalization_id: job.personalization_id,
      spec,
      metrics,
      color_space: 'sRGB',
      review_required: true,
      created_at: new Date().toISOString(),
    };
    const manifestFile = join(directory, 'specification.json');
    await writeFile(manifestFile, JSON.stringify(manifest, null, 2));
    for (const [path, local, mime] of [
      [file_path, filePath, result.mime],
      [proof_path, proofPath, 'image/jpeg'],
      [manifest_path, manifestFile, 'application/json'],
    ]) {
      const { error } = await client.storage
        .from(PRINT_BUCKET)
        .upload(path, await readFile(local), {
          contentType: mime,
          upsert: false,
        });
      if (error)
        throw new Error('Print file upload failed. Please retry the export.');
      paths.push(path);
    }
    const { error } = await client
      .from('print_exports')
      .update({
        status: 'ready',
        file_path,
        proof_path,
        manifest_path,
        metrics,
        completed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('attempt', attempt)
      .eq('status', 'processing');
    if (error) throw new Error('Cannot save print export');
  } catch (e) {
    if (paths.length) await client.storage.from(PRINT_BUCKET).remove(paths);
    const message =
      e instanceof Error &&
      /exceeds 48 MB|physical dimensions|pixel dimensions|approved source|Print file upload/.test(
        e.message,
      )
        ? e.message
        : 'Print export could not be completed. Try a different format or lower resolution.';
    const { error } = await client
      .from('print_exports')
      .update({
        status: 'failed',
        error_message: message,
        completed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('attempt', attempt)
      .eq('status', 'processing');
    if (error) throw new Error('Cannot record print-export failure');
  } finally {
    if (directory) await rm(directory, { recursive: true, force: true });
  }
}

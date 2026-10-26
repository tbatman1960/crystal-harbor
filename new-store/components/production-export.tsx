'use client';
import { useEffect, useState } from 'react';
import {
  blanketSizes,
  printGeometry,
  printSpecSchema,
  type PrintSpec,
} from '@/lib/production/spec';
type Job = {
  id: string;
  spec: PrintSpec;
  status: string;
  attempt: number;
  created_at: string;
  started_at?: string;
  error_message?: string;
  reviewed_at?: string;
  metrics?: {
    bytes: number;
    quality_note: string;
    vector_paths?: number;
    width_pixels: number;
    height_pixels: number;
    source_sha256: string;
  };
};
export function ProductionExport({
  id,
  initialSize,
}: {
  id: string;
  initialSize?: string;
}) {
  const [open, setOpen] = useState(false),
    [spec, setSpec] = useState<PrintSpec>({
      size:
        blanketSizes.find((s) =>
          initialSize?.includes(s.replace('x', ' × ')),
        ) || '60x80',
      ppi: 150,
      bleed_inches: 0,
      fit: 'contain',
      format: 'svg',
    });
  const [jobs, setJobs] = useState<Job[]>([]),
    [busy, setBusy] = useState(''),
    [error, setError] = useState(''),
    [loaded, setLoaded] = useState(false),
    [links, setLinks] = useState<Record<string, string>>({}),
    [checks, setChecks] = useState<Record<string, boolean>>({});
  const parsed = printSpecSchema.safeParse(spec),
    g = printGeometry(spec);
  async function refresh() {
    const r = await fetch(`/api/admin/print-exports?personalization_id=${id}`, {
      cache: 'no-store',
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || 'Could not load print files.');
    setJobs(d.items);
    setLoaded(true);
  }
  const processing = jobs.some((j) =>
    ['queued', 'processing'].includes(j.status),
  );
  useEffect(() => {
    if (!open) return;
    let alive = true,
      t: ReturnType<typeof setTimeout>;
    async function load() {
      try {
        await refresh();
        if (alive) t = setTimeout(load, 4000);
      } catch (e) {
        if (alive) setError((e as Error).message);
      }
    }
    void load();
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [open, id, processing]);
  async function create() {
    setBusy('create');
    setError('');
    try {
      const v = printSpecSchema.parse(spec);
      const r = await fetch('/api/admin/print-exports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personalization_id: id, spec: v }),
      });
      const d = await r.json();
      if (!r.ok)
        throw new Error(d.error || 'Could not start the print export.');
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy('');
    }
  }
  async function download(job: Job, manifest = false) {
    setBusy(job.id);
    setError('');
    try {
      const r = await fetch(
        `/api/admin/print-exports/${job.id}?download=1${manifest ? '&file=manifest' : ''}`,
        { cache: 'no-store' },
      );
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Could not prepare the download.');
      setLinks((l) => ({ ...l, [job.id]: d.url }));
      const a = document.createElement('a');
      a.href = d.url;
      a.rel = 'noopener';
      document.body.append(a);
      a.click();
      a.remove();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy('');
    }
  }
  async function review(job: Job) {
    setBusy(job.id);
    setError('');
    try {
      const r = await fetch(`/api/admin/print-exports/${job.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewed: true,
          accepted_quality: true,
          accepted_dimensions: true,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Review could not be saved.');
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy('');
    }
  }
  async function remove(job: Job) {
    setBusy(job.id);
    setError('');
    try {
      const r = await fetch(`/api/admin/print-exports/${job.id}`, {
        method: 'DELETE',
      });
      const d = await r.json();
      if (!r.ok)
        throw new Error(d.error || 'Could not remove this print file.');
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy('');
    }
  }
  return (
    <details
      className="production-export mt-5"
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary className="cursor-pointer font-semibold">
        Create production print files
      </summary>
      {open && (
        <div className="mt-5 space-y-5">
          <p className="text-sm">
            Choose the blanket size and file type. The original
            customer-approved artwork is kept unchanged.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label>
              Blanket size
              <select
                value={spec.size}
                onChange={(e) =>
                  setSpec((s) => ({
                    ...s,
                    size: e.target.value as PrintSpec['size'],
                  }))
                }
              >
                {blanketSizes.map((s) => (
                  <option key={s} value={s}>
                    {s.replace('x', ' × ')} inches
                  </option>
                ))}
              </select>
            </label>
            <label>
              File type
              <select
                value={spec.format}
                onChange={(e) =>
                  setSpec((s) => ({
                    ...s,
                    format: e.target.value as PrintSpec['format'],
                  }))
                }
              >
                <option value="svg">Scalable SVG — vector conversion</option>
                <option value="png">PNG — enlarged approved artwork</option>
                <option value="jpg">JPEG — enlarged approved artwork</option>
                <option value="tiff">TIFF — enlarged approved artwork</option>
              </select>
            </label>
            <label>
              Print resolution
              <select
                value={spec.ppi}
                onChange={(e) =>
                  setSpec((s) => ({
                    ...s,
                    ppi: Number(e.target.value) as PrintSpec['ppi'],
                  }))
                }
              >
                <option value={100}>100 PPI</option>
                <option value={150}>150 PPI (default)</option>
                <option value={300}>300 PPI</option>
              </select>
            </label>
            <label>
              Bleed per side (inches)
              <select
                value={spec.bleed_inches}
                onChange={(e) =>
                  setSpec((s) => ({
                    ...s,
                    bleed_inches: Number(e.target.value),
                  }))
                }
              >
                {[0, 0.125, 0.25, 0.5, 1, 2].map((n) => (
                  <option value={n} key={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <label className="sm:col-span-2">
              Fit artwork
              <select
                value={spec.fit}
                onChange={(e) =>
                  setSpec((s) => ({
                    ...s,
                    fit: e.target.value as PrintSpec['fit'],
                  }))
                }
              >
                <option value="contain">
                  Keep all artwork — light background where needed
                </option>
                <option value="cover">
                  Fill canvas — edges may be cropped
                </option>
              </select>
            </label>
          </div>
          <p className="notice text-sm">
            {g.widthInches} × {g.heightInches} inches including bleed ·{' '}
            {g.widthPixels.toLocaleString()} × {g.heightPixels.toLocaleString()}{' '}
            pixels at {spec.ppi} PPI
            {spec.format === 'svg'
              ? ' when rasterized. The SVG itself is resolution independent.'
              : '.'}
          </p>
          <p className="text-sm text-ink/75">
            {spec.format === 'svg'
              ? 'Vector conversion creates real paths without an embedded photograph. It can simplify colors, facial detail and lettering; compare the proof before production.'
              : 'Enlargement preserves the approved composition but does not recover missing source detail. Confirm that the result meets your printer’s requirements.'}{' '}
            Bleed changes the outer canvas; inspect the trim area. Export size
            does not change the customer’s order.
          </p>
          {!parsed.success && (
            <p role="alert" className="text-sm text-red-800">
              {parsed.error.issues[0].message}
            </p>
          )}
          <button
            type="button"
            className="btn"
            disabled={!!busy || !parsed.success}
            onClick={() => void create()}
          >
            {busy === 'create' ? 'Starting export…' : 'Create print file'}
          </button>
          {error && (
            <p className="notice text-red-800" role="alert">
              {error}
            </p>
          )}
          {!loaded ? (
            <p role="status">Loading print files…</p>
          ) : jobs.length === 0 ? (
            <p className="text-sm">No production exports yet.</p>
          ) : (
            <div className="space-y-5">
              {jobs.map((job) => (
                <article
                  key={job.id}
                  className="rounded-xl border border-ink/15 bg-white p-4"
                >
                  <h3 className="font-semibold">
                    {job.spec.size.replace('x', ' × ')} in ·{' '}
                    {job.spec.format.toUpperCase()} · {job.spec.ppi} PPI
                  </h3>
                  <p className="text-sm mt-2" role="status">
                    {job.status === 'ready'
                      ? job.reviewed_at
                        ? 'Approved for production'
                        : 'File ready — production review required'
                      : job.status === 'queued'
                        ? 'Queued'
                        : job.status === 'processing'
                          ? 'Creating print file…'
                          : job.status === 'failed'
                            ? 'Export failed'
                            : 'Removing file…'}
                  </p>
                  {job.error_message && (
                    <p className="notice text-red-800">{job.error_message}</p>
                  )}
                  {job.status === 'ready' && (
                    <>
                      <img
                        src={`/api/admin/print-exports/${job.id}?preview=1`}
                        alt="Production export proof"
                        className="mt-4 max-h-80 w-auto rounded-lg"
                        loading="lazy"
                      />
                      <p className="text-xs mt-3">
                        {job.metrics?.quality_note}
                      </p>
                      <p className="text-xs mt-2">
                        {((job.metrics?.bytes || 0) / 1048576).toFixed(1)} MB
                        {job.metrics?.vector_paths
                          ? ` · ${job.metrics.vector_paths.toLocaleString()} vector paths`
                          : ''}{' '}
                        · sRGB
                      </p>
                      <div className="flex flex-wrap gap-3 mt-4">
                        <button
                          type="button"
                          className="btn secondary"
                          disabled={!!busy}
                          onClick={() => void download(job)}
                        >
                          {job.reviewed_at
                            ? 'Download production file'
                            : 'Download for inspection'}
                        </button>
                        <button
                          type="button"
                          className="link text-sm"
                          disabled={!!busy}
                          onClick={() => void download(job, true)}
                        >
                          Print specification
                        </button>
                      </div>
                      {links[job.id] && (
                        <a
                          href={links[job.id]}
                          className="link text-sm block mt-3"
                        >
                          Open download link (valid for 60 seconds)
                        </a>
                      )}
                      {!job.reviewed_at && (
                        <div className="mt-5 space-y-3">
                          <label className="custom-checkbox">
                            <input
                              type="checkbox"
                              checked={!!checks[job.id]}
                              onChange={(e) =>
                                setChecks((c) => ({
                                  ...c,
                                  [job.id]: e.target.checked,
                                }))
                              }
                            />
                            <span>
                              I inspected the full file, likeness, text, crop,
                              bleed, dimensions and resolution, and confirmed
                              that my printer accepts this file.
                            </span>
                          </label>
                          <button
                            type="button"
                            className="btn"
                            disabled={!!busy || !checks[job.id]}
                            onClick={() => void review(job)}
                          >
                            Approve for production
                          </button>
                        </div>
                      )}
                    </>
                  )}
                  {!['queued', 'processing'].includes(job.status) ||
                  Date.now() -
                    new Date(job.started_at || job.created_at).getTime() >
                    20 * 60000 ? (
                    <button
                      type="button"
                      className="photo-delete block mt-4"
                      disabled={!!busy}
                      onClick={() => void remove(job)}
                    >
                      Remove this export
                    </button>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </details>
  );
}

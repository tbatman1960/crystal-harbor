'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useCart } from './cart-provider';
import {
  defaultConfig,
  type CustomizationConfig,
} from '@/lib/personalization/designs';
import { catalogImage } from '@/lib/personalization/catalog-reference';
import { money, type Product } from '@/lib/types';
import { BlanketPreview } from './blanket-preview';
import { SizeSelector } from './size-selector';
type Job = {
  id: string;
  status: string;
  stage?: string;
  config: CustomizationConfig;
  product_id: string;
  error?: string;
  created_at?: string;
};
type Photo = { id: string; url: string; file: Blob; name: string };
const stages = ['queued', 'preparing', 'generating', 'finishing', 'ready'];
const stageNames = [
  'Queued',
  'Preparing your photos',
  'Personalizing the design',
  'Preparing your blanket preview',
  'Ready to review',
];
export function PersonalizationEditor({
  products,
  initialProductId,
}: {
  products: Product[];
  initialProductId?: string;
}) {
  const first = products.find((p) => p.id === initialProductId) || products[0];
  const [productId, setProductId] = useState(first?.id || ''),
    [name, setName] = useState(''),
    [faceMode, setFaceMode] = useState<'main' | 'all'>('main');
  const [photos, setPhotos] = useState<Photo[]>([]),
    [photoId, setPhotoId] = useState(''),
    [consent, setConsent] = useState(false),
    [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<Job[]>([]),
    [job, setJob] = useState<Job | null>(null),
    [selected, setSelected] = useState<Job | null>(null);
  const [serviceReady, setServiceReady] = useState<boolean | null>(null),
    [busy, setBusy] = useState(false),
    [uploading, setUploading] = useState(false),
    [error, setError] = useState(''),
    [message, setMessage] = useState(''),
    [pollError, setPollError] = useState(''),
    [pollVersion, setPollVersion] = useState(0);
  const [modal, setModal] = useState(false),
    [approved, setApproved] = useState(false),
    [imageReady, setImageReady] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null),
    photoRefs = useRef<Photo[]>([]),
    shown = useRef('');
  const { add, ready } = useCart();
  const product = products.find((p) => p.id === productId) || first;
  const active = !!job && ['queued', 'processing'].includes(job.status),
    photo = photos.find((p) => p.id === photoId);
  const family = products.filter((p) =>
    product.design_slug
      ? p.design_slug === product.design_slug
      : p.id === product.id,
  );
  const selectedProduct = products.find((p) => p.id === selected?.product_id);
  const selectedMatches = selected?.product_id === productId;
  const stageIndex = Math.max(
    0,
    stages.indexOf(
      job?.stage ||
        (job?.status === 'processing' ? 'generating' : job?.status || 'queued'),
    ),
  );
  function remember(j: Job) {
    setHistory((h) => [j, ...h.filter((x) => x.id !== j.id)].slice(0, 30));
  }
  function open(j: Job) {
    setSelected(j);
    setApproved(false);
    setImageReady(false);
    setModal(true);
    setError('');
  }
  useEffect(() => {
    let alive = true;
    fetch('/api/illustrations', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (alive) {
          setServiceReady(d.ready);
          setHistory(d.history || []);
          const running = (d.history || []).find((j: Job) =>
            ['queued', 'processing'].includes(j.status),
          );
          if (running) setJob(running);
        }
      })
      .catch(() => {
        if (alive) setServiceReady(false);
      });
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    photoRefs.current = photos;
  }, [photos]);
  useEffect(
    () => () => {
      photoRefs.current.forEach((p) => URL.revokeObjectURL(p.url));
    },
    [],
  );
  useEffect(() => {
    if (!job || !['queued', 'processing'].includes(job.status)) return;
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    async function poll() {
      try {
        const r = await fetch(`/api/illustrations/${job!.id}`, {
          cache: 'no-store',
        });
        const d = await r.json();
        if (!r.ok) throw Error(d.error || 'Cannot check progress');
        if (!alive) return;
        setJob(d);
        remember(d);
        setPollError('');
        if (['queued', 'processing'].includes(d.status))
          timer = setTimeout(poll, 3000);
        else if (
          ['ready', 'approved'].includes(d.status) &&
          shown.current !== d.id
        ) {
          shown.current = d.id;
          open(d);
        }
      } catch (e) {
        if (alive) setPollError((e as Error).message);
      }
    }
    void poll();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [job?.id, job?.status, pollVersion]);
  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (modal && !d.open) d.showModal();
    else if (!modal && d.open) d.close();
    if (!modal) return;
    // Reopening the same cached image does not fire another load event.
    const image = d.querySelector('img');
    if (image?.complete && image.naturalWidth > 0) setImageReady(true);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [modal, selected?.id]);
  async function upload(files: FileList | null) {
    if (!files) return;
    setLoading(true);
    setError('');
    const additions: Photo[] = [];
    try {
      const list = Array.from(files);
      if (list.length + photos.length > 5)
        throw Error(
          'Keep up to five source photos at a time. Remove one before uploading more.',
        );
      for (const f of list) {
        if (
          !['image/jpeg', 'image/png', 'image/webp'].includes(f.type) ||
          f.size > 12000000
        )
          throw Error(
            'Use JPG, PNG or WebP photos under 12 MB. Convert HEIC to JPG first.',
          );
        const bitmap = await createImageBitmap(f, {
          imageOrientation: 'from-image',
        });
        if (
          Math.min(bitmap.width, bitmap.height) < 300 ||
          bitmap.width * bitmap.height > 40000000
        ) {
          bitmap.close();
          throw Error(
            'Photos must be at least 300 pixels on each side and under 40 megapixels.',
          );
        }
        const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(bitmap.width * scale);
        canvas.height = Math.round(bitmap.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) throw Error('Please try another browser.');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        bitmap.close();
        const file = await new Promise<Blob>((resolve, reject) =>
          canvas.toBlob(
            (b) => (b ? resolve(b) : reject(Error('Cannot read photo'))),
            'image/jpeg',
            0.92,
          ),
        );
        if (file.size > 3500000) throw Error('Choose a smaller photo.');
        additions.push({
          id: crypto.randomUUID(),
          url: URL.createObjectURL(file),
          file,
          name: f.name,
        });
      }
      setPhotos((p) => [...p, ...additions]);
      setPhotoId(additions[0]?.id || photoId);
      setSelected(null);
      setApproved(false);
    } catch (e) {
      additions.forEach((p) => URL.revokeObjectURL(p.url));
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  async function generate() {
    if (active || busy) return;
    setBusy(true);
    setUploading(true);
    setJob(null);
    setError('');
    setMessage('');
    try {
      if (!photo || !consent)
        throw Error('Select a photo and confirm permission first.');
      const config: CustomizationConfig = {
        ...defaultConfig,
        template: 'catalog',
        name,
        face_mode: faceMode,
        render_style: 'photo',
        reference_name: product.name,
      };
      const form = new FormData();
      form.set('photo', photo.file, 'portrait.jpg');
      form.set('config', JSON.stringify(config));
      form.set('product_id', productId);
      form.set('consent', 'true');
      const r = await fetch('/api/illustrations', {
        method: 'POST',
        body: form,
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error || 'Cannot start your preview');
      const next = { ...d, config, product_id: productId };
      setJob(next);
      remember(next);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
      setBusy(false);
    }
  }
  async function save() {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      if (!selected || !approved || !imageReady || !consent || !selectedMatches)
        throw Error(
          'Review this preview and confirm photo permission before ordering.',
        );
      const r = await fetch(`/api/illustrations/${selected.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: true }),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error || 'Cannot save preview');
      add(d.product_id, 1, {
        customization_id: d.id,
        customization_label:
          `${d.config.reference_name || 'Personalized blanket'}${d.config.name ? ` · ${d.config.name}` : ''}`.slice(
            0,
            120,
          ),
      });
      remember({ ...selected, status: 'approved' });
      setModal(false);
      setMessage('Your selected design is approved and in your bag.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function startOver() {
    setModal(false);
    setSelected(null);
    setApproved(false);
    setImageReady(false);
    setConsent(false);
    setName('');
    setMessage(
      'Preview declined. Choose a photo below to start again. Previous previews remain in your history.',
    );
    document
      .querySelector('#studio-options')
      ?.scrollIntoView({ block: 'start' });
  }
  const imageSrc = selected
    ? `/api/illustrations/${selected.id}?image=1`
    : catalogImage(product) || '/placeholder.svg';
  return (
    <div className="studio-customizer">
      <dialog
        ref={dialog}
        className="studio-dialog"
        aria-labelledby="preview-title"
        onClose={() => setModal(false)}
        onCancel={() => setModal(false)}
      >
        <div className="flex justify-between gap-4">
          <h2 id="preview-title">Your blanket preview</h2>
          <button
            type="button"
            className="link"
            autoFocus
            onClick={() => setModal(false)}
          >
            Close
          </button>
        </div>
        <p className="text-sm mt-2">
          {selectedProduct?.name} · {selectedProduct?.size_label}
        </p>
        {selected && (
          <BlanketPreview
            key={selected.id}
            src={imageSrc}
            alt="Your personalized blanket mockup"
            onLoad={() => setImageReady(true)}
            onError={() => {
              setImageReady(false);
              setError(
                'Could not load this preview. Close and reopen it to try again.',
              );
            }}
          />
        )}
        {!imageReady && <p role="status">Loading preview…</p>}
        <p className="text-sm">
          Check face likeness, details, spelling and size. This is a digital
          mockup; print colors may vary.
        </p>
        <label className="studio-check">
          <input
            type="checkbox"
            checked={approved}
            disabled={!imageReady || busy}
            onChange={(e) => setApproved(e.target.checked)}
          />
          <span>I approve this artwork and selected size.</span>
        </label>
        {!consent && (
          <label className="studio-check">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            <span>I have permission to use the uploaded photo.</span>
          </label>
        )}
        {!selectedMatches && (
          <p className="notice">
            This preview belongs to a different size.{' '}
            <button
              className="link"
              onClick={() => setProductId(selected!.product_id)}
            >
              Select its original size
            </button>{' '}
            to order this exact version.
          </p>
        )}
        {error && (
          <p className="notice" role="alert">
            {error}
          </p>
        )}
        <button
          type="button"
          className="btn w-full"
          disabled={
            !approved ||
            !imageReady ||
            busy ||
            !consent ||
            !selectedMatches ||
            !ready
          }
          onClick={() => void save()}
        >
          {busy ? 'Saving…' : 'Approve this preview & add to bag'}
        </button>
        <div className="grid gap-3 mt-4">
          <button
            type="button"
            className="link"
            disabled={busy}
            onClick={startOver}
          >
            Decline preview & start over
          </button>
          <button
            type="button"
            className="link"
            onClick={() => setModal(false)}
          >
            Compare other previews
          </button>
          <Link className="link text-center" href="/shop">
            Abandon this design & return to shop
          </Link>
        </div>
        <p className="mt-4 text-xs text-ink/60">
          Declining or leaving does not order this design. Existing bag items
          remain.
        </p>
      </dialog>
      <div>
        <div className="studio-label">PERSONALIZE YOUR PICK</div>
        {selected ? (
          <BlanketPreview src={imageSrc} alt="Selected personalized design" />
        ) : (
          <img
            className="studio-original"
            src={imageSrc}
            alt={`${product.name} original design`}
          />
        )}
        <p className="text-sm text-center mt-3">
          {selected
            ? 'Your selected personalized preview'
            : 'Original design · your photo comes next'}
        </p>
        {selected && (
          <button className="btn w-full mt-4" onClick={() => open(selected)}>
            View personalized preview
          </button>
        )}
        <section className="mt-8" aria-labelledby="history-heading">
          <h2 id="history-heading" className="text-2xl">
            Your preview history
          </h2>
          <p className="text-sm my-3">
            Compare versions and choose the one to order. Private to this
            browser or account; previews expire after seven days.
          </p>
          {history.length ? (
            <div className="history-grid">
              {history.map((h, i) => (
                <button
                  type="button"
                  key={h.id}
                  disabled={!['ready', 'approved'].includes(h.status)}
                  onClick={() => open(h)}
                  aria-pressed={selected?.id === h.id}
                  className="history-card"
                >
                  {['ready', 'approved'].includes(h.status) ? (
                    <img
                      src={`/api/illustrations/${h.id}?image=1`}
                      alt={`Saved preview ${i + 1}`}
                      loading="lazy"
                    />
                  ) : (
                    <span>
                      {h.status === 'failed' ? 'Not completed' : 'Processing…'}
                    </span>
                  )}
                  <strong>{h.config.name || 'Your design'}</strong>
                  <small>
                    {products.find((p) => p.id === h.product_id)?.size_label}
                  </small>
                  <span>
                    {h.status === 'approved'
                      ? 'Approved'
                      : h.status === 'ready'
                        ? 'View & choose'
                        : h.status}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="notice">Your finished previews will appear here.</p>
          )}
        </section>
      </div>
      <section id="studio-options">
        <Link href={`/products/${product.slug}`} className="link text-sm">
          ← Product & sizes
        </Link>
        <h1 className="mt-5">
          Make it
          <br />
          <span className="text-[var(--party-pink)]">unmistakably them.</span>
        </h1>
        <h2 className="text-xl mt-4">{product.name}</h2>
        <p className="text-2xl font-bold mt-3">{money(product.price_cents)}</p>
        <p className="text-sm mt-3 mb-6">
          A familiar face, blended into your chosen design. Review before you
          buy.
        </p>
        <fieldset disabled={active || busy}>
          <SizeSelector
            sizes={family}
            selected={productId}
            onSelect={(id) => {
              setProductId(id);
              setSelected(null);
              setApproved(false);
            }}
          />
          <label className="mt-6">
            Name or nickname (optional)
            <input
              value={name}
              maxLength={24}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Amelia"
            />
          </label>
          <label className="mt-4">
            Faces to personalize
            <select
              value={faceMode}
              onChange={(e) => setFaceMode(e.target.value as 'main' | 'all')}
            >
              <option value="main">Main printed face</option>
              <option value="all">
                All prominent printed faces with the same person
              </option>
            </select>
          </label>
          <h3 className="mt-6">Your photos</h3>
          <p className="text-sm mt-2">
            Upload up to five clear portraits, then select one per preview.
            Photos stay on this device until you request generation.
          </p>
          <label className="studio-upload mt-4">
            {loading ? 'Preparing photos…' : '+ Upload photos'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              disabled={loading || photos.length >= 5}
              onChange={(e) => {
                void upload(e.target.files);
                e.target.value = '';
              }}
            />
            <span>JPG, PNG or WebP · up to 12 MB each</span>
          </label>
          <div className="photo-choices">
            {photos.map((p) => (
              <div key={p.id}>
                <button
                  className="photo-choice"
                  aria-pressed={p.id === photoId}
                  onClick={() => setPhotoId(p.id)}
                >
                  <img src={p.url} alt={`Select ${p.name}`} />
                  {p.id === photoId && <span>Selected</span>}
                </button>
                <button
                  type="button"
                  className="link text-xs"
                  onClick={() => {
                    URL.revokeObjectURL(p.url);
                    setPhotos((v) => v.filter((x) => x.id !== p.id));
                    if (photoId === p.id)
                      setPhotoId(photos.find((x) => x.id !== p.id)?.id || '');
                  }}
                >
                  Remove photo
                </button>
              </div>
            ))}
          </div>
          <label className="studio-check">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            <span>
              I have permission to use these photos, including a guardian’s
              permission for a child, and agree to send the selected photo to
              OpenAI to personalize my blanket.
            </span>
          </label>
          <button
            type="button"
            className="btn w-full"
            disabled={!ready || !photo || !consent || loading || !serviceReady}
            onClick={() => void generate()}
          >
            {uploading
              ? 'Uploading…'
              : active
                ? 'Personalizing…'
                : history.length
                  ? 'Create another preview'
                  : 'Create my personalized preview'}
          </button>
        </fieldset>
        {serviceReady === false && (
          <p className="notice" role="status">
            Image generation is temporarily unavailable. Please try later or
            contact us.
          </p>
        )}
        {(active || uploading) && (
          <div className="processing-card" role="status" aria-live="polite">
            <h3>Your preview is on its way</h3>
            {uploading && (
              <p className="text-sm mt-2">
                Uploading your selected photo securely…
              </p>
            )}
            <div
              className="stage-track"
              aria-label={`Step ${stageIndex + 1} of 5: ${stageNames[stageIndex]}`}
            >
              {stages.map((s, i) => (
                <span key={s} data-complete={i <= stageIndex} />
              ))}
            </div>
            <ol>
              {stageNames.map((s, i) => (
                <li
                  key={s}
                  aria-current={i === stageIndex ? 'step' : undefined}
                >
                  {i < stageIndex ? '✓' : i + 1} · {s}
                  {i === stageIndex ? ' — in progress' : ''}
                </li>
              ))}
            </ol>
            <p className="text-xs mt-3">
              Usually a few minutes. We show actual stages, not a percentage.
              Your preview opens automatically when ready.
            </p>
          </div>
        )}
        {pollError && (
          <p className="notice" role="alert">
            {pollError}{' '}
            <button
              className="link"
              onClick={() => setPollVersion((v) => v + 1)}
            >
              Check progress again
            </button>
          </p>
        )}
        {job?.status === 'failed' && (
          <p className="notice" role="alert">
            {job.error ||
              'This preview could not be completed. Please try another photo.'}
          </p>
        )}
        {error && !modal && (
          <p className="notice" role="alert">
            {error}
          </p>
        )}
        {message && (
          <p className="notice" role="status">
            {message}
          </p>
        )}
        <p className="text-xs text-ink/65 mt-4">
          Each request creates one preview using the selected photo. Up to three
          attempts per hour, subject to store limits. Image results can vary.
          Your chosen artwork is saved with your order.{' '}
          <Link href="/policies" className="link">
            Privacy & ordering
          </Link>
        </p>
        <Link href="/shop" className="link inline-block mt-5">
          Abandon this design & return to shop
        </Link>
      </section>
    </div>
  );
}

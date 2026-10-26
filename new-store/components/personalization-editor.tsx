'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useCart } from './cart-provider';
import {
  customizationLabel,
  customizationConfig,
  defaultConfig,
  type CustomizationConfig,
} from '@/lib/personalization/designs';
import type { Product } from '@/lib/types';
import { money } from '@/lib/types';
import { hasStock } from '@/lib/availability';
import { groupCatalog } from '@/lib/catalog-presentation';
import { catalogImage } from '@/lib/personalization/catalog-reference';
import { ArtworkDownload } from './artwork-download';
type Job = {
  id: string;
  status: string;
  config: CustomizationConfig;
  product_id: string;
  error?: string;
  width?: number;
  height?: number;
};
const DRAFT = 'snuggle-illustration-draft';
export function PersonalizationEditor({
  products,
  initialProductId,
}: {
  products: Product[];
  initialProductId?: string;
}) {
  const first = products.find((p) => p.id === initialProductId) || products[0];
  const previewRef = useRef<HTMLElement>(null),
    shown = useRef(''),
    autoStarted = useRef(false);
  const [autoRequested, setAutoRequested] = useState(false),
    [imageVersion, setImageVersion] = useState(0);
  const { add, ready } = useCart();
  const [config, setConfig] = useState<CustomizationConfig>({
      ...defaultConfig,
      template: 'catalog',
      face_mode: 'main',
      reference_name: first?.name,
    }),
    [productId, setProductId] = useState(first?.id || '');
  const [photo, setPhoto] = useState(''),
    [file, setFile] = useState<Blob | null>(null);
  const [consent, setConsent] = useState(false),
    [approved, setApproved] = useState(false),
    [imageReady, setImageReady] = useState(false);
  const [busy, setBusy] = useState(false),
    [loadingPhoto, setLoadingPhoto] = useState(false),
    [error, setError] = useState(''),
    [message, setMessage] = useState('');
  const [serviceReady, setServiceReady] = useState<boolean | null>(null),
    [job, setJob] = useState<Job | null>(null),
    [pollError, setPollError] = useState(''),
    [pollVersion, setPollVersion] = useState(0);
  const product = products.find((p) => p.id === productId),
    valid = customizationConfig.safeParse(config);
  const generating =
    busy || job?.status === 'queued' || job?.status === 'processing';
  const drawable = job && ['ready', 'approved'].includes(job.status);
  const designGroups = useMemo(() => groupCatalog(products), [products]);
  const sizes = products
    .filter((p) =>
      product?.design_slug
        ? p.design_slug === product.design_slug
        : p.id === product?.id,
    )
    .sort((a, b) => a.price_cents - b.price_cents);
  useEffect(() => {
    if (
      autoRequested &&
      file &&
      consent &&
      serviceReady &&
      !generating &&
      valid.success &&
      !autoStarted.current
    ) {
      autoStarted.current = true;
      setAutoRequested(false);
      void generate();
    }
  }, [autoRequested, file, consent, serviceReady, generating]);
  useEffect(() => {
    if (drawable && job && shown.current !== job.id) {
      shown.current = job.id;
      previewRef.current?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'auto'
          : 'smooth',
        block: 'start',
      });
    }
  }, [job?.id, job?.status]);
  useEffect(() => {
    let alive = true;
    fetch('/api/illustrations')
      .then(async (r) => {
        if (!r.ok) throw new Error();
        const d = await r.json();
        if (alive) setServiceReady(d.ready);
      })
      .catch(() => {
        if (alive) setServiceReady(false);
      });
    try {
      const stored = JSON.parse(localStorage.getItem(DRAFT) || 'null');
      if (
        stored &&
        stored.config?.template === 'catalog' &&
        customizationConfig.safeParse(stored.config).success &&
        products.some((p) => p.id === stored.product_id) &&
        /^[a-f0-9-]{36}$/.test(stored.id)
      ) {
        setConfig(customizationConfig.parse(stored.config));
        setProductId(stored.product_id);
        setJob({ ...stored, status: 'queued' });
      }
    } catch {}
    return () => {
      alive = false;
    };
  }, [products]);
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
        if (!r.ok)
          throw new Error(d.error || 'Cannot check your illustration.');
        if (!alive) return;
        setJob(d);
        setPollError('');
        if (['queued', 'processing'].includes(d.status))
          timer = setTimeout(poll, 3000);
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
  function resetDesign() {
    setApproved(false);
    setImageReady(false);
    setMessage('');
    setJob(null);
    setPollError('');
    try {
      localStorage.removeItem(DRAFT);
    } catch {}
  }
  function selectProduct(p: Product) {
    resetDesign();
    setAutoRequested(false);
    setProductId(p.id);
    setConfig((c) => ({
      ...c,
      template: 'catalog',
      reference_name: p.name,
      reference_image: undefined,
    }));
  }
  function change<K extends keyof CustomizationConfig>(
    key: K,
    value: CustomizationConfig[K],
  ) {
    resetDesign();
    setConfig((c) => ({ ...c, [key]: value }));
  }
  async function upload(f?: File) {
    if (!f) return;
    resetDesign();
    autoStarted.current = false;
    setAutoRequested(false);
    setPhoto('');
    setFile(null);
    setError('');
    setLoadingPhoto(true);
    try {
      if (
        !['image/jpeg', 'image/png', 'image/webp'].includes(f.type) ||
        f.size > 12000000
      )
        throw new Error(
          'Choose a JPG, PNG, or WebP photo smaller than 12 MB. Export HEIC photos as JPG first.',
        );
      const bitmap = await createImageBitmap(f, {
        imageOrientation: 'from-image',
      });
      if (
        bitmap.width * bitmap.height > 40000000 ||
        Math.min(bitmap.width, bitmap.height) < 300
      ) {
        bitmap.close();
        throw new Error(
          'Choose a clear portrait at least 300 pixels on each side and under 40 megapixels.',
        );
      }
      const scale = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx)
        throw new Error(
          'Your browser cannot prepare this photo. Please try Chrome or Safari.',
        );
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      const jpeg = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (b) =>
            b ? resolve(b) : reject(new Error('Could not prepare this photo.')),
          'image/jpeg',
          0.92,
        ),
      );
      if (jpeg.size > 3500000)
        throw new Error('Please choose a smaller photo.');
      setFile(jpeg);
      setPhoto(canvas.toDataURL('image/jpeg', 0.92));
      setAutoRequested(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoadingPhoto(false);
    }
  }
  async function generate() {
    if (generating) return;
    setError('');
    setMessage('');
    setBusy(true);
    setApproved(false);
    setImageReady(false);
    try {
      customizationConfig.parse(config);
      if (!file || !consent || !product)
        throw new Error(
          'Upload a portrait and confirm photo permission first.',
        );
      const form = new FormData();
      form.set('photo', file, 'portrait.jpg');
      form.set('config', JSON.stringify(config));
      form.set('product_id', productId);
      form.set('consent', 'true');
      const r = await fetch('/api/illustrations', {
        method: 'POST',
        body: form,
      });
      const d = await r.json();
      if (!r.ok)
        throw new Error(d.error || 'Could not start the illustration.');
      const next = {
        id: d.id,
        status: d.status,
        config,
        product_id: productId,
      };
      setJob(next);
      try {
        localStorage.setItem(DRAFT, JSON.stringify(next));
      } catch {}
    } catch (e) {
      setError((e as Error).message);
      setImageReady(!!drawable);
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    setError('');
    setBusy(true);
    try {
      if (!job || !drawable || !imageReady || !approved || !consent)
        throw new Error(
          'Review and approve the finished illustration before adding it to your bag.',
        );
      const r = await fetch(`/api/illustrations/${job.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: true }),
      });
      const d = await r.json();
      if (!r.ok)
        throw new Error(d.error || 'Could not save the approved illustration.');
      add(d.product_id, 1, {
        customization_id: d.id,
        customization_label: `${customizationLabel(d.config)}${d.config.name ? ` · ${d.config.name}` : ''}`,
      });
      setJob({ ...job, status: 'approved' });
      setMessage('Your approved illustration is saved and added to your bag.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="personalize-layout">
      <section
        ref={previewRef}
        className="personalize-preview scroll-mt-5"
        aria-live="polite"
        aria-label="Personalized blanket preview"
      >
        <div className="preview-topline">
          <span>✦ YOUR VERY OWN MAIN CHARACTER ✦</span>
          <span className="preview-pill">
            {drawable ? 'Your personalized preview' : 'Original product'}
          </span>
        </div>
        <div className="blanket-mockup">
          {drawable ? (
            <img
              className="block h-auto w-full"
              src={`/api/illustrations/${job!.id}?image=1&v=${imageVersion}`}
              alt={`Personalized ${customizationLabel(config)} blanket preview for ${config.name || 'you'}`}
              onLoad={() => setImageReady(true)}
              onError={() => {
                setImageReady(false);
                setError(
                  'We could not load the finished artwork. Use Reload preview below to try again.',
                );
              }}
            />
          ) : (
            <img
              className="block h-auto w-full"
              src={
                product
                  ? catalogImage(product) || '/placeholder.svg'
                  : '/placeholder.svg'
              }
              alt={`${product?.name || 'Blanket'} — original production product`}
            />
          )}
        </div>
        {(job?.status === 'queued' || job?.status === 'processing') && (
          <div className="illustration-progress" role="status">
            <span className="illustration-spinner" aria-hidden="true" />
            <strong>Drawing your cozy character…</strong>
            <p>
              We’re redrawing the face, hair, and scene together. This can take
              a few minutes. You can leave this page and return in this browser.
            </p>
          </div>
        )}
        <p className="preview-caption">
          {drawable
            ? 'Drawn together. Made for you. ♡'
            : generating
              ? 'A little illustration magic is on its way.'
              : 'Your selected blanket, before personalization.'}
        </p>
        <p className="text-xs text-ink/65 mt-3">
          {drawable
            ? 'Check likeness, details, spelling and size before approving. Screen colors may differ from the printed blanket.'
            : 'This is the actual catalog product. After processing, your personalized version will appear here automatically.'}
        </p>
        {drawable && (
          <div className="mt-4 space-y-3">
            <p role="status" className="font-semibold">
              Your personalized preview is ready.
            </p>
            <button
              type="button"
              className="link text-sm"
              onClick={() => {
                setImageReady(false);
                setImageVersion((v) => v + 1);
              }}
            >
              Reload preview
            </button>
            <a
              className="link text-sm block"
              href={`/api/illustrations/${job!.id}?image=1`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open larger preview ↗
            </a>
            {job?.status === 'approved' && <ArtworkDownload id={job.id} />}
          </div>
        )}
        {job?.status === 'failed' && (
          <p className="notice text-red-800" role="alert">
            {job.error ||
              'Your photo could not be processed. Please try again.'}
          </p>
        )}
      </section>
      <section className="personalize-controls">
        <p className="collection-label">THE YOU COLLECTION · ILLUSTRATED</p>
        <h1>
          Not just in
          <br />
          the picture.
          <br />
          <span className="text-[var(--party-pink)]">Part of the art.</span>
        </h1>
        <p className="mt-4 text-ink/75">
          A favorite face, redrawn into a world of their own. Matching lines,
          colors, and character—one illustration that belongs together.
        </p>
        <h2 className="mt-5 text-xl">{product?.name}</h2>
        <p className="mt-3 text-2xl font-bold">
          {product ? money(product.price_cents) : 'Choose a size'}{' '}
          <span className="text-sm font-normal">
            · personalized just for you
          </span>
        </p>
        {serviceReady === false && (
          <div className="notice mt-5" role="status">
            <strong>Illustration generation is being set up.</strong>
            <p>
              You can explore styles and sizes. Generating your personalized
              artwork will be available once the store connects its image
              service.
            </p>
          </div>
        )}
        {!ready && (
          <p className="notice mt-4" role="status">
            Preparing the customizer…
          </p>
        )}
        <form
          className="space-y-7 mt-7"
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <fieldset disabled={!!generating || !ready}>
            <legend className="custom-step">
              <span>1</span> Choose a blanket design
            </legend>
            <div className="catalog-design-options">
              {designGroups.map(({ product: p }) => (
                <button
                  type="button"
                  key={p.id}
                  aria-pressed={
                    product?.design_slug
                      ? p.design_slug === product.design_slug
                      : p.id === product?.id
                  }
                  onClick={() =>
                    selectProduct(
                      products.find(
                        (v) =>
                          v.design_slug === p.design_slug &&
                          v.size_label === product?.size_label,
                      ) || p,
                    )
                  }
                >
                  <img src={catalogImage(p) || '/placeholder.svg'} alt="" />
                  <span>{p.name}</span>
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset disabled={!!generating || !ready}>
            <legend className="custom-step">
              <span>2</span> Choose your cozy size
            </legend>
            <div className="custom-size-options">
              {sizes.map((p) => (
                <button
                  type="button"
                  key={p.id}
                  disabled={!hasStock(p)}
                  aria-pressed={productId === p.id}
                  className={productId === p.id ? 'selected' : ''}
                  onClick={() => {
                    selectProduct(p);
                  }}
                >
                  <strong>{p.size_label}</strong>
                  <span>{money(p.price_cents)}</span>
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset className="space-y-4" disabled={!!generating || !ready}>
            <legend className="custom-step">
              <span>3</span> Meet the main character
            </legend>
            <label>
              Name or nickname <span className="font-normal">(optional)</span>
              <input
                value={config.name}
                maxLength={24}
                placeholder="e.g. Olivia"
                onChange={(e) => change('name', e.target.value)}
              />
            </label>
            <label>
              Which printed faces should change?
              <select
                value={config.face_mode || 'main'}
                onChange={(e) =>
                  change('face_mode', e.target.value as 'main' | 'all')
                }
              >
                <option value="main">Main character face</option>
                <option value="all">All prominent printed faces</option>
              </select>
            </label>
            <label className="custom-checkbox">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => {
                  setConsent(e.target.checked);
                  setApproved(false);
                }}
              />
              <span>
                I have permission to use this photo, including a parent or
                guardian’s permission for a child’s photo. I agree to send the
                photo to OpenAI to create the illustration.
              </span>
            </label>
            <label className="photo-upload">
              {loadingPhoto
                ? 'Preparing your photo…'
                : photo
                  ? '♡ Choose a different photo'
                  : '↑ Upload a face photo'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={loadingPhoto}
                onChange={(e) => void upload(e.target.files?.[0])}
              />
              <span className="font-normal text-xs">
                JPG, PNG, WebP · up to 12 MB · one clear face
              </span>
            </label>
            {photo && (
              <div className="illustration-source">
                <img src={photo} alt="Your source portrait" />
                <p>
                  Use a clear, front-facing photo without sunglasses. The
                  drawing will use this person’s face, hair, and features as its
                  reference.
                </p>
              </div>
            )}

            <p className="text-xs text-ink/65">
              Choose your design, size, and name first. With permission
              confirmed, uploading a photo starts processing automatically.
              Changes afterward require an updated preview.
            </p>
            {!valid.success && (
              <p role="alert" className="text-red-800">
                Use letters, numbers, spaces, or simple punctuation in the name.
              </p>
            )}

            <button
              type="button"
              className="btn party-button w-full"
              disabled={
                !serviceReady ||
                !file ||
                !consent ||
                loadingPhoto ||
                !valid.success ||
                !product
              }
              onClick={() => void generate()}
            >
              {generating
                ? 'Processing your photo…'
                : drawable
                  ? 'Generate another version ↻'
                  : 'Generate personalized preview ✦'}
            </button>
            {autoRequested && !consent && (
              <p className="notice" role="status">
                Your photo is ready. Confirm permission above and processing
                will start automatically.
              </p>
            )}
            <p className="text-xs text-ink/65">
              AI drawings can vary. Review likeness and details carefully. Up to
              three generation attempts per hour; availability also depends on
              the store’s daily limit.
            </p>
          </fieldset>
          {pollError && (
            <p className="notice" role="alert">
              {pollError}{' '}
              <button
                type="button"
                className="link"
                onClick={() => {
                  setPollError('');
                  setPollVersion((v) => v + 1);
                }}
              >
                Check progress again
              </button>
            </p>
          )}
          {job?.status === 'failed' && (
            <p className="notice text-red-800" role="alert">
              {job.error ||
                'This illustration could not be completed. Please try again later.'}
            </p>
          )}
          <fieldset disabled={!drawable || !imageReady || !!generating}>
            <legend className="custom-step">
              <span>4</span> Your preview. Your approval.
            </legend>
            <label className="custom-checkbox">
              <input
                type="checkbox"
                checked={approved}
                onChange={(e) => setApproved(e.target.checked)}
              />
              <span>
                I have reviewed the personalized preview and approve the
                likeness, artwork, spelling, and selected size.
              </span>
            </label>
          </fieldset>
          {error && (
            <p className="notice text-red-800" role="alert">
              {error}
            </p>
          )}
          <button
            className="btn party-button w-full"
            disabled={
              !!generating ||
              !drawable ||
              !imageReady ||
              !approved ||
              !consent ||
              !ready
            }
          >
            {busy ? 'Saving…' : 'Approve preview & add to bag →'}
          </button>
          {message && (
            <p role="status" className="notice">
              {message}{' '}
              <Link className="link" href="/cart">
                View bag & checkout →
              </Link>
            </p>
          )}
          <div className="custom-assurances">
            <span>♡ Private photo storage</span>
            <span>✦ $7 shipping + $1 each extra</span>
            <span>✓ Approved artwork saved with your order</span>
          </div>
          <p className="text-xs text-ink/65">
            Photos are sent to OpenAI only when you request a drawing.
            Unapproved generations expire after seven days. Up to five blankets
            per order; delivery available outside Indiana.{' '}
            <Link className="link" href="/policies">
              Photo privacy &amp; ordering details
            </Link>
          </p>
        </form>
      </section>
    </div>
  );
}

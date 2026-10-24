'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useCart } from './cart-provider';
import {
  blanketSvg,
  customizationConfig,
  defaultConfig,
  templates,
  printDimensions,
  type CustomizationConfig,
} from '@/lib/personalization/designs';
import type { Product } from '@/lib/types';
import { money } from '@/lib/types';
import { hasStock } from '@/lib/availability';
export function PersonalizationEditor({ products }: { products: Product[] }) {
  const { add, ready } = useCart();
  const [config, setConfig] = useState<CustomizationConfig>(defaultConfig);
  const [productId, setProductId] = useState(products[0]?.id || '');
  const [photo, setPhoto] = useState('');
  const [file, setFile] = useState<Blob | null>(null);
  const [approved, setApproved] = useState(false),
    [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false),
    [loadingPhoto, setLoadingPhoto] = useState(false),
    [error, setError] = useState(''),
    [message, setMessage] = useState('');
  const [quality, setQuality] = useState('');
  const product = products.find((p) => p.id === productId);
  const valid = customizationConfig.safeParse(config);
  const svg = useMemo(
    () =>
      blanketSvg(
        {
          ...config,
          name: customizationConfig.shape.name.safeParse(config.name).success
            ? config.name
            : '',
        },
        photo || undefined,
        product?.size_label ? printDimensions(product.size_label) : undefined,
      ),
    [config, photo, product],
  );
  useEffect(() => {
    setApproved(false);
    setMessage('');
  }, [config, photo, productId]);
  function change<K extends keyof CustomizationConfig>(
    key: K,
    value: CustomizationConfig[K],
  ) {
    setConfig((c) => ({ ...c, [key]: value }));
  }
  async function upload(f?: File) {
    if (!f) return;
    setError('');
    setLoadingPhoto(true);
    setMessage('');
    setApproved(false);
    setPhoto('');
    setFile(null);
    try {
      if (
        !['image/jpeg', 'image/png', 'image/webp'].includes(f.type) ||
        f.size > 12000000
      )
        throw new Error(
          'Choose a JPG, PNG, or WebP photo smaller than 12 MB. HEIC photos must be exported as JPG first.',
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
          'Use a clear photo at least 300 pixels on each side and under 40 megapixels.',
        );
      }
      const scale = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx)
        throw new Error(
          'Your browser cannot prepare this photo. Try a current version of Chrome or Safari.',
        );
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      const jpeg = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (b) =>
            b ? resolve(b) : reject(new Error('Could not prepare the photo.')),
          'image/jpeg',
          0.92,
        ),
      );
      if (jpeg.size > 3500000)
        throw new Error(
          'This photo is too detailed to upload. Please choose a smaller image.',
        );
      setPhoto(canvas.toDataURL('image/jpeg', 0.92));
      setFile(jpeg);
      setQuality(
        Math.min(canvas.width, canvas.height) < 1000
          ? 'This photo may look soft when printed. A larger, close-up portrait will give a better result.'
          : 'Tip: fill the oval with the face. Use a clear, close-up photo for the best print.',
      );
      setConfig((c) => ({ ...c, zoom: 1, x: 0, y: 0 }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoadingPhoto(false);
    }
  }
  async function save() {
    setError('');
    setBusy(true);
    try {
      customizationConfig.parse(config);
      if (!file || !approved || !consent || !product)
        throw new Error(
          'Upload a photo, approve the preview, and confirm photo permission.',
        );
      const form = new FormData();
      form.set('photo', file, 'portrait.jpg');
      form.set('product_id', productId);
      form.set('config', JSON.stringify(config));
      form.set('approved', 'true');
      form.set('consent', 'true');
      const res = await fetch('/api/customizations', {
        method: 'POST',
        body: form,
      });
      const d = await res.json();
      if (!res.ok)
        throw new Error(
          d.error || 'Could not save your design. Please try again.',
        );
      add(productId, 1, {
        customization_id: d.id,
        customization_label: `${templates.find((t) => t.id === config.template)!.name}${config.name ? ` · ${config.name}` : ''}`,
      });
      setMessage('Your approved design is saved and added to your bag.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="personalize-layout">
      <section
        className="personalize-preview"
        aria-label="Personalized blanket preview"
      >
        <div className="preview-topline">
          <span>✦ YOUR VERY OWN MAIN CHARACTER ✦</span>
          <span className="preview-pill">Live preview</span>
        </div>
        <div className="blanket-mockup">
          <div
            className="blanket-art"
            role="img"
            aria-label={`${templates.find((t) => t.id === config.template)!.name} blanket preview${photo ? ' with your uploaded portrait' : ''}`}
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        </div>
        <p className="preview-caption">
          {photo
            ? 'That’s your cozy kind of magic. ♡'
            : 'Your face goes here. Let’s make it yours. ♡'}
        </p>
        <p className="text-xs text-ink/65 max-w-md mx-auto mt-3">
          Artwork preview. Fabric texture and screen colors may differ from the
          finished blanket. Artwork scales to your selected size.
        </p>
      </section>
      <section className="personalize-controls">
        <p className="collection-label">THE YOU COLLECTION</p>
        <h1>
          Big cozy.
          <br />
          <span className="text-[var(--party-pink)]">Starring you.</span>
        </h1>
        <p className="mt-4 text-ink/75">
          Turn a favorite face into a one-of-a-kind blanket. Pick a world, pop
          in a photo, and make somebody’s day.
        </p>
        <p className="mt-5 text-2xl font-bold">
          {product ? money(product.price_cents) : 'Choose a size'}{' '}
          <span className="text-sm font-normal">
            · personalized just for you
          </span>
        </p>
        <form
          className="space-y-7 mt-7"
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <fieldset>
            <legend className="custom-step">
              <span>1</span> Pick your happy place
            </legend>
            <div className="template-options">
              {templates.map((t) => (
                <button
                  type="button"
                  key={t.id}
                  aria-pressed={config.template === t.id}
                  className={config.template === t.id ? 'selected' : ''}
                  onClick={() => change('template', t.id)}
                >
                  <span style={{ background: t.color, color: t.ink }}>
                    {t.icon}
                  </span>
                  {t.name}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="custom-step">
              <span>2</span> Choose your cozy size
            </legend>
            <div className="custom-size-options">
              {products.map((p) => (
                <button
                  type="button"
                  key={p.id}
                  disabled={!hasStock(p)}
                  aria-pressed={productId === p.id}
                  className={productId === p.id ? 'selected' : ''}
                  onClick={() => setProductId(p.id)}
                >
                  <strong>{p.size_label}</strong>
                  <span>{money(p.price_cents)}</span>
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset className="space-y-4">
            <legend className="custom-step">
              <span>3</span> Add the star of the show
            </legend>
            <label className="photo-upload">
              {loadingPhoto
                ? 'Preparing your photo…'
                : photo
                  ? '♡ Choose a different photo'
                  : '↑ Upload a face photo'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={loadingPhoto || busy}
                onChange={(e) => void upload(e.target.files?.[0])}
              />
              <span className="font-normal text-xs">
                JPG, PNG, WebP · up to 12 MB · one clear face
              </span>
            </label>
            <p className="text-xs text-ink/65">
              Your photo stays in your browser until you approve and add to your
              bag. Use a front-facing portrait; center the face with the
              controls below.
            </p>
            {photo && (
              <>
                <p className="notice text-sm">{quality}</p>
                {(
                  [
                    ['zoom', 'Zoom', 1, 3, 0.01],
                    ['x', 'Move left / right', -100, 100, 1],
                    ['y', 'Move up / down', -100, 100, 1],
                  ] as const
                ).map(([key, label, min, max, step]) => (
                  <label key={key}>
                    {label}
                    <input
                      type="range"
                      min={min}
                      max={max}
                      step={step}
                      value={config[key]}
                      onChange={(e) => change(key, Number(e.target.value))}
                    />
                  </label>
                ))}
              </>
            )}
            <label>
              Body skin tone
              <select
                value={config.skin}
                onChange={(e) =>
                  change('skin', e.target.value as CustomizationConfig['skin'])
                }
              >
                <option value="#f9d5ba">Light</option>
                <option value="#dca078">Medium</option>
                <option value="#ad7050">Tan</option>
                <option value="#704534">Deep</option>
              </select>
            </label>
            <label>
              Name or nickname <span className="font-normal">(optional)</span>
              <input
                value={config.name}
                maxLength={24}
                placeholder="e.g. Olivia"
                onChange={(e) => change('name', e.target.value)}
              />
            </label>
            {!valid.success && (
              <p role="alert" className="text-red-800">
                Use letters, numbers, spaces, or simple punctuation in the name.
              </p>
            )}
          </fieldset>
          <fieldset className="space-y-4">
            <legend className="custom-step">
              <span>4</span> Love it? Make it official.
            </legend>
            <label className="custom-checkbox">
              <input
                type="checkbox"
                checked={consent}
                required
                onChange={(e) => setConsent(e.target.checked)}
              />
              <span>
                I have permission to use this photo, including permission from a
                parent or guardian for a child’s photo.
              </span>
            </label>
            <label className="custom-checkbox">
              <input
                type="checkbox"
                checked={approved}
                required
                disabled={!photo}
                onChange={(e) => setApproved(e.target.checked)}
              />
              <span>
                I approve this preview, including the photo placement, spelling,
                and selected size.
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
              busy ||
              loadingPhoto ||
              !photo ||
              !approved ||
              !consent ||
              !ready ||
              !valid.success ||
              !product
            }
          >
            {busy ? 'Saving your artwork…' : 'Approve & add to bag →'}
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
            <span>✓ Your approved design, saved</span>
          </div>
          <p className="text-xs text-ink/65">
            This editor places your photo into original illustrated artwork. It
            does not generate an AI face swap. Up to five blankets per order.
            Delivery available outside Indiana.
          </p>
        </form>
      </section>
    </div>
  );
}

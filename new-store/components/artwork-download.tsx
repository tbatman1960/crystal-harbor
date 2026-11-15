'use client';
import { useEffect, useState } from 'react';
export function ArtworkDownload({
  id,
  format = 'png',
  label = 'Download approved artwork (PNG)',
}: {
  id: string;
  format?: 'png' | 'jpg' | 'svg';
  label?: string;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [done, setDone] = useState(false),
    [fileUrl, setFileUrl] = useState('');
  useEffect(
    () => () => {
      if (fileUrl) URL.revokeObjectURL(fileUrl);
    },
    [fileUrl],
  );
  return (
    <div>
      <button
        type="button"
        className="personalization-link"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError('');
          setDone(false);
          try {
            const response = await fetch(
              `/api/customizations/${id}?file=artwork&format=${format}`,
              { credentials: 'same-origin', cache: 'no-store' },
            );
            if (!response.ok) {
              const d = await response.json().catch(() => ({}));
              throw new Error(
                d.error ||
                  'We could not download this artwork. Please try again.',
              );
            }
            const blob = await response.blob();
            if (
              !blob.size ||
              !response.headers.get('content-type')?.startsWith('image/')
            )
              throw new Error(
                'The artwork file was not available. Please try again.',
              );
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `snugglebug-${id}.${format}`;
            document.body.append(link);
            link.click();
            link.remove();
            setFileUrl(url);
            setDone(true);
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? 'Preparing your file…' : label}
      </button>
      {error && (
        <p className="text-sm text-red-800 mt-2" role="alert">
          {error}
        </p>
      )}
      {done && (
        <p className="text-xs mt-2" role="status">
          Your file is ready.{' '}
          <a
            className="link"
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            download={format === 'svg' ? `snugglebug-${id}.svg` : undefined}
          >
            {format === 'svg'
              ? 'Tap here to save the SVG'
              : 'Open image to save or share'}
          </a>
          .
        </p>
      )}
    </div>
  );
}

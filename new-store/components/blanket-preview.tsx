'use client';
export function BlanketPreview({
  src,
  alt,
  onLoad,
  onError,
}: {
  src: string;
  alt: string;
  onLoad?: () => void;
  onError?: () => void;
}) {
  return (
    <div className="blanket-scene">
      <div className="blanket-display">
        <img src={src} alt={alt} onLoad={onLoad} onError={onError} />
        <div className="blanket-shading" aria-hidden="true" />
      </div>
      <span className="blanket-scene-label">
        Your personalized blanket · digital mockup
      </span>
    </div>
  );
}

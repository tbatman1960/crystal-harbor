import { z } from 'zod';
export const blanketSizes = ['30x40', '40x50', '50x60', '60x80'] as const;
export const printSpecSchema = z
  .object({
    size: z.enum(blanketSizes),
    ppi: z.union([z.literal(100), z.literal(150), z.literal(300)]).default(150),
    bleed_inches: z.number().min(0).max(2).multipleOf(0.125).default(0),
    fit: z.enum(['contain', 'cover']).default('contain'),
    format: z.enum(['svg', 'png', 'jpg', 'tiff']).default('svg'),
  })
  .superRefine((v, ctx) => {
    const [w, h] = v.size.split('x').map(Number),
      width = Math.round((w + 2 * v.bleed_inches) * v.ppi),
      height = Math.round((h + 2 * v.bleed_inches) * v.ppi);
    if (
      v.format !== 'svg' &&
      (width > 12500 || height > 16500 || width * height > 120000000)
    )
      ctx.addIssue({
        code: 'custom',
        message:
          'This raster export exceeds the processing limit. Choose 150 PPI or 100 PPI, or export a scalable SVG.',
      });
  });
export type PrintSpec = z.infer<typeof printSpecSchema>;
export function printGeometry(spec: PrintSpec) {
  const [width, height] = spec.size.split('x').map(Number);
  return {
    trimWidth: width,
    trimHeight: height,
    widthInches: width + 2 * spec.bleed_inches,
    heightInches: height + 2 * spec.bleed_inches,
    widthPixels: Math.round((width + 2 * spec.bleed_inches) * spec.ppi),
    heightPixels: Math.round((height + 2 * spec.bleed_inches) * spec.ppi),
  };
}
export function sourceInches(svg: string) {
  const root = svg.match(/<svg\b[^>]*>/)?.[0] || '';
  const width = Number(root.match(/\bwidth="([\d.]+)in"/)?.[1]),
    height = Number(root.match(/\bheight="([\d.]+)in"/)?.[1]);
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0 ||
    width > 100 ||
    height > 100
  )
    throw new Error(
      'The approved master has no supported physical dimensions.',
    );
  return { width, height };
}
export function fitTransform(
  sw: number,
  sh: number,
  tw: number,
  th: number,
  fit: 'contain' | 'cover',
) {
  const scale = (fit === 'contain' ? Math.min : Math.max)(tw / sw, th / sh);
  return { scale, x: (tw - sw * scale) / 2, y: (th - sh * scale) / 2 };
}
export const PRINT_BUCKET = 'print-production-private';
export const PRINT_PIPELINE_VERSION = 1;
export const MAX_PRINT_BYTES = 48 * 1024 * 1024;

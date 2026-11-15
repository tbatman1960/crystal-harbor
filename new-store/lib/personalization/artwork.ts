import sharp from 'sharp';
/** Rasterize the complete approved SVG so mobile browsers need not render nested SVG images. */
export async function renderArtwork(
  svg: Buffer,
  format: 'png' | 'jpg' | 'svg' = 'png',
) {
  if (format === 'svg')
    return { bytes: svg, mime: 'image/svg+xml', extension: 'svg' };
  const inches = svg.toString('utf8', 0, 600).match(/\bheight="([\d.]+)in"/);
  const density = inches
    ? Math.max(1, Math.min(300, Math.ceil(1536 / Number(inches[1]))))
    : 144;
  let image = sharp(svg, { density, limitInputPixels: 24000000 }).resize({
    height: 1536,
    withoutEnlargement: false,
  });
  let bytes =
    format === 'jpg'
      ? await image
          .flatten({ background: '#fff' })
          .jpeg({ quality: 95, chromaSubsampling: '4:4:4' })
          .toBuffer()
      : await image.png({ compressionLevel: 9 }).toBuffer();
  if (bytes.length > 4000000 && format === 'png')
    bytes = await sharp(bytes)
      .resize({ height: 1200 })
      .png({ compressionLevel: 9 })
      .toBuffer();
  return {
    bytes,
    mime: format === 'jpg' ? 'image/jpeg' : 'image/png',
    extension: format,
  };
}

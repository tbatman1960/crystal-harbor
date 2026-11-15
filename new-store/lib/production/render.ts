import sharp from 'sharp';
import ImageTracer from 'imagetracerjs';
import { createHash } from 'node:crypto';
import { stat, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  printGeometry,
  sourceInches,
  fitTransform,
  MAX_PRINT_BYTES,
  type PrintSpec,
} from './spec';
export async function makePrintFile(
  approved: Buffer,
  spec: PrintSpec,
  directory: string,
) {
  sharp.cache(false);
  sharp.concurrency(1);
  const original = sourceInches(approved.toString('utf8', 0, 1200));
  const density = Math.max(1, Math.ceil(1800 / original.height));
  const source = await sharp(approved, { density, limitInputPixels: 24000000 })
    .resize({ height: 1800 })
    .flatten({ background: '#fff8ee' })
    .png()
    .toBuffer();
  const metadata = await sharp(source).metadata();
  const g = printGeometry(spec);
  const filePath = join(directory, `blanket.${spec.format}`),
    proofPath = join(directory, 'proof.jpg');
  let vectorPaths: number | null = null;
  if (spec.format === 'svg') {
    const { data, info } = await sharp(source)
      .resize({ height: 1536 })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const traced = ImageTracer.imagedataToSVG(
      {
        width: info.width,
        height: info.height,
        data: new Uint8ClampedArray(data),
      },
      {
        ltres: 0.5,
        qtres: 0.5,
        pathomit: 2,
        colorsampling: 2,
        numberofcolors: 64,
        mincolorratio: 0,
        colorquantcycles: 3,
        linefilter: false,
        roundcoords: 2,
        scale: 1,
        viewbox: true,
        desc: false,
        blurradius: 0,
      },
    );
    if (
      /<image\b|<script\b|<foreignObject\b|\bhref\s*=|data:image/i.test(traced)
    )
      throw new Error('Vector output failed validation.');
    const paths = traced
      .replace(/^[\s\S]*?<svg\b[^>]*>/, '')
      .replace(/<\/svg>\s*$/, '');
    vectorPaths = (paths.match(/<path\b/g) || []).length;
    if (!vectorPaths) throw new Error('No vector paths were created.');
    const width = (1200 * g.widthInches) / g.heightInches,
      height = 1200,
      t = fitTransform(info.width, info.height, width, height, spec.fit);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${g.widthInches}in" height="${g.heightInches}in" viewBox="0 0 ${width} ${height}"><title>Scalable blanket artwork — production review required</title><desc>Vector paths traced from the immutable approved artwork. Trace conversion can simplify details. Trim ${g.trimWidth} x ${g.trimHeight} inches; bleed ${spec.bleed_inches} inches each side.</desc><defs><clipPath id="canvas"><rect width="${width}" height="${height}"/></clipPath></defs><rect width="${width}" height="${height}" fill="#fff8ee"/><g clip-path="url(#canvas)"><g transform="translate(${t.x} ${t.y}) scale(${t.scale})">${paths}</g></g></svg>`;
    await writeFile(filePath, svg);
    const proofDensity = Math.max(1, Math.ceil(1400 / g.heightInches));
    await sharp(Buffer.from(svg), {
      density: proofDensity,
      limitInputPixels: 16000000,
    })
      .resize({ height: 1400 })
      .jpeg({ quality: 90 })
      .toFile(proofPath);
  } else {
    let pipeline = sharp(source, { limitInputPixels: 24000000 })
      .resize(g.widthPixels, g.heightPixels, {
        fit: spec.fit,
        position: 'centre',
        background: '#fff8ee',
        kernel: 'lanczos3',
      })
      .toColourspace('srgb')
      .withMetadata({ density: spec.ppi });
    if (spec.format === 'png')
      await pipeline.png({ compressionLevel: 7 }).toFile(filePath);
    if (spec.format === 'jpg')
      await pipeline
        .jpeg({ quality: 95, chromaSubsampling: '4:4:4' })
        .toFile(filePath);
    if (spec.format === 'tiff')
      await pipeline
        .tiff({
          compression: 'deflate',
          predictor: 'horizontal',
          resolutionUnit: 'inch',
          xres: spec.ppi / 25.4,
          yres: spec.ppi / 25.4,
        })
        .toFile(filePath);
    await sharp(filePath, { limitInputPixels: 125000000 })
      .resize({ height: 1400 })
      .jpeg({ quality: 90 })
      .toFile(proofPath);
  }
  const size = (await stat(filePath)).size;
  if (size > MAX_PRINT_BYTES)
    throw new Error(
      'The file exceeds 48 MB. Choose JPEG, SVG, or a lower PPI.',
    );
  const output = await readFile(filePath);
  const actual =
    spec.format === 'svg'
      ? null
      : await sharp(filePath, { limitInputPixels: 125000000 }).metadata();
  if (
    actual &&
    (actual.width !== g.widthPixels || actual.height !== g.heightPixels)
  )
    throw new Error('Output pixel dimensions failed verification.');
  return {
    filePath,
    proofPath,
    bytes: size,
    source_sha256: createHash('sha256').update(approved).digest('hex'),
    file_sha256: createHash('sha256').update(output).digest('hex'),
    proof_master_width: metadata.width,
    proof_master_height: metadata.height,
    source_width_inches: original.width,
    source_height_inches: original.height,
    vector_paths: vectorPaths,
    width_pixels: g.widthPixels,
    height_pixels: g.heightPixels,
    width_inches: g.widthInches,
    height_inches: g.heightInches,
    mime:
      spec.format === 'svg'
        ? 'image/svg+xml'
        : spec.format === 'jpg'
          ? 'image/jpeg'
          : spec.format === 'tiff'
            ? 'image/tiff'
            : 'image/png',
    quality_note:
      spec.format === 'svg'
        ? 'True vector paths; palette and curves are approximated. Inspect faces, text and fine detail before production.'
        : 'Lanczos enlargement of the approved artwork; output pixels do not imply newly recovered detail. Inspect at print size before production.',
  };
}

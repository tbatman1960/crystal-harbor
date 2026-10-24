import { z } from 'zod';
export const templates = [
  {
    id: 'disco',
    name: 'Main Character Energy',
    subtitle: 'Your face. Your name. Your spotlight.',
    color: '#f6b6d1',
    ink: '#70226a',
    icon: '✦',
  },
  {
    id: 'cosmic',
    name: 'Out of This World',
    subtitle: 'A little stardust. A whole lot of you.',
    color: '#c7c8f7',
    ink: '#34326b',
    icon: '☆',
  },
  {
    id: 'garden',
    name: 'Hello, Sunshine',
    subtitle: 'Fresh flowers and feel-good energy.',
    color: '#dce8b4',
    ink: '#365332',
    icon: '✿',
  },
] as const;
export const customizationConfig = z.object({
  template: z.enum(['disco', 'cosmic', 'garden']),
  name: z
    .string()
    .trim()
    .max(24)
    .regex(
      /^[\p{L}\p{N} .!'’-]*$/u,
      'Use letters, numbers, spaces, or simple punctuation',
    ),
  zoom: z.number().min(1).max(3),
  x: z.number().min(-100).max(100),
  y: z.number().min(-100).max(100),
  skin: z.enum(['#f9d5ba', '#dca078', '#ad7050', '#704534']),
});
export type CustomizationConfig = z.infer<typeof customizationConfig>;
export const defaultConfig: CustomizationConfig = {
  template: 'disco',
  name: '',
  zoom: 1,
  x: 0,
  y: 0,
  skin: '#dca078',
};
export const cartKey = (i: {
  product_id: string;
  customization_id?: string | null;
}) => `${i.product_id}:${i.customization_id || 'plain'}`;
const escape = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&apos;',
      })[c]!,
  );
// The same original vector artwork is used for browser previews and production files.
// This is a portrait-placement editor, not a generative face-swap service.
export function blanketSvg(
  config: CustomizationConfig,
  photo?: string,
  inches?: [number, number],
) {
  const c = customizationConfig.parse(config);
  if (photo && !/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(photo))
    throw new Error('Invalid photo');
  const t = templates.find((t) => t.id === c.template)!;
  const stars = Array.from({ length: 28 }, (_, i) => {
    const x = 25 + ((i * 137) % 550),
      y = 30 + ((i * 179) % 720);
    return `<text x="${x}" y="${y}" font-size="${18 + (i % 3) * 8}" fill="${i % 2 ? '#fff6dc' : t.ink}" opacity=".55">${c.template === 'garden' ? '✿' : i % 2 ? '✦' : '☆'}</text>`;
  }).join('');
  const head = photo
    ? `<g clip-path="url(#face)"><image href="${photo}" x="${300 - 90 * c.zoom + c.x * 0.55}" y="${268 - 115 * c.zoom + c.y * 0.55}" width="${180 * c.zoom}" height="${230 * c.zoom}" preserveAspectRatio="xMidYMid slice"/></g>`
    : `<ellipse cx="300" cy="268" rx="75" ry="94" fill="${c.skin}"/><path d="M272 262h9m38 0h9M282 303q18 17 36 0" stroke="${t.ink}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
  const space = c.template === 'cosmic';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${inches ? inches[0] + 'in' : '600'}" height="${inches ? inches[1] + 'in' : '800'}" viewBox="0 0 600 800" preserveAspectRatio="none"><defs><clipPath id="face"><ellipse cx="300" cy="268" rx="75" ry="94"/></clipPath><pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse"><path d="M50 0H0V50" fill="none" stroke="white" stroke-opacity=".22"/></pattern></defs><rect width="600" height="800" fill="${t.color}"/><rect width="600" height="800" fill="url(#grid)"/>${stars}<rect x="20" y="20" width="560" height="760" rx="25" fill="none" stroke="${t.ink}" stroke-width="3"/><text x="300" y="93" text-anchor="middle" font-family="sans-serif" font-size="18" letter-spacing="5" fill="${t.ink}">THE ONE &amp; ONLY</text><text x="300" y="143" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="${c.name.length > 14 ? 27 : 40}" fill="${t.ink}">${escape(c.name.toUpperCase() || 'YOU')}</text><ellipse cx="300" cy="670" rx="150" ry="24" fill="${t.ink}" opacity=".15"/>${space ? `<circle cx="300" cy="267" r="119" fill="#f8f4ff" stroke="${t.ink}" stroke-width="8"/>` : ''}<path d="M250 350L190 402L152 532L185 545L233 451L240 560H360L368 451L415 545L448 532L410 402L350 350Z" fill="${space ? '#fff8ee' : t.ink}" stroke="${t.ink}" stroke-width="6"/><path d="M267 350h66v45q-33 22-66 0Z" fill="${c.skin}"/><path d="M245 555L230 650H285L300 580L315 650H370L355 555" fill="${space ? t.ink : '#fbf2db'}" stroke="${t.ink}" stroke-width="6"/><ellipse cx="165" cy="537" rx="19" ry="24" fill="${c.skin}"/><ellipse cx="435" cy="537" rx="19" ry="24" fill="${c.skin}"/>${head}${space ? `<circle cx="300" cy="267" r="108" fill="none" stroke="${t.ink}" stroke-width="8"/><rect x="267" y="427" width="66" height="48" rx="8" fill="${t.color}"/>` : `<path d="M218 271Q199 155 300 165Q402 155 382 271L367 224Q300 184 233 224Z" fill="${t.ink}"/><text x="300" y="475" text-anchor="middle" fill="${t.color}" font-size="55">${t.icon}</text>`}<text x="300" y="717" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="28" fill="${t.ink}">${space ? 'BORN TO EXPLORE' : c.template === 'garden' ? 'GROW YOUR OWN HAPPY' : 'MADE FOR THE SPOTLIGHT'}</text><text x="300" y="747" text-anchor="middle" font-family="sans-serif" letter-spacing="4" font-size="11" fill="${t.ink}">A LITTLE COMFORT. ALL YOUR CHARACTER.</text></svg>`;
}
export function printDimensions(size: string): [number, number] {
  const match = size.match(/(30|40|50|60)\s*[×x]\s*(40|50|60|80)/i);
  if (!match) throw new Error('Unsupported blanket size');
  const pair: [number, number] = [Number(match[1]), Number(match[2])];
  if (!['30x40', '40x50', '50x60', '60x80'].includes(pair.join('x')))
    throw new Error('Unsupported blanket size');
  return pair;
}

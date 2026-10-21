/** Replace these illustrative products and stock counts with real inventory before launch. */
export const sampleCategories = [
  { name: 'Kids & Lap Blankets', slug: 'kids-lap-blankets', sort_order: 0 },
  { name: 'Everyday Throws', slug: 'everyday-throws', sort_order: 1 },
  { name: 'Oversized Comfort', slug: 'oversized-comfort', sort_order: 2 },
];
const designs = [
  {
    name: 'Space Pals',
    slug: 'space-pals',
    description:
      'Smiling planets, little rockets, and friendly stars for big imaginations.',
  },
  {
    name: 'Dino Days',
    slug: 'dino-days',
    description:
      'Playful little dinosaurs and leafy details for your next sofa adventure.',
  },
  {
    name: 'Forest Friends',
    slug: 'forest-friends',
    description:
      'Cheerful woodland foxes and leafy shapes in warm, gentle colors.',
  },
  {
    name: 'Rainbow Bears',
    slug: 'rainbow-bears',
    description: 'Friendly bears, soft rainbows, and a little everyday cheer.',
  },
];
const sizes = [
  {
    key: 'lap',
    label: 'Kids & lap · 30 × 40 in',
    category: 'kids-lap-blankets',
    price: 2499,
    weight: 0.8,
    stock: 12,
    first: 599,
    additional: 150,
  },
  {
    key: 'throw',
    label: 'Throw · 50 × 60 in',
    category: 'everyday-throws',
    price: 3499,
    weight: 1.4,
    stock: 18,
    first: 799,
    additional: 200,
  },
  {
    key: 'oversized',
    label: 'Oversized · 60 × 80 in',
    category: 'oversized-comfort',
    price: 4999,
    weight: 2.2,
    stock: 8,
    first: 999,
    additional: 300,
  },
];
export const sampleProducts = designs.flatMap((design) =>
  sizes.map((size) => ({
    name: `Sample · ${design.name} Printed Blanket`,
    slug: `${design.slug}-blanket-${size.key}`,
    design_slug: `${design.slug}-blanket`,
    size_label: size.label,
    category_slug: size.category,
    description: `SAMPLE LISTING — illustration, price, and stock are for preview only. Replace with your actual product photos and specifications before launch.\n\n${design.description}\n\nPrinted blanket in ${size.label.toLowerCase()}. Ready-made from available stock; choose a size rather than uploading a custom design. Check dimensions before ordering and follow the care label supplied with the real item.`,
    price_cents: size.price,
    sku: `SAMPLE-SB-${design.slug.toUpperCase()}-${size.key.toUpperCase()}`,
    weight_lbs: size.weight,
    inventory_count: size.stock,
    shipping_first_unit_cents: size.first,
    shipping_additional_unit_cents: size.additional,
    is_active: true,
    images: [
      `/blankets/${design.slug}.svg`,
      `/blankets/${design.slug}-detail.svg`,
    ],
  })),
);

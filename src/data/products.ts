import type { ImageMetadata } from 'astro';
import cover from '../assets/album/cover.jpg';
import tee from '../assets/store/tee-placeholder.png';

/**
 * Catalogue for the store section. Prices in cents, IVA included (consumer price —
 * PT law requires the final price to be shown).
 *
 * ⚠ PLACEHOLDER DATA — every product marked `draft: true` is rendered with a
 * "Em breve" badge and cannot be added to the cart. Replace with real prices,
 * photos and stock before launch. Provider-specific ids (Stripe price id / Shopify
 * variant gid) go in `external` once the provider is chosen.
 */
export interface Variant {
  id: string;
  label: string;
  /** provider ids — filled once Stripe or Shopify is chosen */
  external?: { stripePriceId?: string; shopifyVariantId?: string };
  inStock?: boolean;
}

export interface Product {
  id: string;
  title: string;
  kind: 'cd' | 'apparel' | 'print';
  priceCents: number;
  description: string;
  image: ImageMetadata;
  variants: Variant[];
  draft?: boolean;
}

export const products: Product[] = [
  {
    id: 'cd-nova-era',
    title: 'CD "Nova Era"',
    kind: 'cd',
    priceCents: 1500,
    description: 'Edição física do álbum. 13 faixas. Digipack com booklet.',
    image: cover,
    variants: [{ id: 'cd-nova-era', label: 'Único', inStock: true }],
    draft: true,
  },
  {
    id: 'tshirt-nova-era',
    title: 'T-shirt "Nova Era"',
    kind: 'apparel',
    priceCents: 2500,
    description: 'Algodão 100 %, corte regular, estampado frontal.',
    image: tee,
    variants: ['S', 'M', 'L', 'XL'].map((s) => ({ id: `tshirt-nova-era-${s.toLowerCase()}`, label: s, inStock: true })),
    draft: true,
  },
];

export const findVariant = (variantId: string) => {
  for (const p of products) {
    const v = p.variants.find((v) => v.id === variantId);
    if (v) return { product: p, variant: v };
  }
  return null;
};

/**
 * Site-wide facts. Anything that appears in more than one place lives here,
 * so a change is made once (nav, footer and mobile menu all read this file).
 */

export const site = {
  name: 'GUIMA',
  domain: 'https://guimavng.com',
  title: 'GUIMA — Nova Era',
  description:
    'Site oficial do GUIMA, rapper de Vila Nova de Gaia. Ouve o álbum "Nova Era", vê a galeria e compra o merch oficial.',
  locale: 'pt-PT',
  city: 'Vila Nova de Gaia',
  tagline: 'Porto · Hip-Hop · Real',
  /** Year the site went live — copyright reads "2025–<current year>" */
  since: 2025,
  developer: { name: 'Filipe Guimarães', url: 'https://guimaraes.systems' },
} as const;

export type NavItem = { href: string; label: string };

/**
 * In-page sections, in scroll order. Hrefs are absolute (`/#id`) so the nav also
 * works from the legal pages. Letters between pipes are rendered in blackletter ("|N|ova |E|ra").
 */
export const nav: NavItem[] = [
  { href: '/#sobre', label: 'Sobre' },
  { href: '/#nova-era', label: '|N|ova |E|ra' },
  { href: '/#singles', label: 'Singles' },
  { href: '/#galeria', label: 'Galeria' },
  { href: '/#loja', label: 'Loja' },
  { href: '/#contactos', label: 'Contactos' },
];

export type Social = { id: 'instagram' | 'spotify' | 'applemusic' | 'youtube'; label: string; href: string };

export const socials: Social[] = [
  { id: 'instagram', label: 'Instagram', href: 'https://www.instagram.com/guimavng' },
  { id: 'spotify', label: 'Spotify', href: 'https://open.spotify.com/intl-pt/artist/5A50LakS866v93RBazdFER' },
  { id: 'applemusic', label: 'Apple Music', href: 'https://music.apple.com/pt/artist/guima/1590217436' },
  { id: 'youtube', label: 'YouTube', href: 'https://www.youtube.com/channel/UCBvDWmQcwseHN9JPHTHqhLw' },
];

/**
 * Legal identity of the seller — REQUIRED before the store goes live.
 * Portuguese e-commerce law (DL 7/2004, DL 24/2014) requires the trader's name,
 * NIF, address and a contact on the site. Placeholders are rendered visibly as
 * "[…]" so nobody ships them by accident.
 */
export const legal = {
  sellerName: '[NOME LEGAL DO VENDEDOR]',
  nif: '[NIF]',
  address: '[MORADA COMPLETA]',
  email: '[EMAIL DE CONTACTO]',
  phone: '',
  /** Livro de Reclamações Eletrónico — mandatory link for traders in Portugal */
  complaintsBook: 'https://www.livroreclamacoes.pt/',
  /** RAL entity for the Porto district (Lei 144/2015 requires naming one) */
  ral: { name: 'CICAP — Centro de Informação de Consumo e Arbitragem do Porto', url: 'https://www.cicap.pt/' },
  lastUpdated: '2026-09-16',
} as const;

export const hasLegalPlaceholders = Object.values(legal).some(
  (v) => typeof v === 'string' && v.startsWith('['),
);

import { atom, computed } from 'nanostores';
import { persistentAtom } from '@nanostores/persistent';

/**
 * Cart state shared by every island and vanilla script on the page.
 * nanostores modules are singletons in the bundle, so the "Adicionar" buttons
 * (plain <script>) and the React drawer see the same store.
 *
 * Persisted in localStorage so a refresh keeps the cart. Only ids + quantities
 * are trusted later: prices are re-read from the catalogue at checkout time.
 */
export interface CartLine {
  variantId: string;
  productId: string;
  title: string;
  variantLabel: string;
  priceCents: number;
  image: string;
  qty: number;
}

export const cartLines = persistentAtom<CartLine[]>('guima:cart:v1', [], {
  encode: JSON.stringify,
  decode: (raw) => {
    try {
      const v = JSON.parse(raw);
      return Array.isArray(v) ? v : [];
    } catch {
      return [];
    }
  },
});

export const cartOpen = atom(false);

export const cartCount = computed(cartLines, (lines) => lines.reduce((n, l) => n + l.qty, 0));
export const cartTotalCents = computed(cartLines, (lines) =>
  lines.reduce((sum, l) => sum + l.qty * l.priceCents, 0),
);

export function addToCart(line: Omit<CartLine, 'qty'>, qty = 1) {
  const lines = cartLines.get();
  const i = lines.findIndex((l) => l.variantId === line.variantId);
  if (i === -1) cartLines.set([...lines, { ...line, qty }]);
  else cartLines.set(lines.map((l, j) => (j === i ? { ...l, qty: l.qty + qty } : l)));
  cartOpen.set(true);
}

export function setQty(variantId: string, qty: number) {
  const lines = cartLines.get();
  if (qty <= 0) cartLines.set(lines.filter((l) => l.variantId !== variantId));
  else cartLines.set(lines.map((l) => (l.variantId === variantId ? { ...l, qty } : l)));
}

export function removeLine(variantId: string) {
  setQty(variantId, 0);
}

export function clearCart() {
  cartLines.set([]);
}

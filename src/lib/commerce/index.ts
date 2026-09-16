import type { CartLine } from '../../stores/cart';

/**
 * Checkout provider boundary.
 *
 * The site never knows whether Stripe or Shopify is behind the "Finalizar compra"
 * button. Each provider implements this interface; `provider` below is the only
 * line that changes when the decision is made.
 *
 *   Stripe  → POST /api/checkout (Cloudflare Pages Function) creates a Checkout
 *             Session from the lines and returns its URL.
 *   Shopify → Storefront API cartCreate + cartLinesAdd from the browser, then
 *             redirect to cart.checkoutUrl (needs a public Storefront token).
 */
export interface CheckoutProvider {
  readonly name: 'none' | 'stripe' | 'shopify';
  /** True when a real checkout exists; the drawer disables the button otherwise. */
  readonly ready: boolean;
  createCheckout(lines: CartLine[]): Promise<{ url: string }>;
}

const noneProvider: CheckoutProvider = {
  name: 'none',
  ready: false,
  async createCheckout() {
    throw new Error('A loja ainda não está ativa.');
  },
};

export const provider: CheckoutProvider = noneProvider;

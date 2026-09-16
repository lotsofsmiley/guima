import { useEffect, useRef, useState } from 'react';
import { useStore } from '@nanostores/react';
import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { cartLines, cartOpen, cartTotalCents, setQty, removeLine } from '../../stores/cart';
import { provider } from '../../lib/commerce';
import { formatPrice } from '../../lib/format';

/**
 * Slide-in cart. The only React on the page besides the player: it has real state
 * (quantities, checkout in flight, errors) and benefits from a component model.
 * Everything it knows about products comes from the store, which the plain
 * "Adicionar" buttons wrote to — no prop drilling from Astro.
 */
export default function CartDrawer() {
  const open = useStore(cartOpen);
  const lines = useStore(cartLines);
  const total = useStore(cartTotalCents);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);

  // Esc closes; focus lands on the close button when opening; body scroll locked.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && cartOpen.set(false);
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    closeBtn.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  const checkout = async () => {
    setBusy(true);
    setError(null);
    try {
      const { url } = await provider.createCheckout(lines);
      window.location.assign(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível iniciar o checkout.');
      setBusy(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`}
      aria-hidden={!open}
      inert={!open}
    >
      <div
        className={`absolute inset-0 bg-ink-950/70 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={() => cartOpen.set(false)}
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label="Carrinho"
        className={`absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-ink-700 bg-ink-900 text-cream-100 shadow-2xl transition-transform duration-400 ease-[var(--ease-out-expo)] ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <header className="flex h-nav items-center justify-between border-b border-ink-700 px-5">
          <h2 className="flex items-center gap-2 text-lg font-medium uppercase tracking-[0.14em]">
            <ShoppingBag size={18} /> Carrinho
          </h2>
          <button ref={closeBtn} className="icon-btn" type="button" onClick={() => cartOpen.set(false)} aria-label="Fechar carrinho">
            <X size={22} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5">
          {lines.length === 0 ? (
            <p className="py-16 text-center text-cream-500">O carrinho está vazio.</p>
          ) : (
            <ul className="divide-y divide-ink-700">
              {lines.map((l) => (
                <li key={l.variantId} className="grid grid-cols-[4rem_1fr_auto] items-center gap-4 py-4">
                  <img src={l.image} alt="" width={64} height={64} className="h-16 w-16 object-cover bg-ink-800" />
                  <div className="min-w-0">
                    <p className="truncate font-medium uppercase tracking-wide">{l.title}</p>
                    <p className="text-sm text-cream-500">
                      {l.variantLabel !== 'Único' && <span>{l.variantLabel} · </span>}
                      {formatPrice(l.priceCents)}
                    </p>
                    <div className="mt-2 inline-flex items-center border border-ink-600">
                      <button className="grid h-8 w-8 place-items-center hover:bg-ink-700" type="button" onClick={() => setQty(l.variantId, l.qty - 1)} aria-label="Menos um">
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center text-sm tabular">{l.qty}</span>
                      <button className="grid h-8 w-8 place-items-center hover:bg-ink-700" type="button" onClick={() => setQty(l.variantId, l.qty + 1)} aria-label="Mais um">
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <p className="tabular text-sky-400">{formatPrice(l.priceCents * l.qty)}</p>
                    <button className="text-cream-500 hover:text-cream-100" type="button" onClick={() => removeLine(l.variantId)} aria-label={`Remover ${l.title}`}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <footer className="border-t border-ink-700 p-5">
          <div className="flex items-baseline justify-between">
            <span className="text-sm uppercase tracking-[0.16em] text-cream-500">Subtotal</span>
            <span className="tabular text-xl text-cream-100">{formatPrice(total)}</span>
          </div>
          <p className="mt-1 text-xs text-cream-500">IVA incluído. Portes calculados no checkout.</p>
          {error && <p className="mt-3 text-sm text-buff-300" role="alert">{error}</p>}
          <button
            className="btn btn--solid mt-4 w-full"
            type="button"
            disabled={!provider.ready || lines.length === 0 || busy}
            onClick={checkout}
          >
            {provider.ready ? (busy ? 'A abrir o checkout…' : 'Finalizar compra') : 'Loja em preparação'}
          </button>
          {!provider.ready && (
            <p className="mt-2 text-center text-xs text-cream-500">O pagamento fica disponível quando a loja abrir.</p>
          )}
        </footer>
      </div>
    </div>
  );
}

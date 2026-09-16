import { useEffect, useRef, useState } from 'react';
import { useStore } from '@nanostores/react';
import { faXmark, faMinus, faPlus, faTrashCan, faBagShopping } from '@fortawesome/free-solid-svg-icons';
import { FaIcon } from './FaIcon';
import { cartLines, cartOpen, cartTotalCents, setQty, removeLine } from '../../stores/cart';
import { provider } from '../../lib/commerce';
import { formatPrice } from '../../lib/format';

/**
 * Slide-in cart. Everything it knows about products comes from the store, which the
 * plain "Adicionar" buttons wrote to — no prop drilling from Astro.
 */
export default function CartDrawer() {
  const open = useStore(cartOpen);
  const lines = useStore(cartLines);
  const total = useStore(cartTotalCents);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);

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
    <div className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open} inert={!open}>
      <div
        className={`absolute inset-0 bg-ink-950/70 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={() => cartOpen.set(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Carrinho"
        className={`absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-ink-700 bg-ink-900 text-cream-100 shadow-2xl transition-transform duration-400 ease-[var(--ease-out-expo)] ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <header className="flex h-nav items-center justify-between border-b border-ink-700 px-5">
          <h2 className="flex items-center gap-3 text-[1.5rem] uppercase tracking-[0.14em]">
            <FaIcon icon={faBagShopping} size={20} /> Carrinho
          </h2>
          <button ref={closeBtn} className="icon-btn" type="button" onClick={() => cartOpen.set(false)} aria-label="Fechar carrinho">
            <FaIcon icon={faXmark} size={28} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5">
          {lines.length === 0 ? (
            <p className="py-16 text-center text-cream-500">O carrinho está vazio.</p>
          ) : (
            <ul className="divide-y divide-ink-700">
              {lines.map((l) => (
                <li key={l.variantId} className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-4 py-4">
                  <img src={l.image} alt="" width={72} height={72} className="h-18 w-18 object-cover bg-ink-800" />
                  <div className="min-w-0">
                    <p className="truncate uppercase tracking-wide">{l.title}</p>
                    <p className="text-base text-cream-500">
                      {l.variantLabel !== 'Único' && <span>{l.variantLabel} · </span>}
                      {formatPrice(l.priceCents)}
                    </p>
                    <div className="mt-2 inline-flex items-center border border-ink-600">
                      <button className="grid h-9 w-9 place-items-center hover:bg-ink-700" type="button" onClick={() => setQty(l.variantId, l.qty - 1)} aria-label="Menos um">
                        <FaIcon icon={faMinus} size={12} />
                      </button>
                      <span className="w-9 text-center tabular">{l.qty}</span>
                      <button className="grid h-9 w-9 place-items-center hover:bg-ink-700" type="button" onClick={() => setQty(l.variantId, l.qty + 1)} aria-label="Mais um">
                        <FaIcon icon={faPlus} size={12} />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <p className="tabular text-sky-400">{formatPrice(l.priceCents * l.qty)}</p>
                    <button className="text-cream-500 hover:text-cream-100" type="button" onClick={() => removeLine(l.variantId)} aria-label={`Remover ${l.title}`}>
                      <FaIcon icon={faTrashCan} size={16} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <footer className="border-t border-ink-700 p-5">
          <div className="flex items-baseline justify-between">
            <span className="text-base uppercase tracking-[0.16em] text-cream-500">Subtotal</span>
            <span className="tabular text-[1.75rem] text-cream-100">{formatPrice(total)}</span>
          </div>
          <p className="mt-1 text-sm text-cream-500">IVA incluído · portes no checkout</p>
          {error && <p className="mt-3 text-buff-300" role="alert">{error}</p>}
          <button className="btn btn--solid mt-4 w-full" type="button" disabled={!provider.ready || lines.length === 0 || busy} onClick={checkout}>
            {provider.ready ? (busy ? 'A abrir o checkout…' : 'Finalizar compra') : 'Loja em preparação'}
          </button>
        </footer>
      </div>
    </div>
  );
}

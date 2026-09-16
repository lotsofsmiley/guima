const eur = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });

/** 1500 → "15,00 €" (pt-PT places the symbol after the number). */
export const formatPrice = (cents: number) => eur.format(cents / 100);

/** 206000 → "3:26" */
export const formatDuration = (ms: number) => {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/** "2025-09-26" → "26 Set 2025" */
export const formatDate = (iso: string) => {
  const d = new Date(iso + 'T00:00:00');
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

/**
 * Turns "|N|OVA |E|RA" into HTML with blackletter spans.
 * Only the string between pipes is wrapped; everything else is escaped as text.
 */
export const swapHtml = (marked: string) =>
  marked
    .split('|')
    .map((chunk, i) => (i % 2 === 1 ? `<span class="sw">${escapeHtml(chunk)}</span>` : escapeHtml(chunk)))
    .join('');

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

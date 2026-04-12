const SYMBOLS = {
  GBP: '£',
  USD: '$',
  EUR: '€',
  AUD: 'A$',
};

export function formatMoney(amount, currencyCode) {
  const sym = SYMBOLS[currencyCode] || `${currencyCode} `;
  const n = Number(amount);
  const s = Number.isFinite(n) ? n.toFixed(2) : '0.00';
  return `${sym}${s}`;
}

export function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateInput(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

export function todayISODate() {
  return new Date().toISOString().slice(0, 10);
}

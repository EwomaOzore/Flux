const NGN = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0,
});

export function formatNgn(amount: number): string {
  if (!Number.isFinite(amount)) return '—';
  return NGN.format(Math.round(amount));
}

/** Parse integer naira from formatted or partial input (ignores ₦, commas, spaces, etc.). */
export function parseNgnInput(raw: string): number {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return 0;
  const n = Number(digits);
  if (!Number.isFinite(n)) return 0;
  return Math.min(Math.round(n), Number.MAX_SAFE_INTEGER);
}

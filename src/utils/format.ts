import type { Timestamp } from 'firebase/firestore';

export function formatDateTime(ts: Timestamp): string {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(ts.toDate());
}

export function isMatchLocked(match: { locked: boolean; datetime: Timestamp }): boolean {
  return match.locked || match.datetime.toDate().getTime() <= Date.now();
}

export function formatCurrency(amount: number, currency: 'ARS' | 'USD'): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

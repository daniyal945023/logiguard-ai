import { format, parseISO } from 'date-fns';

export function formatDateTime(iso: string) {
  return format(parseISO(iso), 'MMM d, yyyy  HH:mm');
}

export function formatDate(iso: string) {
  return format(parseISO(iso), 'MMM d, yyyy');
}

export function formatShortDateTime(iso: string) {
  return format(parseISO(iso), 'MMM d, HH:mm');
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(value);
}

export function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

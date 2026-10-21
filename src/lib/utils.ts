// ============================================================
// LUXE — Utility helpers
// ============================================================
import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/** Format IDR currency according to locale (Rupiah currency is kept, separators follow locale) */
export function formatPrice(amount: number, locale: string = 'en'): string {
  const intlLocale = locale === 'id' ? 'id-ID' : 'en-US';
  return new Intl.NumberFormat(intlLocale, {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Format date according to locale */
export function formatDate(
  date: string | number | Date,
  locale: string = 'en',
  options?: Intl.DateTimeFormatOptions
): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const intlLocale = locale === 'id' ? 'id-ID' : 'en-US';
  const defaultOptions: Intl.DateTimeFormatOptions = options || {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  };
  return new Intl.DateTimeFormat(intlLocale, defaultOptions).format(d);
}

/** Discount percentage */
export function discountPercent(price: number, comparePrice: number): number {
  return Math.round(((comparePrice - price) / comparePrice) * 100);
}

/** Slugify a string */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '');
}

/** API JSON success response */
export function successResponse<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify({ success: true, data }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** API JSON error response */
export function errorResponse(message: string, status = 400): Response {
  return new Response(JSON.stringify({ success: false, error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** Generate dummy transaction ID */
export function generateTxId(): string {
  return `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

/** Star rating array helper */
export function getStars(rating: number): ('full' | 'half' | 'empty')[] {
  const stars: ('full' | 'half' | 'empty')[] = [];
  for (let i = 1; i <= 5; i++) {
    if (rating >= i) stars.push('full');
    else if (rating >= i - 0.5) stars.push('half');
    else stars.push('empty');
  }
  return stars;
}

export * from './colors';


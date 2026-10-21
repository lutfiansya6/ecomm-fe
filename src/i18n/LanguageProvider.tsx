'use client';
// ============================================================
// LUXE E-Commerce — Client Language Provider & useT Hook
// ============================================================
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Locale, DEFAULT_LOCALE, t as translateCore } from './index';
import { formatPrice as formatPriceUtil, formatDate as formatDateUtil } from '@/lib/utils';

export interface UseTReturn {
  (key: string, params?: Record<string, string | number>): string;
  t: (key: string, params?: Record<string, string | number>) => string;
  locale: Locale;
  setLocale: (newLocale: Locale) => void;
  formatPrice: (amount: number) => string;
  formatDate: (date: string | number | Date, options?: Intl.DateTimeFormatOptions) => string;
}

interface LanguageContextType {
  locale: Locale;
  setLocale: (newLocale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  formatPrice: (amount: number) => string;
  formatDate: (date: string | number | Date, options?: Intl.DateTimeFormatOptions) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({
  children,
  initialLocale = DEFAULT_LOCALE,
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  // Sync state if initialLocale changes on the server
  useEffect(() => {
    setLocaleState(initialLocale);
  }, [initialLocale]);

  const setLocale = useCallback(
    (newLocale: Locale) => {
      if (newLocale === locale) return;
      // Set cookie for 1 year (365 * 24 * 60 * 60 = 31536000 seconds)
      document.cookie = `locale=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
      setLocaleState(newLocale);
      router.refresh();
    },
    [locale, router]
  );

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      return translateCore(key, params, locale);
    },
    [locale]
  );

  const formatPrice = useCallback(
    (amount: number) => {
      return formatPriceUtil(amount, locale);
    },
    [locale]
  );

  const formatDate = useCallback(
    (date: string | number | Date, options?: Intl.DateTimeFormatOptions) => {
      return formatDateUtil(date, locale, options);
    },
    [locale]
  );

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t, formatPrice, formatDate }}>
      {children}
    </LanguageContext.Provider>
  );
}

/**
 * Hook for consuming translations in client components.
 * Can be used as either:
 *   const { t, locale, setLocale, formatPrice, formatDate } = useT();
 * or
 *   const t = useT();
 *   t('common.save');
 */
export function useT(): UseTReturn {
  const ctx = useContext(LanguageContext);

  if (!ctx) {
    const fallbackFn = ((key: string, params?: Record<string, string | number>) =>
      translateCore(key, params, DEFAULT_LOCALE)) as unknown as UseTReturn;

    fallbackFn.t = fallbackFn;
    fallbackFn.locale = DEFAULT_LOCALE;
    fallbackFn.setLocale = () => {};
    fallbackFn.formatPrice = (amount: number) => formatPriceUtil(amount, DEFAULT_LOCALE);
    fallbackFn.formatDate = (d: string | number | Date, opt?: Intl.DateTimeFormatOptions) =>
      formatDateUtil(d, DEFAULT_LOCALE, opt);

    return fallbackFn;
  }

  const callable = ((key: string, params?: Record<string, string | number>) =>
    ctx.t(key, params)) as unknown as UseTReturn;

  callable.t = ctx.t;
  callable.locale = ctx.locale;
  callable.setLocale = ctx.setLocale;
  callable.formatPrice = ctx.formatPrice;
  callable.formatDate = ctx.formatDate;

  return callable;
}

export default LanguageProvider;

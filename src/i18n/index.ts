// ============================================================
// LUXE E-Commerce — i18n Core System
// Supports English (default) & Indonesian with interpolation and plurals
// ============================================================
import en from './en.json';
import id from './id.json';

export type Locale = 'en' | 'id';

export const DEFAULT_LOCALE: Locale = 'en';
export const DEFAULT: Locale = 'en';
export const LOCALES: Locale[] = ['en', 'id'];

const dictionaries: Record<Locale, typeof en> = { en, id };

/**
 * Returns the dictionary object for the specified locale.
 */
export function getDictionary(locale: Locale = DEFAULT_LOCALE): typeof en {
  return dictionaries[locale] || dictionaries[DEFAULT_LOCALE];
}

/**
 * Translate a key into the given locale with parameter interpolation and pluralization.
 */
export function t(
  key: string,
  params?: Record<string, string | number>,
  locale: Locale = DEFAULT_LOCALE
): string {
  const dict = getDictionary(locale);
  const keys = key.split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let value: any = dict;

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      // Fallback to English dictionary if key is missing in active locale
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let fallbackVal: any = dictionaries.en;
      for (const fk of keys) {
        if (fallbackVal && typeof fallbackVal === 'object' && fk in fallbackVal) {
          fallbackVal = fallbackVal[fk];
        } else {
          fallbackVal = undefined;
          break;
        }
      }
      value = fallbackVal;
      break;
    }
  }

  if (value === undefined || value === null) {
    return key;
  }

  // Handle plural object { one: "...", other: "..." }
  if (typeof value === 'object' && ('one' in value || 'other' in value)) {
    const count = params?.count !== undefined ? Number(params.count) : undefined;
    if (count !== undefined) {
      if (locale === 'en') {
        value = count === 1 ? value.one : value.other;
      } else {
        // Indonesian: use 'one' if 1 and present, otherwise 'other' (e.g. 1 produk / 10 produk)
        value = count === 1 && value.one ? value.one : (value.other || value.one);
      }
    } else {
      value = value.other || value.one || '';
    }
  }

  if (typeof value !== 'string') {
    return String(value);
  }

  // Interpolation {param}
  if (params) {
    let result = value;
    for (const [pKey, pVal] of Object.entries(params)) {
      result = result.replace(new RegExp(`\\{${pKey}\\}`, 'g'), String(pVal));
    }
    return result;
  }

  return value;
}

/**
 * Content localization helper for Category names.
 * Uses label_en/name_en or label_id/name_id if present, falling back to name/label.
 */
export function getLocalizedCategoryName(
  category:
    | {
        name?: string;
        label?: string;
        name_en?: string;
        name_id?: string;
        label_en?: string;
        label_id?: string;
      }
    | null
    | undefined,
  locale: Locale = DEFAULT_LOCALE
): string {
  if (!category) return '';
  if (locale === 'en') {
    return category.label_en || category.name_en || category.name || category.label || '';
  }
  return category.label_id || category.name_id || category.name || category.label || '';
}

/**
 * Content localization helper for Navbar menu labels.
 * Uses label_en or label_id if present, falling back to label or name.
 */
export function getLocalizedNavLabel(
  item:
    | {
        label?: string;
        name?: string;
        label_en?: string;
        label_id?: string;
        name_en?: string;
        name_id?: string;
      }
    | null
    | undefined,
  locale: Locale = DEFAULT_LOCALE
): string {
  if (!item) return '';
  if (locale === 'en') {
    return item.label_en || item.name_en || item.label || item.name || '';
  }
  return item.label_id || item.name_id || item.label || item.name || '';
}

// ============================================================
// LUXE E-Commerce - Navigation Configuration & Fallback
// ============================================================
import type { NavigationItem, NavigationChildCategory } from '@/types';

/**
 * Fallback menu bila API navigasi gagal dimuat atau mengembalikan error.
 * Menjamin navbar tidak kosong.
 * Link tiap menu: /products?menu=<slug>, All Products: /products
 */
export const DEFAULT_NAV_ITEMS: NavigationItem[] = [
  {
    id: 'nav_all',
    slug: '',
    label: 'All Products',
    label_en: 'All Products',
    label_id: 'Semua Produk',
    type: 'all',
    target: '/products',
    accent: false,
    order: 1,
    active: true,
    system: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'nav_new',
    slug: 'new-arrivals',
    label: 'New Arrivals',
    label_en: 'New Arrivals',
    label_id: 'Produk Baru',
    type: 'new',
    target: '/products?menu=new-arrivals',
    accent: false,
    order: 2,
    active: true,
    system: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'nav_women',
    slug: 'women',
    label: 'Women',
    label_en: 'Women',
    label_id: 'Wanita',
    type: 'url',
    target: '/products?menu=women',
    gender: 'women',
    accent: false,
    order: 3,
    active: true,
    system: false,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'nav_men',
    slug: 'men',
    label: 'Men',
    label_en: 'Men',
    label_id: 'Pria',
    type: 'url',
    target: '/products?menu=men',
    gender: 'men',
    accent: false,
    order: 4,
    active: true,
    system: false,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'nav_collections',
    slug: 'collections',
    label: 'Collections',
    label_en: 'Collections',
    label_id: 'Koleksi',
    type: 'url',
    target: '/products?menu=collections',
    accent: false,
    order: 5,
    active: true,
    system: false,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'nav_sale',
    slug: 'sale',
    label: 'Sale',
    label_en: 'Sale',
    label_id: 'Diskon',
    type: 'sale',
    target: '/products?menu=sale',
    accent: true,
    order: 6,
    active: true,
    system: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

/**
 * Mendapatkan slug unik dari navigation item.
 */
export function getNavigationItemSlug(item: NavigationItem): string {
  if (item.slug && item.slug.trim()) {
    return item.slug.trim().toLowerCase();
  }

  // Cek apakah target memuat ?menu=
  if (item.target) {
    try {
      const url = new URL(item.target, 'http://dummy.local');
      const menuParam = url.searchParams.get('menu');
      if (menuParam) return menuParam.toLowerCase();
    } catch {}
  }

  // All products selalu bertindak sebagai slug kosong / default
  if (item.type === 'all' || item.id === 'nav_all') {
    return '';
  }

  // Fallback berdasarkan identifier / label standar
  if (item.id === 'nav_women' || item.label?.toLowerCase() === 'women' || item.target?.includes('women')) {
    return 'women';
  }
  if (item.id === 'nav_men' || item.label?.toLowerCase() === 'men' || item.target?.includes('men')) {
    return 'men';
  }
  if (item.id === 'nav_collections' || item.label?.toLowerCase() === 'collections' || item.target?.includes('collections')) {
    return 'collections';
  }
  if (item.id === 'nav_sale' || item.type === 'sale' || item.label?.toLowerCase() === 'sale' || item.target?.includes('sale')) {
    return 'sale';
  }
  if (item.id === 'nav_new' || item.type === 'new' || item.label?.toLowerCase() === 'new arrivals' || item.target?.includes('new')) {
    return 'new-arrivals';
  }

  if (item.label) {
    return item.label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  return '';
}

/**
 * Menghasilkan link URL tujuan untuk navbar storefront:
 * - Tiap menu: /products?menu=<slug>
 * - All products: /products (tanpa query)
 */
export function getNavigationItemHref(item: NavigationItem): string {
  const slug = getNavigationItemSlug(item);
  if (!slug || slug === 'all') {
    return '/products';
  }
  return `/products?menu=${encodeURIComponent(slug)}`;
}

/**
 * Tidak ada dropdown submenu di navbar (desktop dan mobile).
 * Mengembalikan array kosong.
 */
export function getNavigationChildren(_item: NavigationItem): NavigationChildCategory[] {
  return [];
}

/**
 * Menentukan apakah item navbar sedang aktif.
 * Tepat SATU menu menyala:
 * - Yang slug-nya sama dengan ?menu
 * - Jika tidak ada ?menu, All Products menyala
 */
export function isNavigationItemActive(
  item: NavigationItem,
  pathname: string,
  searchParams: URLSearchParams
): boolean {
  if (pathname !== '/products') {
    return false;
  }

  const menuParam = searchParams.get('menu')?.trim().toLowerCase();
  const itemSlug = getNavigationItemSlug(item);

  // Jika tidak ada ?menu, All Products menyala
  if (!menuParam) {
    return item.type === 'all' || item.id === 'nav_all' || itemSlug === '' || itemSlug === 'all';
  }

  // Tepat satu menu menyala, yaitu yang slug-nya sama dengan ?menu
  if (itemSlug === menuParam) {
    return true;
  }

  // Dukungan kesesuaian alias 'new' vs 'new-arrivals'
  if (
    (menuParam === 'new' || menuParam === 'new-arrivals') &&
    (itemSlug === 'new' || itemSlug === 'new-arrivals' || item.type === 'new' || item.id === 'nav_new')
  ) {
    return true;
  }

  // Dukungan jika ?menu=all
  if (menuParam === 'all' && (item.type === 'all' || item.id === 'nav_all' || itemSlug === '' || itemSlug === 'all')) {
    return true;
  }

  return false;
}

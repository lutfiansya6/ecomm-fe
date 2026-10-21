// ============================================================
// LUXE — Color Variant Helpers & Image Resolution
// ============================================================
import type { Product, ColorVariant } from '@/types';

export const COLOR_HEX_MAP: Record<string, string> = {
  navy: '#1F2A44',
  'midnight navy': '#151E3D',
  black: '#000000',
  ivory: '#FFFFF0',
  charcoal: '#36454F',
  cognac: '#9E471A',
  camel: '#C19A6B',
  ecru: '#C2B280',
  stone: '#928E85',
  'deep burgundy': '#800020',
  burgundy: '#800020',
  sapphire: '#0F52BA',
  emerald: '#50C878',
  taupe: '#87796F',
  white: '#FFFFFF',
  gold: '#D4AF37',
  silver: '#C0C0C0',
  tan: '#D2B48C',
  beige: '#F5F5DC',
  brown: '#8B4513',
  red: '#FF0000',
  blue: '#0000FF',
  green: '#008000',
  yellow: '#FFFF00',
  orange: '#FFA500',
  purple: '#800080',
  pink: '#FFC0CB',
  grey: '#808080',
  gray: '#808080',
  olive: '#808000',
  maroon: '#800000',
  cream: '#FFFDD0',
  khaki: '#F0E68C',
  teal: '#008080',
  coral: '#FF7F50',
  indigo: '#4B0082',
  violet: '#EE82EE',
  turquoise: '#40E0D0',
  // Combinations
  'black/gold': '#1A1A1A',
  'ivory/silver': '#F5F5F0',
  'gold/navy': '#1F2A44',
  'ivory/gold': '#FFFFF0',
  'tan/gold': '#D2B48C',
  'white/silver': '#FFFFFF',
};

/**
 * Guess hex color string in #RRGGBB format from a color name.
 */
export function guessColorHex(colorName: string): string {
  if (!colorName || typeof colorName !== 'string') return '#1a1a1a';
  const normalized = colorName.trim().toLowerCase();

  // 1. Direct match
  if (COLOR_HEX_MAP[normalized]) {
    return COLOR_HEX_MAP[normalized];
  }

  // 2. Check combination with slash (e.g. "black/gold")
  if (normalized.includes('/')) {
    const parts = normalized.split('/').map((p) => p.trim());
    for (const part of parts) {
      if (COLOR_HEX_MAP[part]) return COLOR_HEX_MAP[part];
    }
  }

  // 3. Multi-word match
  for (const [key, hex] of Object.entries(COLOR_HEX_MAP)) {
    if (normalized.includes(key)) return hex;
  }

  // 4. Word-by-word match
  const words = normalized.split(/[\s-]+/);
  for (const word of words) {
    if (COLOR_HEX_MAP[word]) return COLOR_HEX_MAP[word];
  }

  return '#2a2a2a';
}

export const DEFAULT_PLACEHOLDER_IMAGE = '/product_dress_1_1790064527682.jpg';

/**
 * Returns a valid image URL for Next.js <Image>:
 * - If localhost/127.0.0.1 with /uploads/, strips the host and returns /uploads/...
 *   so that it seamlessly routes through Next.js rewrite /uploads/:path* -> ${backendUrl}/uploads/:path*
 * - If already a full URL (http:// or https://), returns as-is.
 * - If a local path starting with "/", returns as-is (from public folder).
 * - If empty/null/undefined, returns the default placeholder image.
 * - If a relative path without leading slash, prepends "/".
 */
export function getImageUrl(path?: string | null, fallback = DEFAULT_PLACEHOLDER_IMAGE): string {
  if (!path || typeof path !== 'string' || !path.trim()) {
    return fallback;
  }
  const trimmed = path.trim();

  // If it's a localhost / 127.0.0.1 URL pointing to /uploads/..., convert to relative path
  // so Next.js serves it through its /uploads rewrite without SSRF or port mismatches
  const localUploadMatch = trimmed.match(
    /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?(\/uploads\/[^\s?#]+.*)$/i
  );
  if (localUploadMatch && localUploadMatch[1]) {
    return localUploadMatch[1];
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  if (trimmed.startsWith('/')) {
    return trimmed;
  }
  return `/${trimmed}`;
}

/**
 * Single source of truth for resolving photos belonging to a product color variant.
 * 1. Matches color variant by name (case-insensitive & trimmed)
 * 2. Uses variant.images if available
 * 3. In dev mode, warns via console.warn if variant exists but has no photos
 * 4. Falls back to product.images
 * 5. Falls back to [DEFAULT_PLACEHOLDER_IMAGE] only if product has no images at all
 */
export function getVariantImages(
  product: Product | null | undefined,
  colorName?: string | null
): string[] {
  if (!product) return [DEFAULT_PLACEHOLDER_IMAGE];

  const trimmedColor = (colorName || '').trim().toLowerCase();

  // 1. Check in colorVariants
  if (trimmedColor && Array.isArray(product.colorVariants) && product.colorVariants.length > 0) {
    const variant = product.colorVariants.find(
      (v) => (v.name || '').trim().toLowerCase() === trimmedColor
    );

    if (variant) {
      const ownImages = Array.isArray(variant.images)
        ? variant.images.filter((img) => typeof img === 'string' && img.trim().length > 0)
        : [];

      if (ownImages.length > 0) {
        return ownImages.map((img) => getImageUrl(img));
      }

      // Variant exists but has no images: warn in development
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          `[LUXE] Warna "${variant.name}" pada produk "${product.name || product.id}" tidak memiliki foto varian.`
        );
      }
    }
  }

  // 2. Fallback to product.images
  const fallbackImages = Array.isArray(product.images)
    ? product.images.filter((img) => typeof img === 'string' && img.trim().length > 0)
    : [];

  if (fallbackImages.length > 0) {
    return fallbackImages.map((img) => getImageUrl(img));
  }

  // If no photos exist anywhere on the product
  if (trimmedColor && process.env.NODE_ENV !== 'production') {
    console.warn(
      `[LUXE] Warna "${colorName}" pada produk "${product.name || product.id}" tidak memiliki foto varian.`
    );
  }

  return [DEFAULT_PLACEHOLDER_IMAGE];
}

/**
 * Returns available stock for a product variant by color name and optional size name.
 * - If color and size are specified, returns stock for that exact combination from sizeStock.
 * - If only color is specified, returns total stock for that color (sum of sizeStock or variant.stock).
 * - Falls back to product.stock if variant has no explicit stock.
 */
export function getVariantStock(
  product: Product | null | undefined,
  colorName?: string | null,
  sizeName?: string | null
): number {
  if (!product) return 0;
  const trimmedColor = (colorName || '').trim().toLowerCase();
  const trimmedSize = (sizeName || '').trim();

  if (trimmedColor && Array.isArray(product.colorVariants) && product.colorVariants.length > 0) {
    const variant = product.colorVariants.find(
      (v) => (v.name || '').trim().toLowerCase() === trimmedColor
    );
    if (variant) {
      if (trimmedSize && variant.sizeStock && typeof variant.sizeStock === 'object') {
        const matchingKey = Object.keys(variant.sizeStock).find(
          (k) => k.trim().toLowerCase() === trimmedSize.toLowerCase()
        );
        if (matchingKey && typeof variant.sizeStock[matchingKey] === 'number') {
          return Math.max(0, variant.sizeStock[matchingKey]);
        }
        return 0;
      }
      if (!trimmedSize && variant.sizeStock && typeof variant.sizeStock === 'object') {
        const values = Object.values(variant.sizeStock);
        if (values.length > 0) {
          return Math.max(
            0,
            values.reduce((sum, n) => sum + (Number(n) || 0), 0)
          );
        }
      }
      if (typeof variant.stock === 'number') {
        return Math.max(0, variant.stock);
      }
    }
  }

  // Fallback for legacy or products without colorVariants
  return typeof product.stock === 'number' ? Math.max(0, product.stock) : 0;
}

/**
 * Checks if a color variant is completely out of stock across all its sizes.
 * A color variant is considered out of stock only if ALL its sizes have 0 stock.
 */
export function isColorVariantOutOfStock(
  product: Product | null | undefined,
  variant: ColorVariant | null | undefined
): boolean {
  if (!product || !variant) return false;
  if (variant.sizeStock && typeof variant.sizeStock === 'object') {
    const entries = Object.entries(variant.sizeStock);
    if (entries.length > 0) {
      return entries.every(([, qty]) => (Number(qty) || 0) <= 0);
    }
  }
  if (typeof variant.stock === 'number') {
    return variant.stock <= 0;
  }
  return (product.stock ?? 0) <= 0;
}

/**
 * Normalizes color variants for a product.
 * If colorVariants exists and is non-empty, uses it.
 * If not, falls back safely to legacy colors and images arrays.
 */
export function getNormalizedColorVariants(product: Product | null): ColorVariant[] {
  if (!product) return [];

  if (Array.isArray(product.colorVariants) && product.colorVariants.length > 0) {
    return product.colorVariants.map((v) => {
      const images = getVariantImages(product, v.name);
      return {
        name: v.name,
        hex: v.hex || guessColorHex(v.name),
        images,
        stock: typeof v.stock === 'number' ? v.stock : product.stock,
        price: typeof v.price === 'number' && v.price > 0 ? v.price : undefined,
        sizeStock: v.sizeStock,
      };
    });
  }

  if (Array.isArray(product.colors) && product.colors.length > 0) {
    return product.colors.map((color) => ({
      name: color,
      hex: guessColorHex(color),
      images: getVariantImages(product, color),
      stock: product.stock,
    }));
  }

  return [
    {
      name: 'Default',
      hex: '#1a1a1a',
      images: getVariantImages(product, null),
      stock: product.stock,
    },
  ];
}

/**
 * Resolves the thumbnail image for a cart item:
 * 1. Checks item.image (explicit color image saved at add-to-cart time)
 * 2. Matches item.color via getVariantImages(item.product, item.color)[0]
 * 3. Falls back to DEFAULT_PLACEHOLDER_IMAGE
 */
export function getCartItemImage(item: {
  product: Product;
  color?: string;
  image?: string;
}): string {
  if (item.image && typeof item.image === 'string' && item.image.trim()) {
    return getImageUrl(item.image);
  }

  const variantImages = getVariantImages(item.product, item.color);
  return variantImages[0] || DEFAULT_PLACEHOLDER_IMAGE;
}


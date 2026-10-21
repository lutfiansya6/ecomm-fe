'use client';
import Image from 'next/image';
import { Check } from 'lucide-react';
import type { ColorVariant } from '@/types';
import { getImageUrl, DEFAULT_PLACEHOLDER_IMAGE } from '@/lib/utils';
import { useT } from '@/i18n/LanguageProvider';
import styles from './ProductGallery.module.css';

interface ColorVariantPickerProps {
  variants?: ColorVariant[];
  selected: string;
  onSelect: (variant: ColorVariant) => void;
  isOutOfStock: (variant: ColorVariant) => boolean;
  /** Show a mini photo per color (true for products with real colorVariants). Otherwise a hex swatch is shown. */
  showPhotos?: boolean;
}

/**
 * Shopee-style color chips: small rectangle with a 28px photo + color name.
 * Selected chip gets a gold border and a corner check mark; sold-out chips are dimmed & struck through.
 */
export default function ColorVariantPicker({
  variants = [],
  selected,
  onSelect,
  isOutOfStock,
  showPhotos = true,
}: ColorVariantPickerProps) {
  const { t } = useT();
  const list = variants ?? [];
  if (list.length === 0) return null;

  return (
    <div>
      <p className={styles.colorLabel} id="color-picker-label">
        {t('product.color')}:<strong>{selected || '-'}</strong>
      </p>
      <div className={styles.chips} role="radiogroup" aria-labelledby="color-picker-label">
        {list.map((v, idx) => {
          const isSelected = selected.trim().toLowerCase() === v.name.trim().toLowerCase();
          const outOfStock = isOutOfStock(v);
          const rawThumb = Array.isArray(v.images) && v.images.length > 0 ? v.images[0] : '';
          const thumb = rawThumb ? getImageUrl(rawThumb) : '';

          return (
            <button
              key={`${v.name}-${idx}`}
              id={`color-chip-${idx}`}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={outOfStock}
              title={outOfStock ? `${v.name} (${t('product.outOfStock')})` : v.name}
              aria-label={outOfStock ? `${v.name} (${t('product.outOfStock')})` : v.name}
              onClick={() => onSelect(v)}
              className={[
                styles.chip,
                isSelected ? styles.chipSelected : '',
                outOfStock ? styles.chipOut : '',
              ].join(' ')}
            >
              {showPhotos && thumb ? (
                <span className={styles.chipThumb}>
                  <Image
                    src={thumb}
                    alt=""
                    fill
                    sizes="28px"
                    style={{ objectFit: 'cover' }}
                    draggable={false}
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      if (!target.src.includes(DEFAULT_PLACEHOLDER_IMAGE)) {
                        target.srcset = '';
                        target.src = DEFAULT_PLACEHOLDER_IMAGE;
                      }
                    }}
                  />
                </span>
              ) : (
                <span
                  className={styles.chipSwatch}
                  style={{ backgroundColor: v.hex || '#1a1a1a' }}
                />
              )}
              <span className={styles.chipName}>{v.name}</span>
              {outOfStock && <span className={styles.chipSoldOutLabel}>{t('product.outOfStock')}</span>}
              {isSelected && !outOfStock && (
                <span className={styles.chipCheck} aria-hidden="true">
                  <Check size={8} strokeWidth={4} />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

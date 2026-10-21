'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { DEFAULT_PLACEHOLDER_IMAGE } from '@/lib/utils';
import { useT } from '@/i18n/LanguageProvider';
import styles from './ProductGallery.module.css';

interface ProductLightboxProps {
  /** Already-resolved image URLs (via getImageUrl) */
  images?: string[];
  initialIndex?: number;
  productName: string;
  colorName?: string;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
}

const FOCUSABLE = 'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

/**
 * Large image viewer: photo + edge arrows on the left, product name + 3-column thumbnail grid on the right.
 * Mount it only while open — it locks body scroll on mount and restores it on unmount.
 */
export default function ProductLightbox({
  images = [],
  initialIndex = 0,
  productName,
  colorName = '',
  onClose,
  onIndexChange,
}: ProductLightboxProps) {
  const { t } = useT();
  const list = images ?? [];
  const total = list.length;
  const [index, setIndex] = useState(() => Math.max(0, Math.min(total - 1, initialIndex)));
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const touchStartX = useRef<number | null>(null);

  const go = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(total - 1, next));
      setIndex(clamped);
      onIndexChange?.(clamped);
    },
    [total, onIndexChange]
  );

  // Lock page scroll + move focus into the dialog
  useEffect(() => {
    const body = document.body;
    const prevOverflow = body.style.overflow;
    const prevPadding = body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;
    closeBtnRef.current?.focus({ preventScroll: true });
    return () => {
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPadding;
    };
  }, []);

  // Keyboard: Esc closes, arrows navigate, Tab stays inside the dialog
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        go(index - 1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        go(index + 1);
      } else if (e.key === 'Tab' && dialogRef.current) {
        const nodes = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
        if (nodes.length === 0) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, index, onClose]);

  // Keep the active thumbnail visible in the side panel
  useEffect(() => {
    thumbRefs.current[index]?.scrollIntoView({
      block: 'nearest',
      inline: 'nearest',
      behavior: 'smooth',
    });
  }, [index]);

  if (total === 0) return null;

  const current = failed[list[index]] ? DEFAULT_PLACEHOLDER_IMAGE : list[index];

  return createPortal(
    <div
      className={styles.lbOverlay}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className={styles.lbDialog}
        role="dialog"
        aria-modal="true"
        aria-label={t('product.photoGallery', { name: productName })}
      >
        <button
          ref={closeBtnRef}
          id="lightbox-close"
          type="button"
          className={styles.lbClose}
          onClick={onClose}
          aria-label={t('product.closeGallery')}
        >
          <X size={18} />
        </button>

        {/* Stage */}
        <div
          className={styles.lbStage}
          onTouchStart={(e) => {
            touchStartX.current = e.touches[0]?.clientX ?? null;
          }}
          onTouchEnd={(e) => {
            if (touchStartX.current === null) return;
            const dx = (e.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current;
            touchStartX.current = null;
            if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
          }}
        >
          <Image
            key={current}
            src={current}
            alt={`${productName}${colorName ? ` - ${colorName}` : ''} (${index + 1} / ${total})`}
            fill
            sizes="(max-width: 768px) 100vw, 760px"
            className={styles.lbImage}
            style={{ objectFit: 'contain' }}
            draggable={false}
            priority
            onError={() => setFailed((f) => ({ ...f, [list[index]]: true }))}
          />

          {total > 1 && index > 0 && (
            <button
              id="lightbox-prev"
              type="button"
              className={`${styles.lbArrow} ${styles.lbPrev}`}
              onClick={() => go(index - 1)}
              aria-label={t('product.prevPhoto')}
            >
              <ChevronLeft size={26} />
            </button>
          )}
          {total > 1 && index < total - 1 && (
            <button
              id="lightbox-next"
              type="button"
              className={`${styles.lbArrow} ${styles.lbNext}`}
              onClick={() => go(index + 1)}
              aria-label={t('product.nextPhoto')}
            >
              <ChevronRight size={26} />
            </button>
          )}
          {total > 1 && (
            <div className={styles.lbCounter} aria-live="polite">
              <strong>{index + 1}</strong> / {total}
            </div>
          )}
        </div>

        {/* Side panel */}
        <aside className={styles.lbSide}>
          <div>
            <h2 className={styles.lbTitle}>{productName}</h2>
            {colorName && (
              <p className={styles.lbColor}>
                {t('product.color')}: {colorName}
              </p>
            )}
          </div>
          <div className={styles.lbGrid}>
            {list.map((src, i) => (
              <button
                key={`${src}-${i}`}
                ref={(el) => {
                  thumbRefs.current[i] = el;
                }}
                id={`lightbox-thumb-${i}`}
                type="button"
                className={`${styles.thumb} ${i === index ? styles.thumbActive : ''}`}
                onClick={() => go(i)}
                aria-label={t('product.viewPhoto', { index: i + 1 })}
                aria-current={i === index}
              >
                <Image
                  src={failed[src] ? DEFAULT_PLACEHOLDER_IMAGE : src}
                  alt=""
                  fill
                  sizes="96px"
                  style={{ objectFit: 'cover' }}
                  draggable={false}
                  onError={() => setFailed((f) => ({ ...f, [src]: true }))}
                />
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>,
    document.body
  );
}

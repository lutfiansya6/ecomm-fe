'use client';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Expand } from 'lucide-react';
import { getImageUrl, DEFAULT_PLACEHOLDER_IMAGE } from '@/lib/utils';
import ProductLightbox from './ProductLightbox';
import styles from './ProductGallery.module.css';

const MAIN_SIZES = '(max-width: 900px) 100vw, 50vw';
const THUMB_SIZES = '120px';

interface ProductGalleryProps {
  /** Photos of the currently selected color */
  images?: string[];
  productName: string;
  colorName?: string;
  /** Overlay rendered at the top-left of the main photo (e.g. discount badge) */
  badge?: ReactNode;
  /** Photos of every color — rendered offscreen so switching colors never flickers */
  preloadImages?: string[];
}

/**
 * Shopee-style product gallery:
 * - Main photo slider (CSS scroll-snap) with swipe, mouse drag, edge arrows & keyboard arrows
 * - "2 / 5" indicator
 * - Scrollable thumbnail strip (~5 visible) with conditional edge arrows
 * - Click main photo to open a lightbox
 * Changing `images` (i.e. switching color) resets to the first photo with a 200ms fade.
 */
export default function ProductGallery({
  images = [],
  productName,
  colorName = '',
  badge,
  preloadImages = [],
}: ProductGalleryProps) {
  const slides = useMemo(() => {
    const list = (images ?? []).filter(Boolean).map((img) => getImageUrl(img));
    return list.length > 0 ? list : [DEFAULT_PLACEHOLDER_IMAGE];
  }, [images]);
  const slidesKey = slides.join('|');
  const total = slides.length;
  const hasMany = total > 1;

  const [active, setActive] = useState(0);
  const [prevKey, setPrevKey] = useState(slidesKey);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Color switched → back to the first photo (state adjusted during render, no extra effect pass)
  if (prevKey !== slidesKey) {
    setPrevKey(slidesKey);
    setActive(0);
  }

  const trackRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const activeRef = useRef(0);
  const targetRef = useRef<number | null>(null);
  const targetTimer = useRef<number | undefined>(undefined);
  const snapTimer = useRef<number | undefined>(undefined);
  const suppressClick = useRef(false);
  const drag = useRef({ active: false, moved: false, startX: 0, startScroll: 0, pointerId: -1 });

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(
    () => () => {
      window.clearTimeout(targetTimer.current);
      window.clearTimeout(snapTimer.current);
    },
    []
  );

  const resolveSrc = useCallback((src: string) => (failed[src] ? DEFAULT_PLACEHOLDER_IMAGE : src), [failed]);
  const markFailed = useCallback((src: string) => {
    setFailed((f) => (f[src] ? f : { ...f, [src]: true }));
  }, []);

  /** Slide the main photo to `index`. */
  const goTo = useCallback(
    (index: number, behavior: ScrollBehavior = 'smooth') => {
      const clamped = Math.max(0, Math.min(total - 1, index));
      setActive(clamped);
      const track = trackRef.current;
      if (!track) return;
      // Ignore intermediate scroll positions while animating to the target
      targetRef.current = clamped;
      window.clearTimeout(targetTimer.current);
      targetTimer.current = window.setTimeout(() => {
        targetRef.current = null;
      }, 700);
      track.scrollTo({ left: clamped * track.clientWidth, behavior });
    },
    [total]
  );

  const handleTrackScroll = () => {
    const track = trackRef.current;
    if (!track || drag.current.active) return;
    const width = track.clientWidth;
    if (!width) return;
    const idx = Math.max(0, Math.min(total - 1, Math.round(track.scrollLeft / width)));
    if (targetRef.current !== null) {
      if (idx !== targetRef.current) return;
      targetRef.current = null;
    }
    setActive((prev) => (prev === idx ? prev : idx));
  };

  // Keep slide aligned when the container is resized
  useEffect(() => {
    const track = trackRef.current;
    if (!track || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => {
      track.scrollTo({ left: activeRef.current * track.clientWidth, behavior: 'auto' });
    });
    ro.observe(track);
    return () => ro.disconnect();
  }, [slidesKey]);

  // ---------- Mouse drag (touch uses native scroll-snap swipe) ----------
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    suppressClick.current = false;
    if (e.pointerType !== 'mouse' || e.button !== 0 || !hasMany) return;
    const track = trackRef.current;
    if (!track) return;
    window.clearTimeout(snapTimer.current);
    drag.current = { active: true, moved: false, startX: e.clientX, startScroll: track.scrollLeft, pointerId: e.pointerId };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    const track = trackRef.current;
    if (!d.active || !track) return;
    const dx = e.clientX - d.startX;
    if (!d.moved) {
      if (Math.abs(dx) < 6) return;
      d.moved = true;
      track.setPointerCapture(e.pointerId);
      track.style.scrollSnapType = 'none';
      track.style.scrollBehavior = 'auto';
      setDragging(true);
    }
    track.scrollLeft = d.startScroll - dx;
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    const track = trackRef.current;
    if (!d.active || !track) return;
    d.active = false;
    if (!d.moved) return;

    if (track.hasPointerCapture(d.pointerId)) track.releasePointerCapture(d.pointerId);
    suppressClick.current = true;
    setDragging(false);

    const width = track.clientWidth || 1;
    const dx = e.clientX - d.startX;
    const threshold = Math.min(60, width * 0.15);
    const startIdx = Math.round(d.startScroll / width);
    const target = dx < -threshold ? startIdx + 1 : dx > threshold ? startIdx - 1 : startIdx;

    track.style.scrollBehavior = '';
    goTo(target, 'smooth');
    snapTimer.current = window.setTimeout(() => {
      track.style.scrollSnapType = '';
    }, 450);
  };

  const openLightbox = () => {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    setLightboxOpen(true);
  };

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
    // Return focus to the main photo
    requestAnimationFrame(() => trackRef.current?.focus({ preventScroll: true }));
  }, []);

  const syncFromLightbox = useCallback((i: number) => goTo(i, 'auto'), [goTo]);

  // ---------- Keyboard arrows (page-level, ignored while typing) ----------
  useEffect(() => {
    if (lightboxOpen || !hasMany) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable="true"], [role="slider"], [role="radiogroup"]')) return;
      e.preventDefault();
      goTo(activeRef.current + (e.key === 'ArrowRight' ? 1 : -1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxOpen, hasMany, goTo]);

  // ---------- Thumbnail strip ----------
  const updateStripArrows = useCallback(() => {
    const strip = stripRef.current;
    if (!strip) return;
    setCanScrollLeft(strip.scrollLeft > 2);
    setCanScrollRight(strip.scrollLeft + strip.clientWidth < strip.scrollWidth - 2);
  }, []);

  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    const raf = requestAnimationFrame(updateStripArrows);
    if (typeof ResizeObserver === 'undefined') return () => cancelAnimationFrame(raf);
    const ro = new ResizeObserver(updateStripArrows);
    ro.observe(strip);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [slidesKey, updateStripArrows]);

  // Scroll the active thumbnail into view (horizontal only — never moves the page)
  useEffect(() => {
    const strip = stripRef.current;
    const thumb = thumbRefs.current[active];
    if (!strip || !thumb) return;
    const left = thumb.offsetLeft - 2;
    const right = thumb.offsetLeft + thumb.offsetWidth + 2;
    if (left < strip.scrollLeft) {
      strip.scrollTo({ left, behavior: 'smooth' });
    } else if (right > strip.scrollLeft + strip.clientWidth) {
      strip.scrollTo({ left: right - strip.clientWidth, behavior: 'smooth' });
    }
  }, [active, slidesKey]);

  const scrollStrip = (dir: -1 | 1) => {
    const strip = stripRef.current;
    if (!strip) return;
    strip.scrollBy({ left: dir * strip.clientWidth * 0.8, behavior: 'smooth' });
  };

  // Offscreen preload list: every color's photos not currently shown
  const preloadList = useMemo(() => {
    const current = new Set(slides);
    const out = new Set<string>();
    (preloadImages ?? []).forEach((img) => {
      if (!img) return;
      const url = getImageUrl(img);
      if (!current.has(url)) out.add(url);
    });
    return Array.from(out);
  }, [preloadImages, slides]);

  const altBase = `${productName}${colorName ? ` - ${colorName}` : ''}`;

  return (
    <div className={styles.gallery}>
      {/* Main photo slider */}
      <div className={styles.main}>
        <div
          key={slidesKey}
          ref={trackRef}
          className={`${styles.track} ${dragging ? styles.trackDragging : ''}`}
          tabIndex={0}
          role="region"
          aria-roledescription="carousel"
          aria-label={`Foto ${altBase}. Klik untuk memperbesar.`}
          onScroll={handleTrackScroll}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onClick={openLightbox}
          onDragStart={(e) => e.preventDefault()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setLightboxOpen(true);
            }
          }}
        >
          {slides.map((src, i) => (
            <div
              key={`${src}-${i}`}
              className={styles.slide}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} dari ${total}`}
            >
              <Image
                src={resolveSrc(src)}
                alt={`${altBase} (${i + 1} dari ${total})`}
                fill
                sizes={MAIN_SIZES}
                style={{ objectFit: 'cover' }}
                draggable={false}
                priority={i === 0}
                loading={i === 0 ? undefined : 'eager'}
                onError={() => markFailed(src)}
              />
            </div>
          ))}
        </div>

        {badge && <div className={styles.badge}>{badge}</div>}

        <span className={styles.zoomHint} aria-hidden="true">
          <Expand size={15} />
        </span>

        {hasMany && active > 0 && (
          <button
            id="gallery-prev"
            type="button"
            className={`${styles.navBtn} ${styles.navPrev}`}
            onClick={() => goTo(active - 1)}
            aria-label="Foto sebelumnya"
          >
            <ChevronLeft size={22} />
          </button>
        )}
        {hasMany && active < total - 1 && (
          <button
            id="gallery-next"
            type="button"
            className={`${styles.navBtn} ${styles.navNext}`}
            onClick={() => goTo(active + 1)}
            aria-label="Foto berikutnya"
          >
            <ChevronRight size={22} />
          </button>
        )}
        {hasMany && (
          <div className={styles.counter} aria-live="polite">
            <strong>{active + 1}</strong> / {total}
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      {hasMany && (
        <div className={styles.thumbs}>
          <div key={slidesKey} ref={stripRef} className={styles.thumbTrack} onScroll={updateStripArrows}>
            {slides.map((src, i) => (
              <button
                key={`${src}-${i}`}
                ref={(el) => {
                  thumbRefs.current[i] = el;
                }}
                id={`gallery-thumb-${i}`}
                type="button"
                className={`${styles.thumb} ${i === active ? styles.thumbActive : ''}`}
                onClick={() => goTo(i)}
                onPointerEnter={(e) => {
                  if (e.pointerType === 'mouse' && i !== activeRef.current) goTo(i, 'auto');
                }}
                aria-label={`Tampilkan foto ${i + 1}`}
                aria-current={i === active}
              >
                <Image
                  src={resolveSrc(src)}
                  alt=""
                  fill
                  sizes={THUMB_SIZES}
                  style={{ objectFit: 'cover' }}
                  draggable={false}
                  onError={() => markFailed(src)}
                />
              </button>
            ))}
          </div>
          {canScrollLeft && (
            <button
              id="gallery-thumbs-prev"
              type="button"
              className={`${styles.stripBtn} ${styles.stripPrev}`}
              onClick={() => scrollStrip(-1)}
              aria-label="Geser thumbnail ke kiri"
            >
              <ChevronLeft size={16} />
            </button>
          )}
          {canScrollRight && (
            <button
              id="gallery-thumbs-next"
              type="button"
              className={`${styles.stripBtn} ${styles.stripNext}`}
              onClick={() => scrollStrip(1)}
              aria-label="Geser thumbnail ke kanan"
            >
              <ChevronRight size={16} />
            </button>
          )}
        </div>
      )}

      {/* Offscreen preloader for other colors (same `sizes` as the visible images → same cached files) */}
      {preloadList.length > 0 && (
        <div className={styles.preload} aria-hidden="true">
          {preloadList.map((src) => (
            <div key={src}>
              <div className={styles.preloadItem}>
                <Image src={src} alt="" fill sizes={MAIN_SIZES} loading="eager" />
              </div>
              <div className={styles.preloadItem}>
                <Image src={src} alt="" fill sizes={THUMB_SIZES} loading="eager" />
              </div>
            </div>
          ))}
        </div>
      )}

      {lightboxOpen && (
        <ProductLightbox
          images={slides.map(resolveSrc)}
          initialIndex={active}
          productName={productName}
          colorName={colorName}
          onClose={closeLightbox}
          onIndexChange={syncFromLightbox}
        />
      )}
    </div>
  );
}

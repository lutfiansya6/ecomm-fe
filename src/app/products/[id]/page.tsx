'use client';
import { useEffect, useState, use, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag, ArrowLeft, Check, Minus, Plus } from 'lucide-react';
import type { Product, Review, ColorVariant, Category } from '@/types';
import { discountPercent, getImageUrl } from '@/lib/utils';
import {
  getNormalizedColorVariants,
  getVariantImages,
  getVariantStock,
  isColorVariantOutOfStock,
} from '@/lib/colors';
import { useCartStore } from '@/store/cart';
import { useToast } from '@/components/ui/ToastProvider';
import { useT } from '@/i18n/LanguageProvider';
import { getLocalizedCategoryName } from '@/i18n';
import StarRating from '@/components/ui/StarRating';
import ProductCard from '@/components/product/ProductCard';
import ProductTabs from '@/components/product/ProductTabs';
import ProductGallery from '@/components/product/ProductGallery';
import ColorVariantPicker from '@/components/product/ColorVariantPicker';

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { t, locale, formatPrice } = useT();
  const [mounted, setMounted] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoaded, setReviewsLoaded] = useState(false);
  const [focusReviewForm, setFocusReviewForm] = useState(false);
  const [preferredOrderId, setPreferredOrderId] = useState<string | null>(null);
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const { showToast } = useToast();

  useEffect(() => {
    setMounted(true);
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categories', { cache: 'no-store' });
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setCategories(json.data);
        } else {
          setCategories([]);
        }
      } catch {
        setCategories([]);
      }
    };
    fetchCategories();
  }, []);

  // Compute normalized color variants (supporting both colorVariants and legacy fallback)
  const variants = useMemo(() => getNormalizedColorVariants(product), [product]);

  // Resolve category name from latest categories data (fallback to formatted slug)
  const categoryName = useMemo(() => {
    if (!product) return '';
    const match = (categories || []).find(
      (c) =>
        (product.categoryId && c.id === product.categoryId) ||
        (product.category && c.slug.toLowerCase() === product.category.toLowerCase())
    );
    if (match) return getLocalizedCategoryName(match, locale);
    return product.category
      ? product.category.charAt(0).toUpperCase() + product.category.slice(1)
      : '';
  }, [product, categories, locale]);

  // Find currently active color variant (whitespace-trimmed & case-insensitive)
  const currentVariant = useMemo(() => {
    if (!variants || variants.length === 0) return null;
    const target = selectedColor.trim().toLowerCase();
    return variants.find((v) => v.name.trim().toLowerCase() === target) || variants[0];
  }, [variants, selectedColor]);

  // Images belonging to the selected color variant (single source of truth helper)
  const currentImages = useMemo(() => {
    return getVariantImages(product, selectedColor);
  }, [product, selectedColor]);

  // Collect all image URLs for preloading across colors
  const allVariantImages = useMemo(() => {
    const list: string[] = [];
    if (Array.isArray(product?.colorVariants)) {
      product.colorVariants.forEach((v) => {
        if (Array.isArray(v.images)) {
          v.images.forEach((img) => {
            if (img) list.push(img);
          });
        }
      });
    }
    if (Array.isArray(product?.images)) {
      product.images.forEach((img) => {
        if (img) list.push(img);
      });
    }
    return list;
  }, [product]);

  // Preload all color images into the browser cache
  useEffect(() => {
    if (!product) return;
    const urlsToPreload = new Set<string>();

    allVariantImages.forEach((img) => {
      if (img) urlsToPreload.add(img);
    });

    urlsToPreload.forEach((src) => {
      try {
        const img = new window.Image();
        img.src = getImageUrl(src);
      } catch {
        // Ignore preload errors
      }
    });
  }, [product, allVariantImages]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${id}`, { cache: 'no-store' });
        const data = await res.json();
        if (data.success && data.data) {
          const prod: Product = data.data;
          setProduct(prod);

          const normalizedVars = getNormalizedColorVariants(prod);
          const sizes = prod.sizes || [];

          // Initial selection: first available combination
          let initialColor = '';
          let initialSize = '';

          for (const v of normalizedVars) {
            for (const s of sizes) {
              if (getVariantStock(prod, v.name, s) > 0) {
                initialColor = v.name;
                initialSize = s;
                break;
              }
            }
            if (initialColor) break;
          }

          if (!initialColor && normalizedVars.length > 0) {
            initialColor = normalizedVars[0].name;
            initialSize = sizes[0] || '';
          }

          setSelectedColor(initialColor);
          setSelectedSize(initialSize);

          // Fetch related
          if (prod.category) {
            const relRes = await fetch(`/api/products?category=${prod.category}&limit=4`);
            const relData = await relRes.json();
            if (relData.success) {
              setRelated(
                (relData.data?.products || []).filter((p: Product) => p.id !== prod.id).slice(0, 4)
              );
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch product', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // Load reviews for this product
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await fetch(`/api/reviews?productId=${id}`, { cache: 'no-store' });
        const data = await res.json();
        if (data.success) {
          setReviews(data.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch reviews', err);
      } finally {
        setReviewsLoaded(true);
      }
    };

    fetchReviews();
  }, [id]);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('review') === '1') {
      setFocusReviewForm(true);
      setPreferredOrderId(searchParams.get('order'));
    }
  }, []);

  const reviewCount = reviews?.length ?? 0;
  const averageRating =
    reviewCount === 0
      ? 0
      : Math.round(((reviews ?? []).reduce((sum, r) => sum + r.rating, 0) / reviewCount) * 10) / 10;

  const isVariantOutOfStock = (v: ColorVariant | null) => {
    if (!v) return false;
    return isColorVariantOutOfStock(product, v);
  };

  const handleColorChange = (v: ColorVariant) => {
    if (isVariantOutOfStock(v)) return;
    if (v.name.trim().toLowerCase() === selectedColor.trim().toLowerCase()) return;
    setSelectedColor(v.name);

    const currentSizeStock = getVariantStock(product, v.name, selectedSize);
    if (currentSizeStock <= 0) {
      const firstAvailableSize = (product?.sizes || []).find(
        (s) => getVariantStock(product, v.name, s) > 0
      );
      if (firstAvailableSize) {
        setSelectedSize(firstAvailableSize);
      }
    }
  };

  const activePrice =
    typeof currentVariant?.price === 'number' && currentVariant.price > 0
      ? currentVariant.price
      : (product?.price ?? 0);

  const activeStock = useMemo(() => {
    return getVariantStock(product, selectedColor, selectedSize);
  }, [product, selectedColor, selectedSize]);

  const isCombinationOutOfStock = activeStock <= 0;
  const isAllOutOfStock =
    (variants ?? []).length > 0 && (variants ?? []).every((v) => isVariantOutOfStock(v));

  useEffect(() => {
    if (activeStock > 0 && quantity > activeStock) {
      setQuantity(activeStock);
    }
  }, [activeStock, quantity]);

  const handleAddToCart = () => {
    if (!product) return;
    if (!selectedSize) {
      showToast(t('product.selectSizePrompt'), 'error');
      return;
    }
    if (isCombinationOutOfStock || isAllOutOfStock) {
      showToast(t('product.combinationOutOfStock'), 'error');
      return;
    }

    const variantImgs = getVariantImages(product, selectedColor);
    const colorImage = variantImgs[0] || '';
    const productToAdd =
      activePrice !== product.price ? { ...product, price: activePrice } : product;

    addItem(productToAdd, quantity, selectedSize, selectedColor, colorImage);
    setAdded(true);
    showToast(
      t('product.addedToCart', {
        name: product.name,
        color: selectedColor,
        size: selectedSize,
      }),
      'success'
    );
    setTimeout(() => {
      setAdded(false);
      openCart();
    }, 1200);
  };

  if (!mounted || loading) {
    return (
      <div className="container" style={{ padding: 'var(--space-10) var(--space-6)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-12)' }}>
          <div
            className="skeleton"
            style={{ aspectRatio: '3/4', borderRadius: 'var(--radius-lg)' }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="skeleton" style={{ height: '14px', width: '40%' }} />
            <div className="skeleton" style={{ height: '36px', width: '80%' }} />
            <div className="skeleton" style={{ height: '24px', width: '30%' }} />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div
        style={{ padding: 'var(--space-20)', textAlign: 'center', color: 'var(--clr-text-2)' }}
      >
        {t('errors.notFound')}
      </div>
    );
  }

  const hasComparePrice = Boolean(product.comparePrice && product.comparePrice > activePrice);
  const hasColorVariantsData =
    Array.isArray(product.colorVariants) && product.colorVariants.length > 0;

  return (
    <div className="container" style={{ padding: 'var(--space-10) var(--space-6)' }}>
      {/* Back */}
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        style={{ marginBottom: 'var(--space-6)' }}
        onClick={() => router.back()}
      >
        <ArrowLeft size={16} /> {t('product.back')}
      </button>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
          gap: 'var(--space-12)',
          alignItems: 'start',
        }}
      >
        {/* Gallery Column */}
        <ProductGallery
          images={currentImages}
          productName={product.name}
          colorName={selectedColor}
          preloadImages={allVariantImages}
          badge={
            hasComparePrice && product.comparePrice ? (
              <span className="badge badge-gold">
                -{discountPercent(activePrice, product.comparePrice)}% {t('product.off')}
              </span>
            ) : null
          }
        />

        {/* Details Column */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-6)',
            animation: 'fadeIn 0.35s both',
          }}
        >
          <div>
            <span
              style={{
                fontSize: '0.75rem',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'var(--clr-gold)',
              }}
            >
              {categoryName}
            </span>
            <h1
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(1.5rem, 3vw, 2.2rem)',
                fontWeight: 400,
                marginTop: 'var(--space-2)',
                lineHeight: 1.2,
              }}
            >
              {product.name}
            </h1>
            <div
              id="product-rating-summary"
              style={{ marginTop: 'var(--space-3)', minHeight: '24px' }}
            >
              {reviewsLoaded &&
                (reviewCount > 0 ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-2)',
                      flexWrap: 'wrap',
                    }}
                  >
                    <StarRating rating={averageRating} size={16} />
                    <span style={{ fontWeight: 700, color: 'var(--clr-gold)' }}>
                      {averageRating.toFixed(1)}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--clr-text-2)' }}>
                      {t('product.reviewsCount', { count: reviewCount })}
                    </span>
                  </div>
                ) : (
                  <span style={{ fontSize: '0.85rem', color: 'var(--clr-text-3)' }}>
                    {t('product.noReviews')}
                  </span>
                ))}
            </div>
          </div>

          {/* Price */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-4)' }}>
            <span style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--clr-text)' }}>
              {formatPrice(activePrice)}
            </span>
            {hasComparePrice && product.comparePrice && (
              <span
                style={{
                  fontSize: '1.1rem',
                  color: 'var(--clr-text-3)',
                  textDecoration: 'line-through',
                }}
              >
                {formatPrice(product.comparePrice)}
              </span>
            )}
          </div>

          <hr className="divider" style={{ margin: '0' }} />

          {/* Color Selection */}
          <ColorVariantPicker
            variants={variants ?? []}
            selected={selectedColor}
            onSelect={handleColorChange}
            isOutOfStock={isVariantOutOfStock}
            showPhotos={hasColorVariantsData}
          />

          {/* Size */}
          <div>
            <p
              style={{
                fontSize: '0.8rem',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--clr-text-2)',
                marginBottom: 'var(--space-3)',
              }}
            >
              {t('product.size')}:{' '}
              <strong style={{ color: 'var(--clr-text)' }}>{selectedSize}</strong>
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              {(product.sizes ?? []).map((size) => {
                const sizeStock = getVariantStock(product, selectedColor, size);
                const isSizeOutOfStock = sizeStock <= 0;
                const isSelected = selectedSize === size;

                return (
                  <button
                    key={size}
                    type="button"
                    disabled={isSizeOutOfStock}
                    onClick={() => {
                      if (!isSizeOutOfStock) setSelectedSize(size);
                    }}
                    title={
                      isSizeOutOfStock
                        ? `${size} (${t('product.outOfStock')})`
                        : `${size} (${t('product.stock', { count: sizeStock })})`
                    }
                    aria-label={
                      isSizeOutOfStock
                        ? `${size} (${t('product.outOfStock')})`
                        : `${size} (${t('product.stock', { count: sizeStock })})`
                    }
                    style={{
                      width: '44px',
                      height: '44px',
                      border: `1px solid ${isSelected ? 'var(--clr-gold)' : 'var(--clr-border)'}`,
                      borderRadius: 'var(--radius-sm)',
                      background: isSelected ? 'var(--clr-gold)' : 'transparent',
                      color: isSelected
                        ? '#000'
                        : isSizeOutOfStock
                          ? 'var(--clr-text-3)'
                          : 'var(--clr-text-2)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: isSizeOutOfStock ? 'not-allowed' : 'pointer',
                      opacity: isSizeOutOfStock ? 0.35 : 1,
                      textDecoration: isSizeOutOfStock ? 'line-through' : 'none',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity */}
          <div>
            <p
              style={{
                fontSize: '0.8rem',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--clr-text-2)',
                marginBottom: 'var(--space-3)',
              }}
            >
              {t('product.quantity')}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <button
                type="button"
                className="btn btn-icon btn-ghost"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={isCombinationOutOfStock || isAllOutOfStock || quantity <= 1}
                aria-label={t('cart.decreaseQty')}
              >
                <Minus size={16} />
              </button>
              <span
                style={{
                  minWidth: '32px',
                  textAlign: 'center',
                  fontWeight: 600,
                  fontSize: '1.1rem',
                }}
              >
                {isCombinationOutOfStock || isAllOutOfStock ? 0 : quantity}
              </span>
              <button
                type="button"
                className="btn btn-icon btn-ghost"
                onClick={() => setQuantity((q) => Math.min(Math.max(1, activeStock), q + 1))}
                disabled={isCombinationOutOfStock || isAllOutOfStock || quantity >= activeStock}
                aria-label={t('cart.increaseQty')}
              >
                <Plus size={16} />
              </button>
              {activeStock > 5 ? (
                <span style={{ fontSize: '0.85rem', color: 'var(--clr-text-3)' }}>
                  {t('product.stock', { count: activeStock })}
                </span>
              ) : activeStock > 0 ? (
                <span
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--clr-warning)',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {t('product.stockLeft', { count: activeStock })}
                </span>
              ) : (
                <span style={{ fontSize: '0.85rem', color: 'var(--clr-error)', fontWeight: 600 }}>
                  {t('product.outOfStock')}
                </span>
              )}
            </div>
          </div>

          {/* CTA */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <button
              type="button"
              className={`btn btn-lg btn-block ${added ? '' : 'btn-primary'}`}
              style={
                added
                  ? {
                      background: 'var(--clr-success)',
                      color: '#fff',
                      borderColor: 'var(--clr-success)',
                    }
                  : isCombinationOutOfStock || isAllOutOfStock
                    ? { opacity: 0.6, cursor: 'not-allowed' }
                    : {}
              }
              onClick={handleAddToCart}
              disabled={isCombinationOutOfStock || isAllOutOfStock}
            >
              {added ? (
                <>
                  <Check size={18} /> {t('product.added')}
                </>
              ) : isCombinationOutOfStock || isAllOutOfStock ? (
                <>{t('product.outOfStock')}</>
              ) : (
                <>
                  <ShoppingBag size={18} /> {t('product.addToCart')}
                </>
              )}
            </button>
          </div>

          {/* Tags */}
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            {(product.tags ?? []).map((tag) => (
              <span key={tag} className="badge badge-neutral">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <ProductTabs
        product={product}
        reviews={reviews ?? []}
        averageRating={averageRating}
        onReviewCreated={(r) => setReviews((prev) => [r, ...(prev ?? [])])}
        focusReviewForm={focusReviewForm}
        preferredOrderId={preferredOrderId}
      />

      {/* Related Products */}
      {(related ?? []).length > 0 && (
        <div style={{ marginTop: 'var(--space-20)' }}>
          <h2
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.75rem',
              fontWeight: 400,
              marginBottom: 'var(--space-8)',
              textAlign: 'center',
            }}
          >
            {t('product.youMayAlsoLike')}
          </h2>
          <div className="grid-products">
            {(related ?? []).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

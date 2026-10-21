'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, X, ShoppingBag, ArrowRight, Tag, AlertTriangle } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { getImageUrl, DEFAULT_PLACEHOLDER_IMAGE } from '@/lib/utils';
import { getCartItemImage, getVariantStock } from '@/lib/colors';
import { useT } from '@/i18n/LanguageProvider';
import type { Product } from '@/types';

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, totalPrice } = useCartStore();
  const { t, formatPrice } = useT();
  const [mounted, setMounted] = useState(false);
  const [stockMap, setStockMap] = useState<Record<string, number>>({});
  const [warnings, setWarnings] = useState<string[]>([]);
  const [, setIsCheckingStock] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getItemKey = useCallback((productId: string, color: string, size: string) => {
    return `${productId}::${(color || '').trim().toLowerCase()}::${(size || '').trim().toLowerCase()}`;
  }, []);

  // Sync live stock from backend with cache: 'no-store'
  const syncLiveStock = useCallback(async () => {
    if (items.length === 0) return;
    try {
      setIsCheckingStock(true);
      const uniqueProductIds = Array.from(new Set(items.map((i) => i.productId)));

      const fetchedProducts = await Promise.all(
        uniqueProductIds.map(async (pId) => {
          try {
            const res = await fetch(`/api/products/${pId}`, { cache: 'no-store' });
            const data = await res.json();
            if (data.success && data.data) {
              return data.data as Product;
            }
          } catch {
            // ignore network errors
          }
          return null;
        })
      );

      const prodMap = new Map<string, Product>();
      fetchedProducts.forEach((p) => {
        if (p) prodMap.set(p.id, p);
      });

      const newStockMap: Record<string, number> = {};
      const newWarnings: string[] = [];

      items.forEach((item) => {
        const liveProduct = prodMap.get(item.productId) || item.product;
        const freshStock = getVariantStock(liveProduct, item.color, item.size);
        const key = getItemKey(item.productId, item.color, item.size);
        newStockMap[key] = freshStock;

        // If stock changed and is lower than current quantity in cart
        if (item.quantity > freshStock) {
          const adjustedQty = Math.max(0, freshStock);
          updateQuantity(item.productId, item.size, item.color, adjustedQty);

          if (freshStock <= 0) {
            newWarnings.push(
              t('cart.stockAlertEmpty', {
                name: item.product.name,
                color: item.color,
                size: item.size,
              })
            );
          } else {
            newWarnings.push(
              t('cart.stockAlertAdjusted', {
                name: item.product.name,
                color: item.color,
                size: item.size,
                count: adjustedQty,
              })
            );
          }
        }
      });

      setStockMap((prev) => ({ ...prev, ...newStockMap }));
      if (newWarnings.length > 0) {
        setWarnings((prev) => Array.from(new Set([...prev, ...newWarnings])));
      }
    } catch (err) {
      console.error('Failed to sync live stock in cart:', err);
    } finally {
      setIsCheckingStock(false);
    }
  }, [items, getItemKey, updateQuantity, t]);

  // Check if arriving with stockError query param from checkout rejection
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const stockErr = params.get('stockError');
      if (stockErr) {
        setWarnings((prev) => Array.from(new Set([...prev, decodeURIComponent(stockErr)])));
      }
    }
  }, []);

  // Run stock check once on mount
  const hasInitialSynced = useRef(false);
  useEffect(() => {
    if (mounted && !hasInitialSynced.current && items.length > 0) {
      hasInitialSynced.current = true;
      syncLiveStock();
    }
  }, [mounted, items.length, syncLiveStock]);

  if (!mounted) return null;

  const subtotal = totalPrice();
  const shipping = subtotal >= 5000000 ? 0 : 50000;
  const tax = Math.round(subtotal * 0.1);
  const total = subtotal + shipping + tax;

  const hasOutOfStockItems = items.some((item) => {
    const key = getItemKey(item.productId, item.color, item.size);
    const stock =
      stockMap[key] !== undefined
        ? stockMap[key]
        : getVariantStock(item.product, item.color, item.size);
    return stock <= 0 || item.quantity <= 0;
  });

  return (
    <div className="container" style={{ padding: 'var(--space-10) var(--space-6)' }}>
      <h1
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
          fontWeight: 400,
          marginBottom: 'var(--space-8)',
        }}
      >
        {t('cart.pageTitle')}
      </h1>

      {/* Stock warning notification banner */}
      {warnings.length > 0 && (
        <div
          style={{
            background: 'rgba(234, 179, 8, 0.08)',
            border: '1px solid rgba(234, 179, 8, 0.35)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-4) var(--space-5)',
            marginBottom: 'var(--space-6)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-2)',
            animation: 'fadeIn 0.3s both',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                color: 'var(--clr-warning)',
                fontWeight: 600,
                fontSize: '0.95rem',
              }}
            >
              <AlertTriangle size={18} />
              <span>{t('cart.pageTitle')}</span>
            </div>
            <button
              onClick={() => setWarnings([])}
              className="btn btn-ghost btn-sm"
              style={{
                padding: '2px 8px',
                fontSize: '0.75rem',
                height: 'auto',
                color: 'var(--clr-text-2)',
              }}
            >
              {t('common.close')}
            </button>
          </div>
          <ul
            style={{
              margin: 0,
              paddingLeft: 'var(--space-5)',
              fontSize: '0.85rem',
              color: 'var(--clr-text-2)',
              lineHeight: 1.5,
            }}
          >
            {warnings.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {items.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: 'var(--space-20) 0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--space-6)',
          }}
        >
          <ShoppingBag size={64} strokeWidth={1} style={{ color: 'var(--clr-text-3)' }} />
          <div>
            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontWeight: 400,
                marginBottom: 'var(--space-3)',
                fontSize: '1.5rem',
              }}
            >
              {t('cart.empty')}
            </h2>
            <p style={{ color: 'var(--clr-text-2)' }}>
              {t('account.noOrdersDesc')}
            </p>
          </div>
          <Link href="/products" className="btn btn-primary btn-lg">
            {t('cart.startShopping')} <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 380px',
            gap: 'var(--space-8)',
            alignItems: 'start',
          }}
        >
          {/* Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--space-2)',
              }}
            >
              <span style={{ color: 'var(--clr-text-2)', fontSize: '0.875rem' }}>
                {t('checkout.itemsCount', { count: items.length })}
              </span>
              <button className="btn btn-danger btn-sm" onClick={clearCart}>
                {t('cart.clearCart')}
              </button>
            </div>

            {items.map((item) => {
              const itemKey = getItemKey(item.productId, item.color, item.size);
              const itemStock =
                stockMap[itemKey] !== undefined
                  ? stockMap[itemKey]
                  : getVariantStock(item.product, item.color, item.size);
              const isOutOfStock = itemStock <= 0 || item.quantity <= 0;
              const isLowStock = itemStock > 0 && itemStock <= 5;

              return (
                <div
                  key={`${item.productId}-${item.size}-${item.color}`}
                  className="card"
                  style={{
                    display: 'flex',
                    gap: 'var(--space-5)',
                    padding: 'var(--space-5)',
                    animation: 'fadeIn 0.3s both',
                    borderColor: isOutOfStock ? 'rgba(239, 68, 68, 0.4)' : undefined,
                    background: isOutOfStock ? 'rgba(239, 68, 68, 0.02)' : undefined,
                  }}
                >
                  {/* Image */}
                  <Link href={`/products/${item.productId}`} style={{ flexShrink: 0 }}>
                    <div
                      style={{
                        position: 'relative',
                        width: '100px',
                        height: '130px',
                        borderRadius: 'var(--radius-md)',
                        overflow: 'hidden',
                        background: 'var(--clr-bg-3)',
                        opacity: isOutOfStock ? 0.6 : 1,
                      }}
                    >
                      <Image
                        src={getImageUrl(getCartItemImage(item))}
                        alt={item.product.name}
                        fill
                        style={{ objectFit: 'cover' }}
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          if (!target.src.includes('product_dress_1_1790064527682.jpg')) {
                            target.srcset = '';
                            target.src = DEFAULT_PLACEHOLDER_IMAGE;
                          }
                        }}
                      />
                    </div>
                  </Link>

                  {/* Info */}
                  <div
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 'var(--space-2)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'start',
                      }}
                    >
                      <div>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            color: 'var(--clr-gold)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.12em',
                          }}
                        >
                          {item.product.category}
                        </span>
                        <h3
                          style={{
                            fontFamily: 'var(--font-serif)',
                            fontWeight: 400,
                            fontSize: '1.05rem',
                            marginTop: '2px',
                          }}
                        >
                          <Link href={`/products/${item.productId}`}>{item.product.name}</Link>
                        </h3>
                      </div>
                      <button
                        onClick={() => removeItem(item.productId, item.size, item.color)}
                        style={{
                          color: 'var(--clr-text-3)',
                          transition: 'color var(--transition-fast)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px',
                        }}
                        onMouseEnter={(e) =>
                          ((e.currentTarget as HTMLElement).style.color = 'var(--clr-error)')
                        }
                        onMouseLeave={(e) =>
                          ((e.currentTarget as HTMLElement).style.color = 'var(--clr-text-3)')
                        }
                        aria-label={t('cart.removeItem')}
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                      <span className="badge badge-neutral">{item.size}</span>
                      <span className="badge badge-neutral">{item.color}</span>

                      {/* Stock Badge */}
                      {isOutOfStock ? (
                        <span
                          className="badge"
                          style={{
                            background: 'rgba(239, 68, 68, 0.15)',
                            color: 'var(--clr-error)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            fontWeight: 600,
                          }}
                        >
                          {t('product.outOfStock')}
                        </span>
                      ) : isLowStock ? (
                        <span
                          className="badge"
                          style={{
                            background: 'rgba(234, 179, 8, 0.15)',
                            color: 'var(--clr-warning)',
                            border: '1px solid rgba(234, 179, 8, 0.3)',
                            fontWeight: 600,
                          }}
                        >
                          {t('product.stockLeft', { count: itemStock })}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--clr-text-3)' }}>
                          {t('product.stock', { count: itemStock })}
                        </span>
                      )}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: 'auto',
                      }}
                    >
                      {/* Stepper bounded by itemStock */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--space-2)',
                          background: 'var(--clr-bg-3)',
                          border: '1px solid var(--clr-border)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '4px 8px',
                          opacity: isOutOfStock ? 0.5 : 1,
                        }}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(
                              item.productId,
                              item.size,
                              item.color,
                              Math.max(1, item.quantity - 1)
                            )
                          }
                          disabled={isOutOfStock || item.quantity <= 1}
                          style={{
                            color: 'var(--clr-text-2)',
                            cursor: isOutOfStock || item.quantity <= 1 ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            padding: '2px',
                            background: 'none',
                            border: 'none',
                            opacity: isOutOfStock || item.quantity <= 1 ? 0.4 : 1,
                          }}
                          aria-label={t('cart.decreaseQty')}
                        >
                          <Minus size={14} />
                        </button>

                        <span style={{ minWidth: '24px', textAlign: 'center', fontWeight: 600 }}>
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(
                              item.productId,
                              item.size,
                              item.color,
                              Math.min(itemStock, item.quantity + 1)
                            )
                          }
                          disabled={isOutOfStock || item.quantity >= itemStock}
                          style={{
                            color: 'var(--clr-text-2)',
                            cursor:
                              isOutOfStock || item.quantity >= itemStock ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            padding: '2px',
                            background: 'none',
                            border: 'none',
                            opacity: isOutOfStock || item.quantity >= itemStock ? 0.4 : 1,
                          }}
                          aria-label={t('cart.increaseQty')}
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: '1.05rem',
                          color: isOutOfStock ? 'var(--clr-text-3)' : 'var(--clr-text)',
                        }}
                      >
                        {formatPrice(item.product.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div
            className="card"
            style={{
              padding: 'var(--space-6)',
              position: 'sticky',
              top: 'calc(var(--nav-height) + 16px)',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontWeight: 400,
                fontSize: '1.25rem',
                marginBottom: 'var(--space-6)',
              }}
            >
              {t('cart.orderSummary')}
            </h2>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-3)',
                marginBottom: 'var(--space-5)',
              }}
            >
              {[
                { label: t('cart.subtotal'), value: formatPrice(subtotal) },
                {
                  label: t('account.shipping'),
                  value: shipping === 0 ? t('common.free') : formatPrice(shipping),
                },
                { label: t('cart.estimatedTax'), value: formatPrice(tax) },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.9rem',
                  }}
                >
                  <span style={{ color: 'var(--clr-text-2)' }}>{label}</span>
                  <span
                    style={{
                      color:
                        label === t('account.shipping') && shipping === 0
                          ? 'var(--clr-success)'
                          : 'var(--clr-text)',
                    }}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>

            {shipping === 0 && (
              <div
                style={{
                  background: 'rgba(34,197,94,0.08)',
                  border: '1px solid rgba(34,197,94,0.2)',
                  borderRadius: 'var(--radius-sm)',
                  padding: 'var(--space-3)',
                  marginBottom: 'var(--space-5)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                }}
              >
                <Tag size={14} style={{ color: 'var(--clr-success)', flexShrink: 0 }} />
                <span style={{ fontSize: '0.8rem', color: 'var(--clr-success)' }}>
                  {t('cart.freeShippingQualified')}
                </span>
              </div>
            )}

            <hr className="divider" />

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--space-6)',
              }}
            >
              <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>{t('cart.total')}</span>
              <span
                style={{
                  fontWeight: 700,
                  fontSize: '1.35rem',
                  color: 'var(--clr-gold)',
                }}
              >
                {formatPrice(total)}
              </span>
            </div>

            {hasOutOfStockItems ? (
              <div>
                <button
                  type="button"
                  className="btn btn-primary btn-block btn-lg"
                  disabled
                  style={{
                    opacity: 0.5,
                    cursor: 'not-allowed',
                  }}
                >
                  {t('cart.checkout')} <ArrowRight size={16} />
                </button>
                <p
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--clr-error)',
                    textAlign: 'center',
                    marginTop: 'var(--space-2)',
                    lineHeight: 1.4,
                  }}
                >
                  {t('cart.removeOutOfStock')}
                </p>
              </div>
            ) : (
              <Link href="/checkout" className="btn btn-primary btn-block btn-lg">
                {t('cart.checkout')} <ArrowRight size={16} />
              </Link>
            )}

            <Link
              href="/products"
              className="btn btn-ghost btn-block"
              style={{ marginTop: 'var(--space-3)' }}
            >
              {t('cart.startShopping')}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

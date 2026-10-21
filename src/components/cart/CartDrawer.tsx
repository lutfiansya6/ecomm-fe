'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { X, ShoppingBag, Minus, Plus, ArrowRight, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCartStore } from '@/store/cart';
import { getImageUrl, DEFAULT_PLACEHOLDER_IMAGE } from '@/lib/utils';
import { getCartItemImage, getVariantStock } from '@/lib/colors';
import { useT } from '@/i18n/LanguageProvider';
import type { Product } from '@/types';

export default function CartDrawer() {
  const { items, isOpen, closeCart, updateQuantity, removeItem, totalPrice } = useCartStore();
  const { t, formatPrice } = useT();
  const [mounted, setMounted] = useState(false);
  const [stockMap, setStockMap] = useState<Record<string, number>>({});
  const [warnings, setWarnings] = useState<string[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getItemKey = useCallback((productId: string, color: string, size: string) => {
    return `${productId}::${(color || '').trim().toLowerCase()}::${(size || '').trim().toLowerCase()}`;
  }, []);

  // Fetch live stocks with cache: 'no-store'
  const syncLiveStock = useCallback(async () => {
    if (items.length === 0) return;
    try {
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
            // ignore network error
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
      console.error('Failed to sync live stock in drawer:', err);
    }
  }, [items, getItemKey, updateQuantity, t]);

  // Sync whenever drawer opens
  const prevOpenRef = useRef(false);
  useEffect(() => {
    if (isOpen && !prevOpenRef.current && mounted) {
      syncLiveStock();
    }
    prevOpenRef.current = isOpen;
  }, [isOpen, mounted, syncLiveStock]);

  const total = totalPrice();

  if (!isOpen || !mounted) return null;

  const hasOutOfStockItems = items.some((item) => {
    const key = getItemKey(item.productId, item.color, item.size);
    const stock =
      stockMap[key] !== undefined
        ? stockMap[key]
        : getVariantStock(item.product, item.color, item.size);
    return stock <= 0 || item.quantity <= 0;
  });

  return (
    <>
      {/* Overlay */}
      <div className="overlay" onClick={closeCart} />

      {/* Drawer */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 'min(420px, 100vw)',
          background: 'var(--clr-bg-2)',
          borderLeft: '1px solid var(--clr-border)',
          zIndex: 200,
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInRight 0.3s var(--ease-smooth) both',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'var(--space-6)',
            borderBottom: '1px solid var(--clr-border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <ShoppingBag size={20} style={{ color: 'var(--clr-gold)' }} />
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 400 }}>
              {t('cart.title', { count: items.length })}
            </h2>
          </div>
          <button
            className="btn btn-icon btn-ghost"
            onClick={closeCart}
            aria-label={t('common.close')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Warning banner inside drawer if any */}
        {warnings.length > 0 && (
          <div
            style={{
              background: 'rgba(234, 179, 8, 0.1)',
              borderBottom: '1px solid rgba(234, 179, 8, 0.3)',
              padding: 'var(--space-3) var(--space-4)',
              fontSize: '0.8rem',
              color: 'var(--clr-warning)',
              display: 'flex',
              alignItems: 'start',
              gap: 'var(--space-2)',
            }}
          >
            <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ flex: 1 }}>
              {warnings.map((w, i) => (
                <div key={i}>{w}</div>
              ))}
            </div>
            <button
              onClick={() => setWarnings([])}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--clr-text-2)',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-4)' }}>
          {items.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                gap: 'var(--space-4)',
                color: 'var(--clr-text-2)',
              }}
            >
              <ShoppingBag size={48} strokeWidth={1} />
              <p style={{ fontSize: '0.9rem' }}>{t('cart.empty')}</p>
              <Link href="/products" className="btn btn-outline btn-sm" onClick={closeCart}>
                {t('cart.startShopping')}
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {items.map((item, idx) => {
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
                    style={{
                      display: 'flex',
                      gap: 'var(--space-4)',
                      padding: 'var(--space-4)',
                      background: isOutOfStock ? 'rgba(239, 68, 68, 0.03)' : 'var(--clr-bg-3)',
                      borderRadius: 'var(--radius-md)',
                      border: isOutOfStock
                        ? '1px solid rgba(239, 68, 68, 0.35)'
                        : '1px solid var(--clr-border)',
                      animation: `fadeIn 0.3s ${idx * 0.05}s both`,
                    }}
                  >
                    {/* Image */}
                    <div
                      style={{
                        position: 'relative',
                        width: '80px',
                        height: '100px',
                        borderRadius: 'var(--radius-sm)',
                        overflow: 'hidden',
                        flexShrink: 0,
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

                    {/* Details */}
                    <div
                      style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--space-1)',
                      }}
                    >
                      <h4
                        style={{
                          fontFamily: 'var(--font-serif)',
                          fontSize: '0.95rem',
                          fontWeight: 400,
                        }}
                      >
                        {item.product.name}
                      </h4>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--space-2)',
                          flexWrap: 'wrap',
                        }}
                      >
                        <p style={{ fontSize: '0.75rem', color: 'var(--clr-text-2)' }}>
                          {item.size} · {item.color}
                        </p>
                        {isOutOfStock ? (
                          <span
                            style={{
                              fontSize: '0.7rem',
                              color: 'var(--clr-error)',
                              fontWeight: 600,
                              background: 'rgba(239, 68, 68, 0.1)',
                              padding: '1px 6px',
                              borderRadius: 'var(--radius-sm)',
                            }}
                          >
                            {t('product.outOfStock')}
                          </span>
                        ) : isLowStock ? (
                          <span
                            style={{
                              fontSize: '0.7rem',
                              color: 'var(--clr-warning)',
                              fontWeight: 600,
                              background: 'rgba(234, 179, 8, 0.1)',
                              padding: '1px 6px',
                              borderRadius: 'var(--radius-sm)',
                            }}
                          >
                            {t('product.stockLeft', { count: itemStock })}
                          </span>
                        ) : null}
                      </div>

                      <p
                        style={{
                          fontWeight: 600,
                          color: isOutOfStock ? 'var(--clr-text-3)' : 'var(--clr-gold)',
                          fontSize: '0.9rem',
                          marginTop: '4px',
                        }}
                      >
                        {formatPrice(item.product.price * item.quantity)}
                      </p>

                      {/* Qty controls */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--space-2)',
                          marginTop: 'auto',
                        }}
                      >
                        <button
                          className="btn btn-icon btn-ghost"
                          style={{
                            width: '28px',
                            height: '28px',
                            padding: 0,
                            opacity: isOutOfStock || item.quantity <= 1 ? 0.4 : 1,
                            cursor:
                              isOutOfStock || item.quantity <= 1 ? 'not-allowed' : 'pointer',
                          }}
                          disabled={isOutOfStock || item.quantity <= 1}
                          onClick={() =>
                            updateQuantity(
                              item.productId,
                              item.size,
                              item.color,
                              Math.max(1, item.quantity - 1)
                            )
                          }
                          aria-label={t('cart.decreaseQty')}
                        >
                          <Minus size={12} />
                        </button>

                        <span
                          style={{
                            minWidth: '24px',
                            textAlign: 'center',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                          }}
                        >
                          {item.quantity}
                        </span>

                        <button
                          className="btn btn-icon btn-ghost"
                          style={{
                            width: '28px',
                            height: '28px',
                            padding: 0,
                            opacity: isOutOfStock || item.quantity >= itemStock ? 0.4 : 1,
                            cursor:
                              isOutOfStock || item.quantity >= itemStock ? 'not-allowed' : 'pointer',
                          }}
                          disabled={isOutOfStock || item.quantity >= itemStock}
                          onClick={() =>
                            updateQuantity(
                              item.productId,
                              item.size,
                              item.color,
                              Math.min(itemStock, item.quantity + 1)
                            )
                          }
                          aria-label={t('cart.increaseQty')}
                        >
                          <Plus size={12} />
                        </button>

                        <button
                          style={{
                            marginLeft: 'auto',
                            color: 'var(--clr-error)',
                            fontSize: '0.75rem',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px',
                          }}
                          onClick={() => removeItem(item.productId, item.size, item.color)}
                          aria-label={t('cart.removeItem')}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div
            style={{
              borderTop: '1px solid var(--clr-border)',
              padding: 'var(--space-6)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-4)',
            }}
          >
            {/* Subtotal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--clr-text-2)', fontSize: '0.875rem' }}>
                {t('cart.subtotal')}
              </span>
              <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{formatPrice(total)}</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--clr-text-3)' }}>
              {t('cart.shippingNote')}
            </p>

            {hasOutOfStockItems ? (
              <div>
                <button
                  type="button"
                  className="btn btn-primary btn-block btn-lg"
                  disabled
                  style={{ opacity: 0.5, cursor: 'not-allowed' }}
                >
                  {t('cart.checkout')} <ArrowRight size={16} />
                </button>
                <p
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--clr-error)',
                    textAlign: 'center',
                    marginTop: 'var(--space-2)',
                  }}
                >
                  {t('cart.removeOutOfStock')}
                </p>
              </div>
            ) : (
              <Link
                href="/checkout"
                className="btn btn-primary btn-block btn-lg"
                onClick={closeCart}
              >
                {t('cart.checkout')} <ArrowRight size={16} />
              </Link>
            )}

            <Link href="/cart" className="btn btn-ghost btn-block" onClick={closeCart}>
              {t('cart.viewCart')}
            </Link>
          </div>
        )}
      </div>
    </>
  );
}

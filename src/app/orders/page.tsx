'use client';
import { useEffect, useState, useMemo } from 'react';
import { useAuthStore } from '@/store/auth';
import { useToast } from '@/components/ui/ToastProvider';
import Image from 'next/image';
import { Package, ChevronRight, Clock, Star } from 'lucide-react';
import { getImageUrl, DEFAULT_PLACEHOLDER_IMAGE } from '@/lib/utils';
import { getCartItemImage } from '@/lib/colors';
import { useT } from '@/i18n/LanguageProvider';
import type { Order } from '@/types';
import Link from 'next/link';

export default function OrdersPage() {
  const { token } = useAuthStore();
  const { showToast } = useToast();
  const { t, formatDate, formatPrice } = useT();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const statusMap: Record<string, { label: string; cls: string }> = useMemo(
    () => ({
      pending: { label: t('account.status.pending'), cls: 'badge-warning' },
      confirmed: { label: t('account.status.confirmed'), cls: 'badge-gold' },
      shipped: { label: t('account.status.shipped'), cls: 'badge-gold' },
      delivered: { label: t('account.status.delivered'), cls: 'badge-success' },
      cancelled: { label: t('account.status.cancelled'), cls: 'badge-error' },
    }),
    [t]
  );

  const paymentMap: Record<string, { label: string; cls: string }> = useMemo(
    () => ({
      pending: { label: t('account.payment.pending'), cls: 'badge-warning' },
      paid: { label: t('account.payment.paid'), cls: 'badge-success' },
      failed: { label: t('account.payment.failed'), cls: 'badge-error' },
    }),
    [t]
  );

  const paymentMethodLabel: Record<string, string> = useMemo(
    () => ({
      credit_card: t('account.paymentMethod.credit_card'),
      gopay: t('account.paymentMethod.gopay'),
      cod: t('account.paymentMethod.cod'),
    }),
    [t]
  );

  useEffect(() => {
    if (!mounted) return;
    const fetchOrders = async () => {
      try {
        const res = await fetch('/api/orders', { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (data.success) setOrders(data.data?.orders ?? []);
      } catch {
        showToast(t('errors.ordersLoadFailed'), 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [token, mounted, t, showToast]);

  return (
    <div
      className="container"
      style={{
        padding: 'calc(72px + var(--space-8)) var(--space-6) var(--space-12)',
        maxWidth: '900px',
      }}
    >
      <h1
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
          fontWeight: 400,
          marginBottom: 'var(--space-8)',
        }}
      >
        {t('account.myOrders')}
      </h1>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="skeleton"
              style={{ height: '120px', borderRadius: 'var(--radius-lg)' }}
            />
          ))}
        </div>
      ) : orders.length === 0 ? (
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
          <Package size={64} strokeWidth={1} style={{ color: 'var(--clr-text-3)' }} />
          <div>
            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontWeight: 400,
                fontSize: '1.5rem',
                marginBottom: 'var(--space-3)',
              }}
            >
              {t('account.noOrders')}
            </h2>
            <p style={{ color: 'var(--clr-text-2)' }}>{t('account.noOrdersDesc')}</p>
          </div>
          <Link href="/products" className="btn btn-primary">
            {t('account.startShopping')}
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {[...(orders ?? [])]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map((order, i) => (
              <div
                key={order.id}
                className="card"
                style={{ padding: 'var(--space-6)', animation: `fadeIn 0.3s ${i * 0.05}s both` }}
              >
                {/* Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    marginBottom: 'var(--space-4)',
                    flexWrap: 'wrap',
                    gap: 'var(--space-3)',
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-3)',
                        marginBottom: 'var(--space-2)',
                      }}
                    >
                      <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{order.id}</span>
                      <span
                        className={`badge ${statusMap[order.orderStatus]?.cls || 'badge-neutral'}`}
                      >
                        {statusMap[order.orderStatus]?.label || order.orderStatus}
                      </span>
                      <span
                        className={`badge ${paymentMap[order.paymentStatus]?.cls || 'badge-neutral'}`}
                      >
                        {paymentMap[order.paymentStatus]?.label || order.paymentStatus}
                      </span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-2)',
                        color: 'var(--clr-text-3)',
                        fontSize: '0.8rem',
                      }}
                    >
                      <Clock size={12} />
                      {formatDate(order.createdAt, {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                  <span
                    style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--clr-gold)' }}
                  >
                    {formatPrice(order.total)}
                  </span>
                </div>

                {/* Items */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-2)',
                    marginBottom: 'var(--space-4)',
                  }}
                >
                  {(order.items ?? []).map((item) => (
                    <div
                      key={`${item.productId}-${item.size}-${item.color}`}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.875rem',
                        padding: 'var(--space-2) var(--space-3)',
                        background: 'var(--clr-bg-3)',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                        <div
                          style={{
                            position: 'relative',
                            width: '36px',
                            height: '46px',
                            borderRadius: 'var(--radius-sm)',
                            overflow: 'hidden',
                            flexShrink: 0,
                            background: 'var(--clr-bg-2)',
                          }}
                        >
                          <Image
                            src={getImageUrl(getCartItemImage(item))}
                            alt={item.product?.name || item.productId}
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
                        <div>
                          <strong>{item.product?.name || item.productId}</strong>
                          <span
                            style={{
                              color: 'var(--clr-text-2)',
                              marginLeft: 'var(--space-2)',
                              fontSize: '0.8rem',
                            }}
                          >
                            × {item.quantity} ({item.size}
                            {item.color ? ` · ${item.color}` : ''})
                          </span>
                        </div>
                      </div>
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--space-3)',
                        }}
                      >
                        <span style={{ fontWeight: 600 }}>
                          {formatPrice((item.product?.price || 0) * item.quantity)}
                        </span>
                        {order.orderStatus === 'delivered' && (
                          <Link
                            href={`/products/${item.productId}?review=1&order=${order.id}`}
                            className="btn btn-ghost btn-sm"
                            style={{
                              padding: '0.25rem 0.75rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Star size={12} /> {t('account.writeReviewForProduct')}
                          </Link>
                        )}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: '0.8rem', color: 'var(--clr-text-2)' }}>
                    {paymentMethodLabel[order.paymentMethod] || order.paymentMethod}
                    {' · '}
                    {order.address.city}
                  </span>
                  <Link
                    href={`/orders/${order.id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.8rem',
                      color: 'var(--clr-gold)',
                      fontWeight: 600,
                    }}
                  >
                    {t('account.viewDetails')} <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

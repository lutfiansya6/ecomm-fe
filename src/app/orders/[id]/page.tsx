'use client';
import { useEffect, useState, use, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { useToast } from '@/components/ui/ToastProvider';
import { getImageUrl, DEFAULT_PLACEHOLDER_IMAGE } from '@/lib/utils';
import { getCartItemImage } from '@/lib/colors';
import { useT } from '@/i18n/LanguageProvider';
import type { Order } from '@/types';
import {
  ArrowLeft,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  CreditCard,
  MapPin,
  Copy,
  Check,
  ShoppingBag,
  HelpCircle,
  AlertCircle,
  FileText,
} from 'lucide-react';

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { token } = useAuthStore();
  const { showToast } = useToast();
  const { t, formatDate, formatPrice } = useT();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const statusMap: Record<string, { label: string; cls: string; desc: string }> = useMemo(
    () => ({
      pending: {
        label: t('account.status.pending'),
        cls: 'badge-warning',
        desc: t('account.orderStatusDesc.pending'),
      },
      confirmed: {
        label: t('account.status.confirmed'),
        cls: 'badge-gold',
        desc: t('account.orderStatusDesc.confirmed'),
      },
      shipped: {
        label: t('account.status.shipped'),
        cls: 'badge-gold',
        desc: t('account.orderStatusDesc.shipped'),
      },
      delivered: {
        label: t('account.status.delivered'),
        cls: 'badge-success',
        desc: t('account.orderStatusDesc.delivered'),
      },
      cancelled: {
        label: t('account.status.cancelled'),
        cls: 'badge-error',
        desc: t('account.orderStatusDesc.cancelled'),
      },
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

  const timelineSteps = useMemo(
    () => [
      { key: 'pending', label: t('account.timeline.pending'), icon: Clock },
      { key: 'confirmed', label: t('account.timeline.confirmed'), icon: FileText },
      { key: 'shipped', label: t('account.timeline.shipped'), icon: Truck },
      { key: 'delivered', label: t('account.timeline.delivered'), icon: CheckCircle2 },
    ],
    [t]
  );

  useEffect(() => {
    const fetchOrder = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/orders/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success && data.data) {
          setOrder(data.data);
        } else {
          showToast(data.error || t('errors.notFound'), 'error');
        }
      } catch {
        showToast(t('errors.ordersLoadFailed'), 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id, token, showToast, t]);

  const copyOrderId = () => {
    if (!order) return;
    navigator.clipboard.writeText(order.id);
    setCopied(true);
    showToast(t('common.copied'), 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const getStepStatus = (stepKey: string, currentStatus: string) => {
    if (currentStatus === 'cancelled') return 'cancelled';
    const orderRanks: Record<string, number> = {
      pending: 0,
      confirmed: 1,
      shipped: 2,
      delivered: 3,
    };
    const stepRank = orderRanks[stepKey] ?? 0;
    const currentRank = orderRanks[currentStatus] ?? 0;

    if (currentRank > stepRank) return 'completed';
    if (currentRank === stepRank) return 'current';
    return 'upcoming';
  };

  if (loading) {
    return (
      <div
        className="container"
        style={{
          padding: 'calc(72px + var(--space-8)) var(--space-6)',
          maxWidth: '1000px',
        }}
      >
        <div
          className="skeleton"
          style={{
            height: '36px',
            width: '220px',
            marginBottom: 'var(--space-6)',
            borderRadius: 'var(--radius-md)',
          }}
        />
        <div
          className="skeleton"
          style={{ height: '140px', marginBottom: 'var(--space-6)', borderRadius: 'var(--radius-lg)' }}
        />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 'var(--space-6)',
          }}
        >
          <div className="skeleton" style={{ height: '320px', borderRadius: 'var(--radius-lg)' }} />
          <div className="skeleton" style={{ height: '320px', borderRadius: 'var(--radius-lg)' }} />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div
        className="container"
        style={{
          padding: 'calc(72px + var(--space-12)) var(--space-6)',
          maxWidth: '600px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--clr-bg-3)',
            border: '1px solid var(--clr-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto var(--space-4)',
            color: 'var(--clr-gold)',
          }}
        >
          <AlertCircle size={32} />
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '2rem',
            marginBottom: 'var(--space-3)',
            fontWeight: 400,
          }}
        >
          {t('errors.notFound')}
        </h1>
        <p style={{ color: 'var(--clr-text-2)', marginBottom: 'var(--space-6)' }}>
          {t('account.orderNumber')}: {id}
        </p>
        <button
          type="button"
          onClick={() => router.push('/orders')}
          className="btn btn-primary"
        >
          <ArrowLeft size={16} /> {t('account.backToOrders')}
        </button>
      </div>
    );
  }

  const statusInfo = statusMap[order.orderStatus] || statusMap.pending;
  const paymentInfo = paymentMap[order.paymentStatus] || paymentMap.pending;

  return (
    <div
      className="container"
      style={{
        padding: 'calc(72px + var(--space-8)) var(--space-6) var(--space-12)',
        maxWidth: '1000px',
      }}
    >
      {/* Navigation & Breadcrumb */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <button
          type="button"
          onClick={() => router.push('/orders')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.875rem',
            fontWeight: 500,
            color: 'var(--clr-text-2)',
            background: 'var(--clr-bg-2)',
            border: '1px solid var(--clr-border)',
            borderRadius: 'var(--radius-md)',
            padding: '0.6rem 1.15rem',
            cursor: 'pointer',
            transition: 'all var(--transition-base)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--clr-gold)';
            e.currentTarget.style.borderColor = 'var(--clr-gold)';
            e.currentTarget.style.background = 'var(--clr-bg-3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--clr-text-2)';
            e.currentTarget.style.borderColor = 'var(--clr-border)';
            e.currentTarget.style.background = 'var(--clr-bg-2)';
          }}
        >
          <ArrowLeft size={16} /> {t('account.backToOrders')}
        </button>
      </div>

      {/* Header Info Banner */}
      <div
        style={{
          background: 'var(--clr-bg-2)',
          border: '1px solid var(--clr-border)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-6)',
          marginBottom: 'var(--space-6)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 'var(--space-4)',
            marginBottom: 'var(--space-4)',
          }}
        >
          <div>
            <span
              style={{
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                color: 'var(--clr-gold)',
                display: 'block',
                marginBottom: '4px',
              }}
            >
              {t('account.viewDetails')}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <h1
                style={{
                  fontFamily: 'monospace',
                  fontSize: 'clamp(1.1rem, 3vw, 1.4rem)',
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  color: 'var(--clr-text)',
                }}
              >
                {order.id}
              </h1>
              <button
                onClick={copyOrderId}
                className="btn btn-icon"
                title={t('common.copy')}
                aria-label={t('common.copy')}
                style={{
                  background: 'var(--clr-bg-3)',
                  border: '1px solid var(--clr-border)',
                  color: copied ? 'var(--clr-success)' : 'var(--clr-text-2)',
                  width: '32px',
                  height: '32px',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
            <p
              style={{
                fontSize: '0.85rem',
                color: 'var(--clr-text-2)',
                marginTop: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Clock size={14} />
              {formatDate(order.createdAt, {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <span
              className={`badge ${statusInfo.cls}`}
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.8rem' }}
            >
              {statusInfo.label}
            </span>
            <span
              className={`badge ${paymentInfo.cls}`}
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.8rem' }}
            >
              {paymentInfo.label}
            </span>
          </div>
        </div>

        {/* Status description alert */}
        <p
          style={{
            fontSize: '0.875rem',
            color: 'var(--clr-text-2)',
            background: 'var(--clr-bg-3)',
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: 'var(--radius-md)',
            borderLeft: '3px solid var(--clr-gold)',
          }}
        >
          {statusInfo.desc}
        </p>

        {/* Progress Tracker (only if not cancelled) */}
        {order.orderStatus !== 'cancelled' && (
          <div
            style={{
              marginTop: 'var(--space-6)',
              paddingTop: 'var(--space-6)',
              borderTop: '1px solid var(--clr-border)',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 'var(--space-2)',
                position: 'relative',
              }}
            >
              {timelineSteps.map((step) => {
                const state = getStepStatus(step.key, order.orderStatus);
                const Icon = step.icon;
                const isCompleted = state === 'completed';
                const isCurrent = state === 'current';

                return (
                  <div
                    key={step.key}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: 'var(--radius-full)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: isCompleted || isCurrent ? 'var(--clr-gold)' : 'var(--clr-bg-3)',
                        color: isCompleted || isCurrent ? '#000000' : 'var(--clr-text-3)',
                        border: isCurrent
                          ? '3px solid var(--clr-gold-light)'
                          : '1px solid var(--clr-border)',
                        boxShadow: isCurrent ? 'var(--shadow-gold)' : 'none',
                        marginBottom: '8px',
                        transition: 'all var(--transition-base)',
                        zIndex: 2,
                      }}
                    >
                      <Icon size={18} />
                    </div>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: isCurrent ? 700 : 500,
                        color: isCompleted || isCurrent ? 'var(--clr-text)' : 'var(--clr-text-3)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Two Columns Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 'var(--space-6)',
          alignItems: 'start',
        }}
      >
        {/* Left Column: Order Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div
            style={{
              background: 'var(--clr-bg-2)',
              border: '1px solid var(--clr-border)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-6)',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.25rem',
                fontWeight: 400,
                marginBottom: 'var(--space-4)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Package size={20} style={{ color: 'var(--clr-gold)' }} />
              {t('checkout.itemsCount', {
                count: order.items.reduce((acc, it) => acc + it.quantity, 0),
              })}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {order.items.map((item, idx) => {
                const productImg = getImageUrl(getCartItemImage(item));

                return (
                  <div
                    key={`${item.productId}-${idx}`}
                    style={{
                      display: 'flex',
                      gap: 'var(--space-4)',
                      paddingBottom: idx !== order.items.length - 1 ? 'var(--space-4)' : 0,
                      borderBottom:
                        idx !== order.items.length - 1 ? '1px solid var(--clr-border)' : 'none',
                    }}
                  >
                    {/* Image */}
                    <div
                      style={{
                        width: '72px',
                        height: '90px',
                        borderRadius: 'var(--radius-md)',
                        overflow: 'hidden',
                        position: 'relative',
                        background: 'var(--clr-bg-3)',
                        flexShrink: 0,
                        border: '1px solid var(--clr-border)',
                      }}
                    >
                      <Image
                        src={productImg}
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

                    {/* Details */}
                    <div
                      style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <Link
                          href={`/products/${item.productId}`}
                          style={{
                            fontWeight: 600,
                            fontSize: '0.95rem',
                            color: 'var(--clr-text)',
                            transition: 'color var(--transition-fast)',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--clr-gold)')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--clr-text)')}
                        >
                          {item.product?.name || item.productId}
                        </Link>
                        <div
                          style={{
                            fontSize: '0.8rem',
                            color: 'var(--clr-text-2)',
                            marginTop: '4px',
                          }}
                        >
                          {t('product.size')}:{' '}
                          <span style={{ color: 'var(--clr-text)' }}>{item.size}</span>
                          {item.color && (
                            <>
                              {' · '}
                              {t('product.color')}:{' '}
                              <span style={{ color: 'var(--clr-text)' }}>{item.color}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-end',
                          marginTop: 'var(--space-2)',
                        }}
                      >
                        <span style={{ fontSize: '0.85rem', color: 'var(--clr-text-2)' }}>
                          {item.quantity} × {formatPrice(item.product?.price || 0)}
                        </span>
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: '0.95rem',
                            color: 'var(--clr-gold)',
                          }}
                        >
                          {formatPrice((item.product?.price || 0) * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Shipping Address Card */}
          <div
            style={{
              background: 'var(--clr-bg-2)',
              border: '1px solid var(--clr-border)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-6)',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.25rem',
                fontWeight: 400,
                marginBottom: 'var(--space-4)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <MapPin size={20} style={{ color: 'var(--clr-gold)' }} />
              {t('account.deliveryAddress')}
            </h2>

            <div style={{ fontSize: '0.9rem', lineHeight: '1.7', color: 'var(--clr-text)' }}>
              <p style={{ fontWeight: 700, fontSize: '0.95rem' }}>{order.address.fullName}</p>
              <p style={{ color: 'var(--clr-text-2)' }}>{order.address.phone}</p>
              <p style={{ marginTop: '4px', color: 'var(--clr-text)' }}>{order.address.street}</p>
              <p style={{ color: 'var(--clr-text-2)' }}>
                {order.address.city}, {order.address.province} {order.address.postalCode}
              </p>
              <p style={{ color: 'var(--clr-text-3)', fontSize: '0.8rem', marginTop: '4px' }}>
                {order.address.country || 'Indonesia'}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Payment & Price Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Price Breakdown Card */}
          <div
            style={{
              background: 'var(--clr-bg-2)',
              border: '1px solid var(--clr-border)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-6)',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.25rem',
                fontWeight: 400,
                marginBottom: 'var(--space-4)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <CreditCard size={20} style={{ color: 'var(--clr-gold)' }} />
              {t('account.paymentSummary')}
            </h2>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-3)',
                fontSize: '0.9rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  color: 'var(--clr-text-2)',
                }}
              >
                <span>{t('checkout.paymentMethod')}</span>
                <span style={{ color: 'var(--clr-text)', fontWeight: 500 }}>
                  {paymentMethodLabel[order.paymentMethod] || order.paymentMethod}
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  color: 'var(--clr-text-2)',
                }}
              >
                <span>{t('account.paymentStatus')}</span>
                <span className={`badge ${paymentInfo.cls}`}>{paymentInfo.label}</span>
              </div>

              <div
                style={{
                  height: '1px',
                  background: 'var(--clr-border)',
                  margin: 'var(--space-2) 0',
                }}
              />

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  color: 'var(--clr-text-2)',
                }}
              >
                <span>{t('account.subtotal')}</span>
                <span style={{ color: 'var(--clr-text)' }}>{formatPrice(order.subtotal)}</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  color: 'var(--clr-text-2)',
                }}
              >
                <span>{t('account.shipping')}</span>
                <span
                  style={{
                    color: order.shipping === 0 ? 'var(--clr-success)' : 'var(--clr-text)',
                  }}
                >
                  {order.shipping === 0 ? t('common.free') : formatPrice(order.shipping)}
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  color: 'var(--clr-text-2)',
                }}
              >
                <span>{t('account.tax')}</span>
                <span style={{ color: 'var(--clr-text)' }}>{formatPrice(order.tax)}</span>
              </div>

              <div
                style={{
                  height: '1px',
                  background: 'var(--clr-border)',
                  margin: 'var(--space-2) 0',
                }}
              />

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '4px',
                }}
              >
                <span style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--clr-text)' }}>
                  {t('account.total')}
                </span>
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: '1.25rem',
                    color: 'var(--clr-gold)',
                  }}
                >
                  {formatPrice(order.total)}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div
            style={{
              background: 'var(--clr-bg-2)',
              border: '1px solid var(--clr-border)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-6)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-3)',
            }}
          >
            <Link href="/products" className="btn btn-primary btn-block">
              <ShoppingBag size={18} /> {t('cart.startShopping')}
            </Link>

            <div style={{ textAlign: 'center', marginTop: 'var(--space-2)' }}>
              <span
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--clr-text-3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                }}
              >
                <HelpCircle size={14} /> concierge@luxe.id
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

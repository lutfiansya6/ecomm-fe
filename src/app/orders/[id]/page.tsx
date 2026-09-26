'use client';
import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { useToast } from '@/components/ui/ToastProvider';
import { formatPrice } from '@/lib/utils';
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

const STATUS_MAP: Record<string, { label: string; cls: string; desc: string }> = {
  pending: {
    label: 'Menunggu',
    cls: 'badge-warning',
    desc: 'Pesanan Anda sedang menunggu verifikasi dan proses pembayaran.',
  },
  confirmed: {
    label: 'Dikonfirmasi',
    cls: 'badge-gold',
    desc: 'Pesanan Anda telah dikonfirmasi dan sedang disiapkan oleh tim kurasi LUXE.',
  },
  shipped: {
    label: 'Dalam Pengiriman',
    cls: 'badge-gold',
    desc: 'Pesanan Anda sedang dalam perjalanan menuju alamat tujuan.',
  },
  delivered: {
    label: 'Selesai / Diterima',
    cls: 'badge-success',
    desc: 'Pesanan Anda telah berhasil diterima. Terima kasih telah berbelanja di LUXE.',
  },
  cancelled: {
    label: 'Dibatalkan',
    cls: 'badge-error',
    desc: 'Pesanan ini telah dibatalkan.',
  },
};

const PAYMENT_MAP: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Belum Bayar', cls: 'badge-warning' },
  paid: { label: 'Lunas', cls: 'badge-success' },
  failed: { label: 'Gagal', cls: 'badge-error' },
};

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  credit_card: 'Kartu Kredit / Debit',
  gopay: 'GoPay / QRIS',
  cod: 'Bayar di Tempat (COD)',
};

const TIMELINE_STEPS = [
  { key: 'pending', label: 'Pesanan Dibuat', icon: Clock },
  { key: 'confirmed', label: 'Dikonfirmasi', icon: FileText },
  { key: 'shipped', label: 'Dikirim', icon: Truck },
  { key: 'delivered', label: 'Diterima', icon: CheckCircle2 },
];

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { token, user } = useAuthStore();
  const { showToast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

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
          showToast(data.error || 'Pesanan tidak ditemukan', 'error');
        }
      } catch {
        showToast('Gagal memuat detail pesanan', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id, token, showToast]);

  const copyOrderId = () => {
    if (!order) return;
    navigator.clipboard.writeText(order.id);
    setCopied(true);
    showToast('ID Pesanan disalin ke clipboard', 'success');
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
      <div className="container" style={{ padding: 'calc(72px + var(--space-8)) var(--space-6)', maxWidth: '1000px' }}>
        <div className="skeleton" style={{ height: '36px', width: '220px', marginBottom: 'var(--space-6)', borderRadius: 'var(--radius-md)' }} />
        <div className="skeleton" style={{ height: '140px', marginBottom: 'var(--space-6)', borderRadius: 'var(--radius-lg)' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-6)' }}>
          <div className="skeleton" style={{ height: '320px', borderRadius: 'var(--radius-lg)' }} />
          <div className="skeleton" style={{ height: '320px', borderRadius: 'var(--radius-lg)' }} />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container" style={{ padding: 'calc(72px + var(--space-12)) var(--space-6)', maxWidth: '600px', textAlign: 'center' }}>
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
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', marginBottom: 'var(--space-3)', fontWeight: 400 }}>
          Pesanan Tidak Ditemukan
        </h1>
        <p style={{ color: 'var(--clr-text-2)', marginBottom: 'var(--space-6)' }}>
          Pesanan dengan ID <span style={{ fontFamily: 'monospace', color: 'var(--clr-text)' }}>{id}</span> tidak ditemukan atau Anda tidak memiliki akses untuk melihatnya.
        </p>
        <button
          type="button"
          onClick={() => router.push('/orders')}
          className="btn btn-primary"
        >
          <ArrowLeft size={16} /> Kembali ke Pesanan Saya
        </button>
      </div>
    );
  }

  const statusInfo = STATUS_MAP[order.orderStatus] || STATUS_MAP.pending;
  const paymentInfo = PAYMENT_MAP[order.paymentStatus] || PAYMENT_MAP.pending;

  return (
    <div className="container" style={{ padding: 'calc(72px + var(--space-8)) var(--space-6) var(--space-12)', maxWidth: '1000px' }}>
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
          <ArrowLeft size={16} /> Kembali ke Pesanan Saya
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
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
          <div>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--clr-gold)', display: 'block', marginBottom: '4px' }}>
              Detail Pesanan
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <h1 style={{ fontFamily: 'monospace', fontSize: 'clamp(1.1rem, 3vw, 1.4rem)', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--clr-text)' }}>
                {order.id}
              </h1>
              <button
                onClick={copyOrderId}
                className="btn btn-icon"
                title="Salin ID Pesanan"
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
            <p style={{ fontSize: '0.85rem', color: 'var(--clr-text-2)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={14} />
              Dipesan pada {new Date(order.createdAt).toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })} WIB
            </p>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <span className={`badge ${statusInfo.cls}`} style={{ fontSize: '0.8rem', padding: '0.35rem 0.8rem' }}>
              {statusInfo.label}
            </span>
            <span className={`badge ${paymentInfo.cls}`} style={{ fontSize: '0.8rem', padding: '0.35rem 0.8rem' }}>
              {paymentInfo.label}
            </span>
          </div>
        </div>

        {/* Status description alert */}
        <p style={{ fontSize: '0.875rem', color: 'var(--clr-text-2)', background: 'var(--clr-bg-3)', padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--clr-gold)' }}>
          {statusInfo.desc}
        </p>

        {/* Progress Tracker (only if not cancelled) */}
        {order.orderStatus !== 'cancelled' && (
          <div style={{ marginTop: 'var(--space-6)', paddingTop: 'var(--space-6)', borderTop: '1px solid var(--clr-border)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-2)', position: 'relative' }}>
              {TIMELINE_STEPS.map((step) => {
                const state = getStepStatus(step.key, order.orderStatus);
                const Icon = step.icon;
                const isCompleted = state === 'completed';
                const isCurrent = state === 'current';

                return (
                  <div key={step.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative' }}>
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
                        border: isCurrent ? '3px solid var(--clr-gold-light)' : '1px solid var(--clr-border)',
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-6)', alignItems: 'start' }}>
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
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 400, marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Package size={20} style={{ color: 'var(--clr-gold)' }} />
              Daftar Produk ({order.items.reduce((acc, it) => acc + it.quantity, 0)})
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {order.items.map((item, idx) => {
                const productImg = Array.isArray(item.product?.images)
                  ? item.product.images[0]
                  : (item.product?.images as unknown as string) || '/product_dress_1_1790064527682.jpg';

                return (
                  <div
                    key={`${item.productId}-${idx}`}
                    style={{
                      display: 'flex',
                      gap: 'var(--space-4)',
                      paddingBottom: idx !== order.items.length - 1 ? 'var(--space-4)' : 0,
                      borderBottom: idx !== order.items.length - 1 ? '1px solid var(--clr-border)' : 'none',
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
                      />
                    </div>

                    {/* Details */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
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
                        <div style={{ fontSize: '0.8rem', color: 'var(--clr-text-2)', marginTop: '4px' }}>
                          Ukuran: <span style={{ color: 'var(--clr-text)' }}>{item.size}</span>
                          {item.color && (
                            <>
                              {' · '}Warna: <span style={{ color: 'var(--clr-text)' }}>{item.color}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'var(--space-2)' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--clr-text-2)' }}>
                          {item.quantity} × {formatPrice(item.product?.price || 0)}
                        </span>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--clr-gold)' }}>
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
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 400, marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={20} style={{ color: 'var(--clr-gold)' }} />
              Alamat Pengiriman
            </h2>

            <div style={{ fontSize: '0.9rem', lineHeight: '1.7', color: 'var(--clr-text)' }}>
              <p style={{ fontWeight: 700, fontSize: '0.95rem' }}>{order.address.fullName}</p>
              <p style={{ color: 'var(--clr-text-2)' }}>{order.address.phone}</p>
              <p style={{ marginTop: '4px', color: 'var(--clr-text)' }}>
                {order.address.street}
              </p>
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
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 400, marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CreditCard size={20} style={{ color: 'var(--clr-gold)' }} />
              Rincian Pembayaran
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--clr-text-2)' }}>
                <span>Metode Pembayaran</span>
                <span style={{ color: 'var(--clr-text)', fontWeight: 500 }}>
                  {PAYMENT_METHOD_LABEL[order.paymentMethod] || order.paymentMethod}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--clr-text-2)' }}>
                <span>Status Pembayaran</span>
                <span className={`badge ${paymentInfo.cls}`}>{paymentInfo.label}</span>
              </div>

              <div style={{ height: '1px', background: 'var(--clr-border)', margin: 'var(--space-2) 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--clr-text-2)' }}>
                <span>Subtotal Produk</span>
                <span style={{ color: 'var(--clr-text)' }}>{formatPrice(order.subtotal)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--clr-text-2)' }}>
                <span>Biaya Pengiriman</span>
                <span style={{ color: order.shipping === 0 ? 'var(--clr-success)' : 'var(--clr-text)' }}>
                  {order.shipping === 0 ? 'GRATIS' : formatPrice(order.shipping)}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--clr-text-2)' }}>
                <span>Pajak (PPN 11%)</span>
                <span style={{ color: 'var(--clr-text)' }}>{formatPrice(order.tax)}</span>
              </div>

              <div style={{ height: '1px', background: 'var(--clr-border)', margin: 'var(--space-2) 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px' }}>
                <span style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--clr-text)' }}>Total Pembayaran</span>
                <span style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--clr-gold)' }}>
                  {formatPrice(order.total)}
                </span>
              </div>
            </div>

            {order.notes && (
              <div style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--clr-border)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--clr-text-3)', display: 'block', marginBottom: '4px' }}>
                  Catatan Pesanan:
                </span>
                <p style={{ fontSize: '0.85rem', color: 'var(--clr-text-2)', fontStyle: 'italic' }}>
                  &ldquo;{order.notes}&rdquo;
                </p>
              </div>
            )}
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
              <ShoppingBag size={18} /> Lanjut Belanja
            </Link>

            <div style={{ textAlign: 'center', marginTop: 'var(--space-2)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--clr-text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                <HelpCircle size={14} /> Butuh bantuan dengan pesanan ini?
              </span>
              <p style={{ fontSize: '0.75rem', color: 'var(--clr-text-2)', marginTop: '2px' }}>
                Hubungi concierge LUXE 24/7 di support@luxe.id
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

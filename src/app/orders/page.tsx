'use client';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { useToast } from '@/components/ui/ToastProvider';
import { Package, ChevronRight, Clock } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import type { Order } from '@/types';
import Link from 'next/link';

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  pending:   { label: 'Menunggu', cls: 'badge-warning' },
  confirmed: { label: 'Dikonfirmasi', cls: 'badge-gold' },
  shipped:   { label: 'Dikirim', cls: 'badge-gold' },
  delivered: { label: 'Diterima', cls: 'badge-success' },
  cancelled: { label: 'Dibatalkan', cls: 'badge-error' },
};

const PAYMENT_MAP: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Belum Bayar', cls: 'badge-warning' },
  paid:    { label: 'Lunas', cls: 'badge-success' },
  failed:  { label: 'Gagal', cls: 'badge-error' },
};

export default function OrdersPage() {
  const { token } = useAuthStore();
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch('/api/orders', { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (data.success) setOrders(data.data.orders);
      } catch {
        showToast('Gagal memuat pesanan', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [token]);

  return (
    <div className="container" style={{ padding: 'calc(72px + var(--space-8)) var(--space-6) var(--space-12)', maxWidth: '900px' }}>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 400, marginBottom: 'var(--space-8)' }}>
        Pesanan Saya
      </h1>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: '120px', borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-20) 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-6)' }}>
          <Package size={64} strokeWidth={1} style={{ color: 'var(--clr-text-3)' }} />
          <div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontWeight: 400, fontSize: '1.5rem', marginBottom: 'var(--space-3)' }}>Belum Ada Pesanan</h2>
            <p style={{ color: 'var(--clr-text-2)' }}>Yuk, mulai berbelanja koleksi eksklusif kami!</p>
          </div>
          <Link href="/products" className="btn btn-primary">Mulai Belanja</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((order, i) => (
            <div key={order.id} className="card" style={{ padding: 'var(--space-6)', animation: `fadeIn 0.3s ${i * 0.05}s both` }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{order.id}</span>
                    <span className={`badge ${STATUS_MAP[order.orderStatus]?.cls || 'badge-neutral'}`}>
                      {STATUS_MAP[order.orderStatus]?.label || order.orderStatus}
                    </span>
                    <span className={`badge ${PAYMENT_MAP[order.paymentStatus]?.cls || 'badge-neutral'}`}>
                      {PAYMENT_MAP[order.paymentStatus]?.label || order.paymentStatus}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--clr-text-3)', fontSize: '0.8rem' }}>
                    <Clock size={12} />
                    {new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--clr-gold)' }}>
                  {formatPrice(order.total)}
                </span>
              </div>

              {/* Items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                {order.items.map((item) => (
                  <div key={`${item.productId}-${item.size}`} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', padding: 'var(--space-2) var(--space-3)', background: 'var(--clr-bg-3)', borderRadius: 'var(--radius-sm)' }}>
                    <span>
                      <strong>{item.product?.name || item.productId}</strong>
                      <span style={{ color: 'var(--clr-text-2)', marginLeft: 'var(--space-2)' }}>× {item.quantity} ({item.size})</span>
                    </span>
                    <span style={{ fontWeight: 600 }}>{formatPrice((item.product?.price || 0) * item.quantity)}</span>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--clr-text-2)' }}>
                  Metode: {order.paymentMethod === 'credit_card' ? 'Kartu Kredit' : order.paymentMethod === 'gopay' ? 'GoPay' : 'COD'}
                  {' · '}Pengiriman ke {order.address.city}
                </span>
                <Link href={`/orders/${order.id}`} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--clr-gold)', fontWeight: 600 }}>
                  Detail <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

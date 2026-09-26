'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, X, ShoppingBag, ArrowRight, Tag } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { formatPrice } from '@/lib/utils';

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, totalPrice } = useCartStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const subtotal = totalPrice();
  const shipping = subtotal >= 5000000 ? 0 : 50000;
  const tax = Math.round(subtotal * 0.1);
  const total = subtotal + shipping + tax;

  return (
    <div className="container" style={{ padding: 'var(--space-10) var(--space-6)' }}>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 400, marginBottom: 'var(--space-8)' }}>
        Keranjang Belanja
      </h1>

      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-20) 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-6)' }}>
          <ShoppingBag size={64} strokeWidth={1} style={{ color: 'var(--clr-text-3)' }} />
          <div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontWeight: 400, marginBottom: 'var(--space-3)', fontSize: '1.5rem' }}>Keranjang Kosong</h2>
            <p style={{ color: 'var(--clr-text-2)' }}>Temukan koleksi eksklusif kami dan mulai berbelanja.</p>
          </div>
          <Link href="/products" className="btn btn-primary btn-lg">
            Mulai Belanja <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 'var(--space-8)', alignItems: 'start' }}>
          {/* Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
              <span style={{ color: 'var(--clr-text-2)', fontSize: '0.875rem' }}>{items.length} item</span>
              <button className="btn btn-danger btn-sm" onClick={clearCart}>Hapus Semua</button>
            </div>

            {items.map((item) => (
              <div key={`${item.productId}-${item.size}-${item.color}`}
                className="card"
                style={{ display: 'flex', gap: 'var(--space-5)', padding: 'var(--space-5)', animation: 'fadeIn 0.3s both' }}>
                {/* Image */}
                <Link href={`/products/${item.productId}`} style={{ flexShrink: 0 }}>
                  <div style={{ position: 'relative', width: '100px', height: '130px', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--clr-bg-3)' }}>
                    <Image src={item.product.images[0]} alt={item.product.name} fill style={{ objectFit: 'cover' }} />
                  </div>
                </Link>

                {/* Info */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--clr-gold)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{item.product.category}</span>
                      <h3 style={{ fontFamily: 'var(--font-serif)', fontWeight: 400, fontSize: '1.05rem', marginTop: '2px' }}>
                        <Link href={`/products/${item.productId}`}>{item.product.name}</Link>
                      </h3>
                    </div>
                    <button onClick={() => removeItem(item.productId, item.size, item.color)} style={{ color: 'var(--clr-text-3)', transition: 'color var(--transition-fast)' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--clr-error)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--clr-text-3)'}
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                    <span className="badge badge-neutral">{item.size}</span>
                    <span className="badge badge-neutral">{item.color}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', background: 'var(--clr-bg-3)', border: '1px solid var(--clr-border)', borderRadius: 'var(--radius-sm)', padding: '4px 8px' }}>
                      <button onClick={() => updateQuantity(item.productId, item.size, item.color, item.quantity - 1)} style={{ color: 'var(--clr-text-2)', cursor: 'pointer', display: 'flex', padding: '2px' }}>
                        <Minus size={14} />
                      </button>
                      <span style={{ minWidth: '24px', textAlign: 'center', fontWeight: 600 }}>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.productId, item.size, item.color, item.quantity + 1)} style={{ color: 'var(--clr-text-2)', cursor: 'pointer', display: 'flex', padding: '2px' }}>
                        <Plus size={14} />
                      </button>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>{formatPrice(item.product.price * item.quantity)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="card" style={{ padding: 'var(--space-6)', position: 'sticky', top: 'calc(var(--nav-height) + 16px)' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontWeight: 400, fontSize: '1.25rem', marginBottom: 'var(--space-6)' }}>
              Ringkasan Pesanan
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
              {[
                { label: 'Subtotal', value: formatPrice(subtotal) },
                { label: 'Ongkos Kirim', value: shipping === 0 ? 'Gratis!' : formatPrice(shipping) },
                { label: 'PPN (10%)', value: formatPrice(tax) },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--clr-text-2)' }}>{label}</span>
                  <span style={{ color: label === 'Ongkos Kirim' && shipping === 0 ? 'var(--clr-success)' : 'var(--clr-text)' }}>{value}</span>
                </div>
              ))}
            </div>

            {shipping === 0 && (
              <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-3)', marginBottom: 'var(--space-5)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Tag size={14} style={{ color: 'var(--clr-success)', flexShrink: 0 }} />
                <span style={{ fontSize: '0.8rem', color: 'var(--clr-success)' }}>Selamat! Anda mendapat <strong>Free Shipping</strong></span>
              </div>
            )}

            <hr className="divider" />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
              <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>Total</span>
              <span style={{ fontWeight: 700, fontSize: '1.35rem', color: 'var(--clr-gold)' }}>{formatPrice(total)}</span>
            </div>

            <Link href="/checkout" className="btn btn-primary btn-block btn-lg">
              Checkout <ArrowRight size={16} />
            </Link>
            <Link href="/products" className="btn btn-ghost btn-block" style={{ marginTop: 'var(--space-3)' }}>
              Lanjut Belanja
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

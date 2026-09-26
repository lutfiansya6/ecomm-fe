'use client';
import { X, ShoppingBag, Minus, Plus, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCartStore } from '@/store/cart';
import { formatPrice } from '@/lib/utils';

export default function CartDrawer() {
  const { items, isOpen, closeCart, updateQuantity, removeItem, totalPrice } = useCartStore();
  const total = totalPrice();

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="overlay" onClick={closeCart} />

      {/* Drawer */}
      <div style={{
        position: 'fixed',
        top: 0, right: 0, bottom: 0,
        width: 'min(420px, 100vw)',
        background: 'var(--clr-bg-2)',
        borderLeft: '1px solid var(--clr-border)',
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideInRight 0.3s var(--ease-smooth) both',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-6)', borderBottom: '1px solid var(--clr-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <ShoppingBag size={20} style={{ color: 'var(--clr-gold)' }} />
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 400 }}>
              Keranjang ({items.length})
            </h2>
          </div>
          <button className="btn btn-icon btn-ghost" onClick={closeCart}>
            <X size={18} />
          </button>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-4)' }}>
          {items.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 'var(--space-4)', color: 'var(--clr-text-2)' }}>
              <ShoppingBag size={48} strokeWidth={1} />
              <p style={{ fontSize: '0.9rem' }}>Keranjang kamu masih kosong</p>
              <Link href="/products" className="btn btn-outline btn-sm" onClick={closeCart}>
                Mulai Belanja
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {items.map((item, idx) => (
                <div key={`${item.productId}-${item.size}-${item.color}`}
                  style={{ display: 'flex', gap: 'var(--space-4)', padding: 'var(--space-4)', background: 'var(--clr-bg-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--clr-border)', animation: `fadeIn 0.3s ${idx * 0.05}s both` }}>
                  {/* Image */}
                  <div style={{ position: 'relative', width: '80px', height: '100px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', flexShrink: 0 }}>
                    <Image src={item.product.images[0]} alt={item.product.name} fill style={{ objectFit: 'cover' }} />
                  </div>

                  {/* Details */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                    <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '0.95rem', fontWeight: 400 }}>
                      {item.product.name}
                    </h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--clr-text-2)' }}>
                      {item.size} · {item.color}
                    </p>
                    <p style={{ fontWeight: 600, color: 'var(--clr-gold)', fontSize: '0.9rem', marginTop: '4px' }}>
                      {formatPrice(item.product.price * item.quantity)}
                    </p>

                    {/* Qty controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: 'auto' }}>
                      <button
                        className="btn btn-icon btn-ghost"
                        style={{ width: '28px', height: '28px', padding: 0 }}
                        onClick={() => updateQuantity(item.productId, item.size, item.color, item.quantity - 1)}
                      >
                        <Minus size={12} />
                      </button>
                      <span style={{ minWidth: '24px', textAlign: 'center', fontSize: '0.9rem', fontWeight: 600 }}>
                        {item.quantity}
                      </span>
                      <button
                        className="btn btn-icon btn-ghost"
                        style={{ width: '28px', height: '28px', padding: 0 }}
                        onClick={() => updateQuantity(item.productId, item.size, item.color, item.quantity + 1)}
                      >
                        <Plus size={12} />
                      </button>

                      <button
                        style={{ marginLeft: 'auto', color: 'var(--clr-error)', fontSize: '0.75rem', transition: 'opacity var(--transition-fast)' }}
                        onClick={() => removeItem(item.productId, item.size, item.color)}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div style={{ borderTop: '1px solid var(--clr-border)', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {/* Subtotal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--clr-text-2)', fontSize: '0.875rem' }}>Subtotal</span>
              <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{formatPrice(total)}</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--clr-text-3)' }}>
              * Ongkos kirim & pajak dihitung saat checkout
            </p>

            <Link href="/checkout" className="btn btn-primary btn-block btn-lg" onClick={closeCart}>
              Checkout <ArrowRight size={16} />
            </Link>
            <Link href="/cart" className="btn btn-ghost btn-block" onClick={closeCart}>
              Lihat Keranjang
            </Link>
          </div>
        )}
      </div>
    </>
  );
}

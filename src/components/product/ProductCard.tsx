'use client';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, Heart } from 'lucide-react';
import { useState } from 'react';
import type { Product } from '@/types';
import { formatPrice, discountPercent } from '@/lib/utils';
import { useCartStore } from '@/store/cart';
import { useToast } from '@/components/ui/ToastProvider';
import StarRating from '@/components/ui/StarRating';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [wished, setWished] = useState(false);
  const [adding, setAdding] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const { showToast } = useToast();

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAdding(true);
    await new Promise((r) => setTimeout(r, 400));
    addItem(product, 1, product.sizes[0], product.colors[0]);
    showToast(`${product.name} ditambahkan ke keranjang`, 'success');
    setAdding(false);
    openCart();
  };

  return (
    <Link href={`/products/${product.id}`} style={{ display: 'block' }}>
      <div className="card" style={{ cursor: 'pointer', height: '100%' }}>
        {/* Image */}
        <div style={{ position: 'relative', aspectRatio: '3/4', overflow: 'hidden', background: 'var(--clr-bg-3)' }}>
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
            style={{ objectFit: 'cover', transition: 'transform 0.5s var(--ease-smooth)' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'scale(1.05)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'scale(1)'}
          />

          {/* Badges */}
          <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {product.comparePrice && (
              <span className="badge badge-gold">
                -{discountPercent(product.price, product.comparePrice)}%
              </span>
            )}
            {product.featured && (
              <span className="badge badge-neutral">Featured</span>
            )}
            {product.stock <= 5 && product.stock > 0 && (
              <span className="badge badge-warning">Sisa {product.stock}</span>
            )}
            {product.stock === 0 && (
              <span className="badge badge-error">Habis</span>
            )}
          </div>

          {/* Wishlist */}
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setWished(!wished); }}
            style={{
              position: 'absolute', top: '12px', right: '12px',
              width: '36px', height: '36px',
              background: 'rgba(10,10,10,0.7)', backdropFilter: 'blur(8px)',
              border: '1px solid var(--clr-border)',
              borderRadius: 'var(--radius-full)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: wished ? 'var(--clr-gold)' : 'var(--clr-text-2)',
              transition: 'all var(--transition-fast)',
            }}
          >
            <Heart size={14} fill={wished ? 'var(--clr-gold)' : 'none'} />
          </button>

          {/* Quick add (hover overlay) */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: '12px',
            opacity: 0, transition: 'opacity var(--transition-base)',
          }}
            className="quick-add-overlay"
          >
            <button
              className="btn btn-primary btn-block btn-sm"
              onClick={handleQuickAdd}
              disabled={adding || product.stock === 0}
              style={{ backdropFilter: 'blur(8px)' }}
            >
              {adding ? (
                <span className="animate-spin" style={{ width: '14px', height: '14px', border: '2px solid #000', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block' }} />
              ) : (
                <><ShoppingBag size={14} /> Quick Add</>
              )}
            </button>
          </div>
        </div>

        {/* Info */}
        <div style={{ padding: 'var(--space-4)' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--clr-gold)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '4px' }}>
            {product.category}
          </p>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', fontWeight: 400, marginBottom: 'var(--space-2)', color: 'var(--clr-text)' }}>
            {product.name}
          </h3>
          <StarRating rating={product.rating} count={product.reviewCount} size={12} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
            <span style={{ fontWeight: 600, color: 'var(--clr-text)' }}>{formatPrice(product.price)}</span>
            {product.comparePrice && (
              <span style={{ fontSize: '0.8rem', color: 'var(--clr-text-3)', textDecoration: 'line-through' }}>
                {formatPrice(product.comparePrice)}
              </span>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .card:hover .quick-add-overlay { opacity: 1 !important; }
      `}</style>
    </Link>
  );
}

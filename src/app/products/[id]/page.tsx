'use client';
import { useEffect, useState, use } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ShoppingBag, ArrowLeft, Check, Minus, Plus } from 'lucide-react';
import type { Product } from '@/types';
import { formatPrice, discountPercent } from '@/lib/utils';
import { useCartStore } from '@/store/cart';
import { useToast } from '@/components/ui/ToastProvider';
import StarRating from '@/components/ui/StarRating';
import ProductCard from '@/components/product/ProductCard';

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchProduct = async () => {
      const res = await fetch(`/api/products/${id}`);
      const data = await res.json();
      if (data.success) {
        setProduct(data.data);
        setSelectedSize(data.data.sizes[0]);
        setSelectedColor(data.data.colors[0]);
        // Fetch related
        const relRes = await fetch(`/api/products?category=${data.data.category}`);
        const relData = await relRes.json();
        setRelated((relData.data?.products || []).filter((p: Product) => p.id !== id).slice(0, 4));
      }
      setLoading(false);
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    if (!selectedSize) { showToast('Pilih ukuran terlebih dahulu', 'error'); return; }
    addItem(product, quantity, selectedSize, selectedColor);
    setAdded(true);
    showToast(`${product.name} ditambahkan ke keranjang!`, 'success');
    setTimeout(() => { setAdded(false); openCart(); }, 1200);
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: 'var(--space-10) var(--space-6)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-12)' }}>
          <div className="skeleton" style={{ aspectRatio: '3/4', borderRadius: 'var(--radius-lg)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="skeleton" style={{ height: '14px', width: '40%' }} />
            <div className="skeleton" style={{ height: '36px', width: '80%' }} />
            <div className="skeleton" style={{ height: '24px', width: '30%' }} />
          </div>
        </div>
      </div>
    );
  }

  if (!product) return <div style={{ padding: 'var(--space-20)', textAlign: 'center', color: 'var(--clr-text-2)' }}>Produk tidak ditemukan</div>;

  return (
    <>
      <div className="container" style={{ padding: 'var(--space-10) var(--space-6)' }}>
        {/* Back */}
        <button className="btn btn-ghost btn-sm" style={{ marginBottom: 'var(--space-6)' }} onClick={() => router.back()}>
          <ArrowLeft size={16} /> Kembali
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-12)', alignItems: 'start' }}>
          {/* Image */}
          <div style={{ position: 'relative', aspectRatio: '3/4', borderRadius: 'var(--radius-xl)', overflow: 'hidden', background: 'var(--clr-bg-3)' }}>
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              sizes="50vw"
              style={{ objectFit: 'cover' }}
              priority
            />
            {product.comparePrice && (
              <div style={{ position: 'absolute', top: '16px', left: '16px' }}>
                <span className="badge badge-gold">-{discountPercent(product.price, product.comparePrice)}% OFF</span>
              </div>
            )}
          </div>

          {/* Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'slideInLeft 0.4s both' }}>
            <div>
              <span style={{ fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--clr-gold)' }}>
                {product.category}
              </span>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: 400, marginTop: 'var(--space-2)', lineHeight: 1.2 }}>
                {product.name}
              </h1>
              <div style={{ marginTop: 'var(--space-3)' }}>
                <StarRating rating={product.rating} count={product.reviewCount} size={16} />
              </div>
            </div>

            {/* Price */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-4)' }}>
              <span style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--clr-text)' }}>
                {formatPrice(product.price)}
              </span>
              {product.comparePrice && (
                <span style={{ fontSize: '1.1rem', color: 'var(--clr-text-3)', textDecoration: 'line-through' }}>
                  {formatPrice(product.comparePrice)}
                </span>
              )}
            </div>

            <hr className="divider" style={{ margin: '0' }} />

            {/* Color */}
            <div>
              <p style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--clr-text-2)', marginBottom: 'var(--space-3)' }}>
                Warna: <strong style={{ color: 'var(--clr-text)' }}>{selectedColor}</strong>
              </p>
              <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                {product.colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`btn btn-sm ${selectedColor === color ? 'btn-primary' : 'btn-ghost'}`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>

            {/* Size */}
            <div>
              <p style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--clr-text-2)', marginBottom: 'var(--space-3)' }}>
                Ukuran: <strong style={{ color: 'var(--clr-text)' }}>{selectedSize}</strong>
              </p>
              <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    style={{
                      width: '44px', height: '44px',
                      border: `1px solid ${selectedSize === size ? 'var(--clr-gold)' : 'var(--clr-border)'}`,
                      borderRadius: 'var(--radius-sm)',
                      background: selectedSize === size ? 'var(--clr-gold)' : 'transparent',
                      color: selectedSize === size ? '#000' : 'var(--clr-text-2)',
                      fontSize: '0.8rem', fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div>
              <p style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--clr-text-2)', marginBottom: 'var(--space-3)' }}>Jumlah</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <button className="btn btn-icon btn-ghost" onClick={() => setQuantity((q) => Math.max(1, q - 1))}><Minus size={16} /></button>
                <span style={{ minWidth: '32px', textAlign: 'center', fontWeight: 600, fontSize: '1.1rem' }}>{quantity}</span>
                <button className="btn btn-icon btn-ghost" onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}><Plus size={16} /></button>
                <span style={{ fontSize: '0.8rem', color: 'var(--clr-text-3)' }}>Stok: {product.stock}</span>
              </div>
            </div>

            {/* CTA */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <button
                className={`btn btn-lg btn-block ${added ? '' : 'btn-primary'}`}
                style={added ? { background: 'var(--clr-success)', color: '#fff', borderColor: 'var(--clr-success)' } : {}}
                onClick={handleAddToCart}
                disabled={product.stock === 0}
              >
                {added ? <><Check size={18} /> Ditambahkan!</> : <><ShoppingBag size={18} /> Tambah ke Keranjang</>}
              </button>
            </div>

            {/* Description */}
            <div style={{ borderTop: '1px solid var(--clr-border)', paddingTop: 'var(--space-6)' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', fontWeight: 400, marginBottom: 'var(--space-3)' }}>Deskripsi</h3>
              <p style={{ color: 'var(--clr-text-2)', lineHeight: '1.85', fontSize: '0.95rem' }}>{product.description}</p>
            </div>

            {/* Tags */}
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              {product.tags.map((tag) => (
                <span key={tag} className="badge badge-neutral">#{tag}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <div style={{ marginTop: 'var(--space-20)' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontWeight: 400, marginBottom: 'var(--space-8)', textAlign: 'center' }}>
              You May Also Like
            </h2>
            <div className="grid-products">
              {related.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

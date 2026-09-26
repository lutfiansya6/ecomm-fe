'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SlidersHorizontal, X } from 'lucide-react';
import ProductCard from '@/components/product/ProductCard';
import type { Product } from '@/types';

const CATEGORIES = ['dress', 'blazer', 'bag', 'shoes', 'coat', 'accessories'];
const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Terbaru' },
  { value: 'price_asc', label: 'Harga: Terendah' },
  { value: 'price_desc', label: 'Harga: Tertinggi' },
  { value: 'rating', label: 'Rating Terbaik' },
];

const SECTION_TITLES: Record<string, string> = {
  new: 'New Arrivals',
  women: 'Women',
  men: 'Men',
  collections: 'Collections',
  sale: 'Sale',
};

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const section = searchParams.get('section') || '';
  const category = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || 'createdAt';
  const search = searchParams.get('search') || '';
  const featured = searchParams.get('featured') || '';

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      if (sort) params.set('sort', sort);
      if (search) params.set('search', search);
      if (featured) params.set('featured', featured);

      try {
        const res = await fetch(`/api/products?${params}`);
        const data = await res.json();
        let items: Product[] = data.data?.products || [];

        // Filter based on active section
        if (section === 'women') {
          // Women collection: all luxury pieces suitable for women (dresses, bags, shoes, coats, blazers, accessories)
          items = items.filter((p) => !p.tags?.includes('men-only'));
        } else if (section === 'men') {
          // Men collection: blazers, coats, accessories, bags, trousers (excluding dresses and stilettos)
          items = items.filter(
            (p) => p.category !== 'dress' && !p.tags?.includes('heels') && !p.tags?.includes('women-only')
          );
        } else if (section === 'collections') {
          // Curated luxury signature pieces
          items = items.filter(
            (p) =>
              p.featured ||
              p.tags?.some((t) => ['luxury', 'bestseller', 'evening', 'chain', 'wool', 'silk', 'logo'].includes(t))
          );
        } else if (section === 'sale') {
          // Discounted items only
          items = items.filter((p) => p.comparePrice && p.comparePrice > p.price);
        } else if (section === 'new') {
          // Sorted by newest
          items = [...items].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        }

        setProducts(items);
      } catch (err) {
        console.error('Failed to fetch products', err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [section, category, sort, search, featured]);

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/products?${params.toString()}`);
  };

  const clearFilters = () => {
    if (section) router.push(`/products?section=${section}`);
    else router.push('/products');
  };

  const hasFilters = Boolean(category || search);
  const currentSectionTitle = featured === 'true'
    ? 'Best Seller'
    : section ? SECTION_TITLES[section] || 'All Products' : 'All Products';

  return (
    <div className="container" style={{ padding: 'var(--space-10) var(--space-6)' }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-8)', paddingTop: 'var(--space-6)' }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 400, marginBottom: 'var(--space-2)' }}>
          {currentSectionTitle}
        </h1>
        <p style={{ color: 'var(--clr-text-2)', fontSize: '0.9rem' }}>
          {category ? `${category.charAt(0).toUpperCase() + category.slice(1)} · ` : ''}
          {products.length} produk ditemukan
        </p>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-8)', flexWrap: 'wrap' }}>
        {/* Search */}
        <input
          className="input"
          type="text"
          placeholder="Cari produk..."
          defaultValue={search}
          style={{ maxWidth: '280px', flex: '1 1 200px' }}
          onChange={(e) => {
            clearTimeout((window as unknown as Record<string, number>)._st);
            (window as unknown as Record<string, number>)._st = setTimeout(() => updateParam('search', e.target.value), 500) as unknown as number;
          }}
        />

        {/* Category Filter */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <button
            className={`btn btn-sm ${!category ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => updateParam('category', '')}
          >All</button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`btn btn-sm ${category === cat ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => updateParam('category', cat)}
            >{cat.charAt(0).toUpperCase() + cat.slice(1)}</button>
          ))}
        </div>

        {/* Sort */}
        <select
          className="input select"
          value={sort}
          onChange={(e) => updateParam('sort', e.target.value)}
          style={{ width: 'auto', marginLeft: 'auto', minWidth: '160px' }}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {hasFilters && (
          <button className="btn btn-danger btn-sm" onClick={clearFilters}>
            <X size={14} /> Reset
          </button>
        )}
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid-products">
          {[...Array(8)].map((_, i) => (
            <div key={i} style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
              <div className="skeleton" style={{ aspectRatio: '3/4' }} />
              <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <div className="skeleton" style={{ height: '12px', width: '60%' }} />
                <div className="skeleton" style={{ height: '18px', width: '80%' }} />
                <div className="skeleton" style={{ height: '16px', width: '40%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-20) 0', color: 'var(--clr-text-2)' }}>
          <p style={{ fontSize: '1.1rem', marginBottom: 'var(--space-4)' }}>
            Tidak ada produk ditemukan {category ? `di kategori ${category}` : ''}
          </p>
          <button className="btn btn-outline" onClick={clearFilters}>
            Lihat Semua {currentSectionTitle !== 'All Products' ? `Koleksi ${currentSectionTitle}` : 'Produk'}
          </button>
        </div>
      ) : (
        <div className="grid-products">
          {products.map((product, i) => (
            <div key={product.id} style={{ animation: `fadeIn 0.4s ${i * 0.05}s both` }}>
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense>
      <ProductsContent />
    </Suspense>
  );
}

'use client';
import { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import ProductCard from '@/components/product/ProductCard';
import type { Product, Category, NavigationItem } from '@/types';
import { useT } from '@/i18n/LanguageProvider';
import { getLocalizedCategoryName, getLocalizedNavLabel } from '@/i18n';
import { DEFAULT_NAV_ITEMS, getNavigationItemSlug } from '@/config/navigation';

function ProductsContent() {
  const { t, locale } = useT();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);
  const [navItems, setNavItems] = useState<NavigationItem[]>(DEFAULT_NAV_ITEMS);

  // Active query parameters
  const menu = searchParams.get('menu') || '';
  const gender = searchParams.get('gender') || '';
  const section = searchParams.get('section') || '';
  const category = searchParams.get('category') || '';
  const sortParam = searchParams.get('sort') || '';
  const saleParam = searchParams.get('sale');
  const search = searchParams.get('search') || '';
  const featured = searchParams.get('featured') || '';

  const sortOptions = useMemo(
    () => [
      { value: '', label: t('products.sort.default') || 'Default' },
      { value: 'newest', label: t('products.sort.newest') },
      { value: 'price_asc', label: t('products.sort.priceAsc') },
      { value: 'price_desc', label: t('products.sort.priceDesc') },
      { value: 'rating', label: t('products.sort.rating') },
    ],
    [t]
  );

  // Fetch navigation items for resolving dynamic menu labels
  useEffect(() => {
    const fetchNav = async () => {
      try {
        const res = await fetch('/api/navigation?public=1', { cache: 'no-store' });
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setNavItems(json.data);
        }
      } catch {
        // Fallback to DEFAULT_NAV_ITEMS
      }
    };
    fetchNav();
  }, []);

  // Fetch categories with cache: 'no-store'
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categories', { cache: 'no-store' });
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setCategories(data.data);
        } else {
          setCategories([]);
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err);
        setCategories([]);
      } finally {
        setCategoriesLoaded(true);
      }
    };

    fetchCategories();
  }, []);

  // Check category validity against fetched active categories
  const isCategoryValid =
    !category ||
    (categoriesLoaded &&
      categories.some((c) => c.slug.toLowerCase() === category.toLowerCase()));
  const effectiveCategory = categoriesLoaded && !isCategoryValid ? '' : category;

  // Selected category object
  const selectedCategory = (categories || []).find(
    (c) => c.slug.toLowerCase() === effectiveCategory.toLowerCase()
  );

  // Localized category name (if selected)
  const selectedCategoryName = selectedCategory
    ? getLocalizedCategoryName(selectedCategory, locale)
    : effectiveCategory
      ? effectiveCategory.charAt(0).toUpperCase() + effectiveCategory.slice(1)
      : '';

  // 3. Judul halaman = label menu (EN/ID lewat t())
  let pageTitle = '';
  if (menu) {
    const slug = menu.toLowerCase();
    if (slug === 'women') {
      pageTitle = t('nav.women');
    } else if (slug === 'men') {
      pageTitle = t('nav.men');
    } else if (slug === 'collections') {
      pageTitle = t('nav.collections');
    } else if (slug === 'sale') {
      pageTitle = t('nav.sale');
    } else if (slug === 'new-arrivals' || slug === 'new') {
      pageTitle = t('nav.newArrivals');
    } else if (slug === 'all' || slug === 'all-products') {
      pageTitle = t('nav.allProducts');
    } else {
      const matched = navItems.find((n) => getNavigationItemSlug(n) === slug);
      if (matched) {
        pageTitle = getLocalizedNavLabel(matched, locale) || matched.label;
      } else {
        pageTitle = menu.charAt(0).toUpperCase() + menu.slice(1).replace(/-/g, ' ');
      }
    }
  } else {
    // If no ?menu, fallback titles for legacy direct URLs or All Products
    if (gender === 'women') {
      pageTitle = t('nav.women');
    } else if (gender === 'men') {
      pageTitle = t('nav.men');
    } else if (section === 'collections') {
      pageTitle = t('nav.collections');
    } else if (saleParam === '1' || saleParam === 'true' || section === 'sale') {
      pageTitle = t('nav.sale');
    } else if (sortParam === 'newest' || section === 'new') {
      pageTitle = t('nav.newArrivals');
    } else if (featured === 'true') {
      pageTitle = t('common.bestSeller');
    } else if (selectedCategoryName) {
      pageTitle = selectedCategoryName;
    } else {
      pageTitle = t('products.title');
    }
  }

  useEffect(() => {
    // If category in URL is not in list (e.g. deleted or hidden), return to current menu without error
    if (categoriesLoaded && category) {
      const isValid = categories.some(
        (c) => c.slug.toLowerCase() === category.toLowerCase()
      );
      if (!isValid) {
        const params = new URLSearchParams(searchParams.toString());
        params.delete('category');
        const qs = params.toString();
        router.replace(qs ? `/products?${qs}` : '/products');
        return;
      }
    }

    const fetchProducts = async () => {
      setLoading(true);
      const params = new URLSearchParams();
      if (menu) params.set('menu', menu);
      if (effectiveCategory) params.set('category', effectiveCategory);
      if (sortParam) params.set('sort', sortParam);
      if (search) params.set('search', search);

      // Legacy fallback parameters when menu is not used
      if (!menu) {
        if (gender) params.set('gender', gender);
        if (section) params.set('section', section);
        if (saleParam === '1' || saleParam === 'true') params.set('sale', '1');
        if (featured) params.set('featured', featured);
      }

      try {
        const res = await fetch(`/api/products?${params.toString()}`);
        const data = await res.json();
        let items: Product[] = data.data?.products || [];

        // 2. Urutan produk mengikuti urutan dari API, KECUALI pengguna memilih sort
        if (sortParam) {
          if (sortParam === 'newest') {
            items = [...items].sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
          } else if (sortParam === 'price_asc') {
            items = [...items].sort((a, b) => a.price - b.price);
          } else if (sortParam === 'price_desc') {
            items = [...items].sort((a, b) => b.price - a.price);
          } else if (sortParam === 'rating') {
            items = [...items].sort((a, b) => (b.rating || 0) - (a.rating || 0));
          }
        }

        // 5. Chip kategori tetap menyaring di dalam hasil menu
        if (effectiveCategory) {
          items = items.filter((p) => {
            const pCat = (p.category || '').toLowerCase();
            const target = effectiveCategory.toLowerCase();
            return pCat === target || (selectedCategory && p.categoryId === selectedCategory.id);
          });
        }

        // Legacy filters if not using menu
        if (!menu) {
          if (saleParam === '1' || saleParam === 'true' || section === 'sale') {
            items = items.filter((p) => p.comparePrice && p.comparePrice > p.price);
          }
          const effectiveGender = gender || (section === 'women' ? 'women' : section === 'men' ? 'men' : '');
          if (effectiveGender === 'women') {
            items = items.filter(
              (p) =>
                p.gender === 'women' ||
                p.gender === 'unisex' ||
                (!p.gender && !p.tags?.includes('men-only'))
            );
          } else if (effectiveGender === 'men') {
            items = items.filter(
              (p) =>
                p.gender === 'men' ||
                p.gender === 'unisex' ||
                (!p.gender &&
                  p.category !== 'dress' &&
                  !p.tags?.includes('heels') &&
                  !p.tags?.includes('women-only'))
            );
          }
          if (section === 'collections') {
            items = items.filter(
              (p) =>
                p.featured ||
                p.tags?.some((t) =>
                  ['luxury', 'bestseller', 'evening', 'chain', 'wool', 'silk', 'logo'].includes(t)
                )
            );
          }
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
  }, [
    menu,
    gender,
    section,
    category,
    effectiveCategory,
    sortParam,
    saleParam,
    search,
    featured,
    categoriesLoaded,
    categories,
    selectedCategory,
    router,
    searchParams,
  ]);

  // Update query params while preserving active ?menu
  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/products?${params.toString()}`);
  };

  // 5. RESET menghapus semua parameter kecuali ?menu
  const clearFilters = () => {
    if (menu) {
      router.push(`/products?menu=${encodeURIComponent(menu)}`);
    } else {
      router.push('/products');
    }
  };

  // Has filters other than ?menu
  const hasFilters = Boolean(
    effectiveCategory ||
    search ||
    sortParam ||
    gender ||
    section ||
    saleParam ||
    featured
  );

  return (
    <div className="container" style={{ padding: 'var(--space-10) var(--space-6)' }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-8)', paddingTop: 'var(--space-6)' }}>
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontWeight: 400,
            marginBottom: 'var(--space-2)',
          }}
        >
          {pageTitle}
        </h1>
        <p style={{ color: 'var(--clr-text-2)', fontSize: '0.9rem' }}>
          {t('products.productsFound', { count: products.length })}
        </p>
      </div>

      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-8)',
          flexWrap: 'wrap',
        }}
      >
        {/* Search */}
        <input
          className="input"
          type="text"
          placeholder={t('products.searchPlaceholder')}
          defaultValue={search}
          style={{ maxWidth: '280px', flex: '1 1 200px' }}
          onChange={(e) => {
            clearTimeout((window as unknown as Record<string, number>)._st);
            (window as unknown as Record<string, number>)._st = setTimeout(
              () => updateParam('search', e.target.value),
              500
            ) as unknown as number;
          }}
        />

        {/* Category Filter Chips - Preserves ?menu */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <button
            className={`btn btn-sm ${!effectiveCategory ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => updateParam('category', '')}
          >
            {t('products.all')}
          </button>
          {(categories || []).map((cat) => {
            const catName = getLocalizedCategoryName(cat, locale);
            return (
              <button
                key={cat.id || cat.slug}
                className={`btn btn-sm ${
                  effectiveCategory.toLowerCase() === cat.slug.toLowerCase()
                    ? 'btn-primary'
                    : 'btn-ghost'
                }`}
                onClick={() => updateParam('category', cat.slug)}
              >
                {catName}
              </button>
            );
          })}
        </div>

        {/* Sort - Default represents order from API */}
        <select
          className="input select"
          value={sortParam}
          onChange={(e) => updateParam('sort', e.target.value)}
          style={{ width: 'auto', marginLeft: 'auto', minWidth: '160px' }}
        >
          {sortOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        {hasFilters && (
          <button className="btn btn-danger btn-sm" onClick={clearFilters}>
            <X size={14} /> {t('products.reset')}
          </button>
        )}
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid-products">
          {[...Array(8)].map((_, i) => (
            <div key={i} style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
              <div className="skeleton" style={{ aspectRatio: '3/4' }} />
              <div
                style={{
                  padding: 'var(--space-4)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-2)',
                }}
              >
                <div className="skeleton" style={{ height: '12px', width: '60%' }} />
                <div className="skeleton" style={{ height: '18px', width: '80%' }} />
                <div className="skeleton" style={{ height: '16px', width: '40%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: 'var(--space-20) 0',
            color: 'var(--clr-text-2)',
          }}
        >
          {/* 6. Menu kosong: tampilkan "No products in this menu yet" (lewat t()) */}
          <p style={{ fontSize: '1.1rem', marginBottom: 'var(--space-4)' }}>
            {menu
              ? t('products.noProductsInMenu')
              : selectedCategory
                ? t('products.noProductsFound', {
                    inCategory: t('products.inCategory', {
                      category: getLocalizedCategoryName(selectedCategory, locale),
                    }),
                  })
                : effectiveCategory
                  ? t('products.noProductsFound', {
                      inCategory: t('products.inCategory', { category: effectiveCategory }),
                    })
                  : t('products.noProducts')}
          </p>
          <button className="btn btn-outline" onClick={clearFilters}>
            {menu
              ? t('products.viewAllProducts')
              : pageTitle !== t('products.title')
                ? t('products.viewAll', { title: pageTitle })
                : t('products.viewAllProducts')}
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

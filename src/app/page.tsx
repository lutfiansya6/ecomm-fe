import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Star, Truck, Shield, RefreshCw } from 'lucide-react';
import ProductCard from '@/components/product/ProductCard';
import type { Product } from '@/types';

async function getFeaturedProducts(): Promise<Product[]> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  try {
    const res = await fetch(`${baseUrl}/api/products?featured=true`, { cache: 'no-store' });
    const data = await res.json();
    return data.data?.products || [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const featured = await getFeaturedProducts();

  return (
    <>
      {/* ── Hero ── */}
      <section style={{ position: 'relative', height: '100vh', minHeight: '600px', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        <Image
          src="/luxe_hero_banner_clean.jpg"
          alt="LUXE — The Noir Collection"
          fill
          priority
          style={{ objectFit: 'cover', objectPosition: 'center top' }}
        />
        {/* Gradient overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.15) 100%)' }} />

        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ maxWidth: '540px', animation: 'fadeIn 0.8s both' }}>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', lineHeight: 1.1, marginBottom: 'var(--space-6)', fontWeight: 400 }}>
              The Noir<br />
              <em style={{ color: 'var(--clr-gold)', fontStyle: 'italic' }}>Collection</em>
            </h1>
            <p style={{ fontSize: '1.05rem', color: 'rgba(240,240,240,0.8)', marginBottom: 'var(--space-8)', lineHeight: '1.8', maxWidth: '400px' }}>
              Elegance defined. Curated for the modern icon who lives without compromise.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
              <Link href="/products" className="btn btn-primary btn-lg">
                Shop Now <ArrowRight size={18} />
              </Link>
              <Link href="#best-seller" className="btn btn-secondary btn-lg">
                Best Seller
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{ position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', animation: 'pulse 2s ease infinite' }}>
          <span style={{ fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--clr-text-3)' }}>Scroll</span>
          <div style={{ width: '1px', height: '40px', background: 'linear-gradient(to bottom, var(--clr-gold), transparent)' }} />
        </div>
      </section>

      {/* ── Trust Bar ── */}
      <section style={{ background: 'var(--clr-bg-2)', borderTop: '1px solid var(--clr-border)', borderBottom: '1px solid var(--clr-border)', padding: 'var(--space-6) 0' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-6)' }}>
            {[
              { icon: Truck, title: 'Free Shipping', desc: 'On orders above Rp 5.000.000' },
              { icon: Shield, title: 'Authenticity Guaranteed', desc: 'Every piece is certified genuine' },
              { icon: RefreshCw, title: '30-Day Returns', desc: 'Hassle-free return policy' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-md)', background: 'var(--clr-gold-muted)', border: '1px solid var(--clr-gold-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={20} style={{ color: 'var(--clr-gold)' }} />
                </div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '2px' }}>{title}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--clr-text-2)' }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Products / Best Seller ── */}
      <section className="page-section" id="best-seller" style={{ scrollMarginTop: '80px' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-12)' }}>
            <span style={{ fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--clr-gold)' }}>
              Curated Selection
            </span>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', marginTop: 'var(--space-3)', fontWeight: 400 }}>
              Best Seller
            </h2>
          </div>
          <div className="grid-products">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 'var(--space-12)' }}>
            <Link href="/products" className="btn btn-outline btn-lg">
              View All Collection <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Brand Story ── */}
      <section style={{ background: 'var(--clr-bg-2)', borderTop: '1px solid var(--clr-border)' }}>
        <div className="container" style={{ padding: 'var(--space-20) var(--space-6)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-16)', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--clr-gold)' }}>
                Our Story
              </span>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.75rem, 4vw, 3rem)', margin: 'var(--space-4) 0 var(--space-6)', fontWeight: 400, lineHeight: 1.2 }}>
                Crafted for<br /><em style={{ color: 'var(--clr-gold)' }}>the Icon in You</em>
              </h2>
              <p style={{ color: 'var(--clr-text-2)', lineHeight: '1.9', marginBottom: 'var(--space-4)' }}>
                LUXE was born from a single conviction: that true luxury is not about excess, but about intention. Each piece in our collection is crafted with a singular dedication to quality, sustainability, and timeless elegance.
              </p>
              <p style={{ color: 'var(--clr-text-2)', lineHeight: '1.9', marginBottom: 'var(--space-8)' }}>
                From the finest Italian fabrics to the most skilled artisans, every detail is considered with the wearer in mind — you.
              </p>
              <Link href="/products" className="btn btn-outline">
                Explore the Collection
              </Link>
            </div>
            <div style={{ position: 'relative', height: '560px', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
              <Image
                src="/luxe_hero_banner_1790064463066.jpg"
                alt="LUXE Brand Story"
                fill
                style={{ objectFit: 'cover', objectPosition: 'right center' }}
              />
              {/* Gold frame accent */}
              <div style={{ position: 'absolute', inset: '16px', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 'var(--radius-lg)', pointerEvents: 'none' }} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonial ── */}
      <section className="page-section" style={{ textAlign: 'center' }}>
        <div className="container">
          <div style={{ maxWidth: '680px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginBottom: 'var(--space-6)' }}>
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={20} fill="var(--clr-gold)" stroke="var(--clr-gold)" />
              ))}
            </div>
            <blockquote style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.2rem, 3vw, 1.6rem)', fontStyle: 'italic', lineHeight: '1.6', marginBottom: 'var(--space-8)', color: 'var(--clr-text)' }}>
              &ldquo;The Noir Slit Gown is simply breathtaking. The quality is unmatched, and I&apos;ve never felt more confident. LUXE has truly redefined what luxury means to me.&rdquo;
            </blockquote>
            <p style={{ fontSize: '0.8rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--clr-gold)' }}>
              Sarah J. — Jakarta
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

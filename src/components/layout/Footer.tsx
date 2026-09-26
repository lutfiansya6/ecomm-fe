'use client';
import Link from 'next/link';
import { Globe, MessageCircle, Share2, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{
      background: 'var(--clr-bg-2)',
      borderTop: '1px solid var(--clr-border)',
      paddingTop: 'var(--space-16)',
    }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 'var(--space-10)', paddingBottom: 'var(--space-12)' }}>
          {/* Brand */}
          <div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', letterSpacing: '0.1em', marginBottom: 'var(--space-4)' }}>
              LUXE
            </h2>
            <p style={{ color: 'var(--clr-text-2)', fontSize: '0.9rem', lineHeight: '1.8', maxWidth: '280px', marginBottom: 'var(--space-6)' }}>
              Curated luxury fashion for the modern icon. Each piece is crafted with intention, elegance, and enduring quality.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            {[Globe, MessageCircle, Share2].map((Icon, i) => (
                <a key={i} href="#" style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--clr-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--clr-text-2)', transition: 'all var(--transition-fast)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--clr-gold)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--clr-gold)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--clr-text-2)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--clr-border)'; }}
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Shop */}
          <div>
            <h6 style={{ fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--clr-gold)', marginBottom: 'var(--space-5)' }}>Shop</h6>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {['All Products', 'Dresses', 'Blazers', 'Bags', 'Shoes', 'Accessories'].map((item) => (
                <li key={item}>
                  <Link href={`/products${item !== 'All Products' ? `?category=${item.toLowerCase()}` : ''}`}
                    style={{ color: 'var(--clr-text-2)', fontSize: '0.875rem', transition: 'color var(--transition-fast)' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--clr-text)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--clr-text-2)'}
                  >{item}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h6 style={{ fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--clr-gold)', marginBottom: 'var(--space-5)' }}>Info</h6>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {['About LUXE', 'Sustainability', 'Size Guide', 'Care Instructions', 'FAQ'].map((item) => (
                <li key={item}>
                  <a href="#" style={{ color: 'var(--clr-text-2)', fontSize: '0.875rem', transition: 'color var(--transition-fast)' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--clr-text)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--clr-text-2)'}
                  >{item}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h6 style={{ fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--clr-gold)', marginBottom: 'var(--space-5)' }}>Newsletter</h6>
            <p style={{ color: 'var(--clr-text-2)', fontSize: '0.85rem', marginBottom: 'var(--space-4)', lineHeight: '1.7' }}>
              Be first to know about new collections and exclusive offers.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <input className="input" type="email" placeholder="Your email" style={{ flex: 1, fontSize: '0.85rem', padding: '0.6rem 0.875rem' }} />
              <button className="btn btn-primary" style={{ padding: '0.6rem', minWidth: 'auto' }}>
                <Mail size={16} />
              </button>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--clr-border)', padding: 'var(--space-6) 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <p style={{ color: 'var(--clr-text-3)', fontSize: '0.8rem' }}>
            © 2026 LUXE. Prototype — Data dummy untuk tujuan pembelajaran.
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-6)' }}>
            {['Privacy', 'Terms', 'Returns'].map((item) => (
              <a key={item} href="#" style={{ color: 'var(--clr-text-3)', fontSize: '0.8rem', transition: 'color var(--transition-fast)' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--clr-text-2)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--clr-text-3)'}
              >{item}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

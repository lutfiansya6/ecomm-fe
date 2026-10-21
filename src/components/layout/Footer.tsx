'use client';
import Link from 'next/link';
import { Globe, MessageCircle, Share2, Mail } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { Category } from '@/types';
import { useT } from '@/i18n/LanguageProvider';
import { getLocalizedCategoryName } from '@/i18n';

export default function Footer() {
  const { t, locale } = useT();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetch('/api/categories', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.data)) {
          setCategories(d.data);
        }
      })
      .catch(() => {});
  }, []);

  const infoLinks = [
    { label: t('common.footerAbout'), href: '#' },
    { label: t('common.footerSustainability'), href: '#' },
    { label: t('common.footerSizeGuide'), href: '#' },
    { label: t('common.footerCare'), href: '#' },
    { label: t('common.footerFaq'), href: '#' },
  ];

  return (
    <footer
      style={{
        background: 'var(--clr-bg-2)',
        borderTop: '1px solid var(--clr-border)',
        paddingTop: 'var(--space-16)',
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 1fr',
            gap: 'var(--space-10)',
            paddingBottom: 'var(--space-12)',
          }}
        >
          {/* Brand */}
          <div>
            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '2rem',
                letterSpacing: '0.1em',
                marginBottom: 'var(--space-4)',
              }}
            >
              LUXE
            </h2>
            <p
              style={{
                color: 'var(--clr-text-2)',
                fontSize: '0.9rem',
                lineHeight: '1.8',
                maxWidth: '280px',
                marginBottom: 'var(--space-6)',
              }}
            >
              {t('common.footerTagline')}
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              {[Globe, MessageCircle, Share2].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--clr-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--clr-text-2)',
                    transition: 'all var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color = 'var(--clr-gold)';
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--clr-gold)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color = 'var(--clr-text-2)';
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--clr-border)';
                  }}
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Shop */}
          <div>
            <h6
              style={{
                fontSize: '0.75rem',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'var(--clr-gold)',
                marginBottom: 'var(--space-5)',
              }}
            >
              {t('common.footerShop')}
            </h6>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <li>
                <Link
                  href="/products"
                  style={{
                    color: 'var(--clr-text-2)',
                    fontSize: '0.875rem',
                    transition: 'color var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--clr-text)')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--clr-text-2)')}
                >
                  {t('nav.allProducts')}
                </Link>
              </li>
              {(categories || []).map((cat) => {
                const catName = getLocalizedCategoryName(cat, locale);
                return (
                  <li key={cat.id || cat.slug}>
                    <Link
                      href={`/products?category=${cat.slug}`}
                      style={{
                        color: 'var(--clr-text-2)',
                        fontSize: '0.875rem',
                        transition: 'color var(--transition-fast)',
                      }}
                      onMouseEnter={(e) =>
                        ((e.currentTarget as HTMLElement).style.color = 'var(--clr-text)')
                      }
                      onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLElement).style.color = 'var(--clr-text-2)')
                      }
                    >
                      {catName}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h6
              style={{
                fontSize: '0.75rem',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'var(--clr-gold)',
                marginBottom: 'var(--space-5)',
              }}
            >
              {t('common.footerInfo')}
            </h6>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {infoLinks.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    style={{
                      color: 'var(--clr-text-2)',
                      fontSize: '0.875rem',
                      transition: 'color var(--transition-fast)',
                    }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLElement).style.color = 'var(--clr-text)')
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLElement).style.color = 'var(--clr-text-2)')
                    }
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h6
              style={{
                fontSize: '0.75rem',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'var(--clr-gold)',
                marginBottom: 'var(--space-5)',
              }}
            >
              {t('common.footerNewsletter')}
            </h6>
            <p
              style={{
                color: 'var(--clr-text-2)',
                fontSize: '0.85rem',
                marginBottom: 'var(--space-4)',
                lineHeight: '1.7',
              }}
            >
              {t('common.footerNewsletterDesc')}
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <input
                className="input"
                type="email"
                placeholder={t('common.footerEmailPlaceholder')}
                style={{ flex: 1, fontSize: '0.85rem', padding: '0.6rem 0.875rem' }}
              />
              <button
                className="btn btn-primary"
                style={{ padding: '0.6rem', minWidth: 'auto' }}
                aria-label={t('common.footerNewsletter')}
              >
                <Mail size={16} />
              </button>
            </div>
          </div>
        </div>

        <div
          style={{
            borderTop: '1px solid var(--clr-border)',
            padding: 'var(--space-6) 0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 'var(--space-4)',
          }}
        >
          <p style={{ color: 'var(--clr-text-3)', fontSize: '0.8rem' }}>
            {t('common.footerCopyright')}
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-6)' }}>
            {[
              { label: t('common.footerPrivacy'), href: '#' },
              { label: t('common.footerTerms'), href: '#' },
              { label: t('common.footerReturns'), href: '#' },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                style={{
                  color: 'var(--clr-text-3)',
                  fontSize: '0.8rem',
                  transition: 'color var(--transition-fast)',
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.color = 'var(--clr-text-2)')
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.color = 'var(--clr-text-3)')
                }
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

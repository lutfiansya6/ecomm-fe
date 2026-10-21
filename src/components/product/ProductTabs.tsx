'use client';
import { useEffect, useRef, useState } from 'react';
import { Star } from 'lucide-react';
import type { Order, Product, Review } from '@/types';
import { useAuthStore } from '@/store/auth';
import { useToast } from '@/components/ui/ToastProvider';
import { useT } from '@/i18n/LanguageProvider';
import StarRating from '@/components/ui/StarRating';

const MAX_COMMENT = 500;

type TabKey = 'description' | 'reviews';

interface ProductTabsProps {
  product: Product;
  reviews: Review[];
  averageRating: number;
  onReviewCreated: (review: Review) => void;
  /** Open the reviews tab and scroll to the form on mount */
  focusReviewForm?: boolean;
  /** Prefer this order when several are eligible */
  preferredOrderId?: string | null;
}

function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  const active = hover || value;
  return (
    <div
      role="radiogroup"
      aria-label="Star rating"
      style={{ display: 'flex', gap: '4px' }}
      onMouseLeave={() => setHover(0)}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          id={`review-star-${star}`}
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} star`}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          style={{
            background: 'none',
            border: 'none',
            padding: '2px',
            cursor: 'pointer',
            transform: hover === star ? 'scale(1.15)' : 'scale(1)',
            transition: 'transform var(--transition-fast)',
          }}
        >
          <Star
            size={28}
            fill={active >= star ? 'var(--clr-gold)' : 'none'}
            stroke={active >= star ? 'var(--clr-gold)' : 'var(--clr-border-light)'}
          />
        </button>
      ))}
    </div>
  );
}

export default function ProductTabs({
  product,
  reviews,
  averageRating,
  onReviewCreated,
  focusReviewForm,
  preferredOrderId,
}: ProductTabsProps) {
  const { t, formatDate } = useT();
  const { user, token } = useAuthStore();
  const { showToast } = useToast();

  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<TabKey>('description');
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoaded, setOrdersLoaded] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (focusReviewForm) setTab('reviews');
  }, [focusReviewForm]);

  // Load the user's orders to determine review eligibility
  useEffect(() => {
    if (!mounted) return;
    if (!user || !token) {
      setOrders([]);
      setOrdersLoaded(true);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/orders', { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (!cancelled) setOrders(data.success ? data.data?.orders ?? [] : []);
      } catch {
        if (!cancelled) setOrders([]);
      } finally {
        if (!cancelled) setOrdersLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mounted, user, token]);

  const safeReviews = reviews ?? [];
  const safeOrders = orders ?? [];

  // Delivered orders containing this product that the user hasn't reviewed yet
  const eligibleOrders = safeOrders.filter(
    (o) =>
      o.orderStatus === 'delivered' &&
      (o.items ?? []).some((i) => i.productId === product.id) &&
      !safeReviews.some(
        (r) => r.userId === user?.id && r.orderId === o.id && r.productId === product.id
      )
  );
  const targetOrder = eligibleOrders.find((o) => o.id === preferredOrderId) ?? eligibleOrders[0];
  const canReview = mounted && ordersLoaded && !!user && !!targetOrder;

  // Scroll to the form when arriving from the orders page
  useEffect(() => {
    if (focusReviewForm && canReview) {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [focusReviewForm, canReview]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetOrder) return;
    if (rating < 1) {
      showToast(t('product.selectRatingPrompt'), 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          productId: product.id,
          orderId: targetOrder.id,
          rating,
          comment: comment.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        onReviewCreated(data.data as Review);
        setRating(0);
        setComment('');
        showToast(t('product.reviewSuccess'), 'success');
      } else {
        showToast(data.error || t('product.reviewError'), 'error');
      }
    } catch {
      showToast(t('errors.networkError'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const tabButton = (key: TabKey, label: string) => (
    <button
      key={key}
      id={`tab-${key}`}
      type="button"
      role="tab"
      aria-selected={tab === key}
      onClick={() => setTab(key)}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 'var(--space-4) var(--space-6)',
        fontSize: '0.85rem',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        fontWeight: 600,
        color: tab === key ? 'var(--clr-gold)' : 'var(--clr-text-2)',
        borderBottom: `2px solid ${tab === key ? 'var(--clr-gold)' : 'transparent'}`,
        marginBottom: '-1px',
        transition: 'all var(--transition-fast)',
      }}
    >
      {label}
    </button>
  );

  const hasDescription = !!product.description?.trim();

  return (
    <section id="product-tabs" style={{ marginTop: 'var(--space-16)' }}>
      <div
        role="tablist"
        style={{ display: 'flex', borderBottom: '1px solid var(--clr-border)', overflowX: 'auto' }}
      >
        {tabButton('description', t('product.description'))}
        {tabButton('reviews', t('product.reviewsTab', { count: safeReviews.length }))}
      </div>

      <div style={{ paddingTop: 'var(--space-8)', animation: 'fadeIn 0.3s both' }} key={tab}>
        {tab === 'description' && (
          <div role="tabpanel" aria-labelledby="tab-description" style={{ maxWidth: '780px' }}>
            {hasDescription ? (
              <p
                style={{
                  color: 'var(--clr-text-2)',
                  lineHeight: 1.85,
                  fontSize: '0.95rem',
                  whiteSpace: 'pre-line',
                }}
              >
                {product.description}
              </p>
            ) : (
              <p style={{ color: 'var(--clr-text-3)', fontSize: '0.95rem' }}>
                {t('product.noDescription')}
              </p>
            )}
          </div>
        )}

        {tab === 'reviews' && (
          <div
            role="tabpanel"
            aria-labelledby="tab-reviews"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-8)',
              maxWidth: '780px',
            }}
          >
            {/* Summary */}
            <div
              className="card"
              style={{
                padding: 'var(--space-6)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-6)',
                flexWrap: 'wrap',
              }}
            >
              {safeReviews.length > 0 ? (
                <>
                  <span
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: '2.75rem',
                      color: 'var(--clr-gold)',
                      lineHeight: 1,
                    }}
                  >
                    {averageRating.toFixed(1)}
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <StarRating rating={averageRating} size={20} />
                    <span style={{ fontSize: '0.85rem', color: 'var(--clr-text-2)' }}>
                      {t('product.reviewsCount', { count: safeReviews.length })}
                    </span>
                  </div>
                </>
              ) : (
                <span style={{ color: 'var(--clr-text-2)' }}>{t('product.noReviews')}</span>
              )}
            </div>

            {/* Form / notice */}
            <div id="review-form" ref={formRef}>
              {canReview ? (
                <form
                  onSubmit={handleSubmit}
                  className="card"
                  style={{
                    padding: 'var(--space-6)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-4)',
                    borderColor: 'var(--clr-gold)',
                  }}
                >
                  <h3
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontWeight: 400,
                      fontSize: '1.2rem',
                    }}
                  >
                    {t('product.writeReview')}
                  </h3>
                  <div className="input-group">
                    <label className="input-label">{t('product.rating')}</label>
                    <StarInput value={rating} onChange={setRating} />
                  </div>
                  <div className="input-group">
                    <label className="input-label" htmlFor="review-comment">
                      {t('product.comment')}
                    </label>
                    <textarea
                      id="review-comment"
                      className="input"
                      rows={4}
                      maxLength={MAX_COMMENT}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder={t('product.commentPlaceholder')}
                      style={{ resize: 'vertical' }}
                    />
                    <span
                      style={{
                        fontSize: '0.75rem',
                        textAlign: 'right',
                        color:
                          comment.length >= MAX_COMMENT ? 'var(--clr-error)' : 'var(--clr-text-3)',
                      }}
                    >
                      {comment.length}/{MAX_COMMENT}
                    </span>
                  </div>
                  <div>
                    <button
                      id="review-submit"
                      type="submit"
                      className="btn btn-primary"
                      disabled={submitting}
                    >
                      {submitting ? t('product.submitting') : t('product.submitReview')}
                    </button>
                  </div>
                </form>
              ) : (
                <p style={{ fontSize: '0.8rem', color: 'var(--clr-text-3)' }}>
                  {t('product.verifiedBuyersOnly')}
                </p>
              )}
            </div>

            {/* List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {safeReviews.map((r) => (
                <article key={r.id} className="card" style={{ padding: 'var(--space-5)' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 'var(--space-2)',
                      marginBottom: 'var(--space-3)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <strong style={{ fontSize: '0.9rem' }}>{r.userName}</strong>
                      <StarRating rating={r.rating} size={14} />
                    </div>
                    <time
                      dateTime={r.createdAt}
                      style={{ fontSize: '0.75rem', color: 'var(--clr-text-3)' }}
                    >
                      {formatDate(r.createdAt, {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </time>
                  </div>
                  {r.comment && (
                    <p
                      style={{
                        color: 'var(--clr-text-2)',
                        lineHeight: 1.7,
                        fontSize: '0.9rem',
                        whiteSpace: 'pre-line',
                      }}
                    >
                      {r.comment}
                    </p>
                  )}
                </article>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

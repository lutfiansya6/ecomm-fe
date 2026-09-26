'use client';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  count?: number;
  size?: number;
}

export default function StarRating({ rating, count, size = 14 }: StarRatingProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <div className="stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={size}
            fill={rating >= star ? 'var(--clr-gold)' : rating >= star - 0.5 ? 'var(--clr-gold)' : 'none'}
            stroke={rating >= star || rating >= star - 0.5 ? 'var(--clr-gold)' : 'var(--clr-border-light)'}
            opacity={rating >= star - 0.5 && rating < star ? 0.6 : 1}
          />
        ))}
      </div>
      {count !== undefined && (
        <span style={{ fontSize: '0.8rem', color: 'var(--clr-text-2)' }}>({count})</span>
      )}
    </div>
  );
}

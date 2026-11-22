import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDragScroll } from '../hooks/useDragScroll';
import { useAuth } from '../context/AuthContext';
import { BookCard } from './BookCard';

export function BookCarousel({ title, itemsList, saved, toggle }) {
  const { trackRef, scroll, dragProps } = useDragScroll();
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const handleSave = (id) => {
    if (toggle) toggle(id);
  };

  if (!itemsList || itemsList.length === 0) return null;

  return (
    <div
      className="carousel-section"
      style={{
        contentVisibility: 'auto',
        containIntrinsicSize: '0 440px',
      }}
    >
      <div className="carousel-header">
        <h2>{title}</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => scroll('left')}
            aria-label="Scroll carousel left"
            style={{
              border: 'none',
              background: '#E6F4F1',
              color: '#0F5E53',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              fontSize: '18px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(15, 94, 83, 0.08)',
              transition: 'all 0.15s ease',
            }}
          >
            ‹
          </button>
          <button
            onClick={() => scroll('right')}
            aria-label="Scroll carousel right"
            style={{
              border: 'none',
              background: '#E6F4F1',
              color: '#0F5E53',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              fontSize: '18px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(15, 94, 83, 0.08)',
              transition: 'all 0.15s ease',
            }}
          >
            ›
          </button>
        </div>
      </div>
      <div
        className="carousel-track-wrapper"
        style={{
          position: 'relative',
          overflow: 'hidden',
          maskImage: 'linear-gradient(to right, transparent, black 16px, black calc(100% - 24px), transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 16px, black calc(100% - 24px), transparent)',
        }}
      >
        <div
          className="carousel-track snap-x snap-mandatory scroll-smooth"
          ref={trackRef}
          style={{ cursor: 'grab', scrollSnapType: 'x mandatory', scrollBehavior: 'smooth' }}
          {...dragProps}
        >
          {itemsList.map((b) => (
            <div key={b.id} className="carousel-item snap-start" style={{ scrollSnapAlign: 'start' }}>
              <BookCard
                item={b}
                isSaved={saved.includes(b.id)}
                onSaveToggle={handleSave}
                style={{ height: '100%' }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default BookCarousel;

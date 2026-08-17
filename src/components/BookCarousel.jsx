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
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    toggle(id);
  };

  if (!itemsList || itemsList.length === 0) return null;

  return (
    <div className="carousel-section">
      <div className="carousel-header">
        <h2>{title}</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => scroll('left')}
            style={{ border: '1px solid var(--line)', background: '#fff', borderRadius: '50%', width: '36px', height: '36px', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            ‹
          </button>
          <button
            onClick={() => scroll('right')}
            style={{ border: '1px solid var(--line)', background: '#fff', borderRadius: '50%', width: '36px', height: '36px', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            ›
          </button>
        </div>
      </div>
      <div className="carousel-track-wrapper">
        <div
          className="carousel-track"
          ref={trackRef}
          style={{ cursor: 'grab' }}
          {...dragProps}
        >
          {itemsList.map((b) => (
            <div key={b.id} className="carousel-item">
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

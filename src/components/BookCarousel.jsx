import React, { useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { BookCover } from './BookCover';
import { ExternalLink } from './Cards';

export function BookCarousel({ title, itemsList, saved, toggle }) {
  const trackRef = useRef(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const scroll = (direction) => {
    if (trackRef.current) {
      const scrollAmount = direction === 'left' ? -380 : 380;
      trackRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const onMouseDown = useCallback((e) => {
    isDragging.current = true;
    startX.current = e.pageX - trackRef.current.offsetLeft;
    scrollLeft.current = trackRef.current.scrollLeft;
    trackRef.current.style.cursor = 'grabbing';
    trackRef.current.style.userSelect = 'none';
  }, []);

  const onMouseMove = useCallback((e) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const x = e.pageX - trackRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.4;
    trackRef.current.scrollLeft = scrollLeft.current - walk;
  }, []);

  const onMouseUp = useCallback(() => {
    isDragging.current = false;
    if (trackRef.current) {
      trackRef.current.style.cursor = 'grab';
      trackRef.current.style.userSelect = '';
    }
  }, []);

  const onMouseLeave = useCallback(() => {
    if (isDragging.current) {
      isDragging.current = false;
      if (trackRef.current) {
        trackRef.current.style.cursor = 'grab';
        trackRef.current.style.userSelect = '';
      }
    }
  }, []);

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
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseLeave}
        >
          {itemsList.map((b) => (
            <div key={b.id} className="carousel-item">
              <article className="resource" style={{ height: '100%' }}>
                <BookCover item={b} />
                <div className="resource-info">
                  <div className="badges">
                    <span>{b.license}</span>
                    <button onClick={() => toggle(b.id)}>
                      {saved.includes(b.id) ? '★ Saved' : '☆ Save'}
                    </button>
                  </div>
                  <h3>{b.title}</h3>
                  <p>{b.description}</p>
                  <small>{b.level}</small>
                  <div className="actions">
                    <Link className="detail" style={{ background: 'var(--p)', color: 'white' }} to={'/read/' + b.id}>
                      Read PDF
                    </Link>
                    <ExternalLink item={b}>
                      {b.source === 'NCERT' ? 'Download ↗' : 'Open ↗'}
                    </ExternalLink>
                  </div>
                </div>
              </article>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

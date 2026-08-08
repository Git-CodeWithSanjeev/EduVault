import React from 'react';
import { Link } from 'react-router-dom';
import { BookCover } from './BookCover';
import { useAuth } from '../context/AuthContext';

export function ExternalLink({ item, children, className }) {
  return (
    <Link to={'/go/' + item.id} className={className}>
      {children}
    </Link>
  );
}

export function Cards({ list, saved, toggle }) {
  const { isLoggedIn, openAuthModal } = useAuth();

  const handleSave = (id) => {
    toggle(id);
    if (!isLoggedIn) {
      openAuthModal();
    }
  };

  return (
    <div className="resource-grid">
      {list.map((b) => {
        const isSaved = saved.includes(b.id);
        return (
          <article className="resource" key={b.id}>
            <BookCover item={b} />
            <div className="resource-info">
              <div className="badges">
                <span>{b.license}</span>
                <button
                  onClick={() => handleSave(b.id)}
                  style={{
                    color: isSaved ? 'var(--p)' : '#716e7d',
                    fontWeight: isSaved ? 800 : 700,
                  }}
                  title={isSaved ? 'Remove from wishlist' : 'Save to wishlist'}
                >
                  {isSaved ? '★ Saved to Wishlist' : '☆ Save Wishlist'}
                </button>
              </div>
              <h3>{b.title}</h3>
              <p>{b.description}</p>
              <small>
                {b.level}
                {b.medium ? ` · ${b.medium}` : ''}
              </small>
              <div className="actions">
                <Link className="detail read-btn" to={'/read/' + b.id}>
                  Read PDF
                </Link>
                <Link className="detail" to={'/resource/' + b.id}>
                  Details
                </Link>
                <ExternalLink item={b}>
                  {b.source === 'NCERT' ? 'Download ↗' : 'Open ↗'}
                </ExternalLink>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

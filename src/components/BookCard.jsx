import React from 'react';
import { Link } from 'react-router-dom';
import { BookCover } from './BookCover';
import { ExternalLink } from './ResourceGrid';

export function BookCard({ item, isSaved, onSaveToggle, style }) {
  return (
    <article className="resource" style={{ ...style, position: 'relative' }}>
      {/* Top-Right Floating Bookmark Save Button */}
      <button
        type="button"
        className={`wishlist-btn-float ${isSaved ? 'saved' : ''}`}
        onClick={(e) => {
          e.preventDefault();
          onSaveToggle(item.id);
        }}
        title={isSaved ? 'Remove from wishlist' : 'Save to wishlist'}
        aria-label={isSaved ? 'Remove from wishlist' : 'Save to wishlist'}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          zIndex: 6,
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: isSaved ? '#0d9488' : 'rgba(255, 255, 255, 0.92)',
          color: isSaved ? '#ffffff' : '#334155',
          border: isSaved ? 'none' : '1px solid #cbd5e1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        }}
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill={isSaved ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      </button>

      <BookCover item={item} />
      <div className="resource-info" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div className="badges" style={{ marginBottom: '6px' }}>
          <span className="badge-license">{item.license}</span>
        </div>
        <h3>{item.title}</h3>
        <p>{item.description}</p>
        <small style={{ marginTop: 'auto', paddingBottom: '10px' }}>
          {item.level}
          {item.medium ? ` · ${item.medium}` : ''}
        </small>
        <div className="actions" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
          <Link
            className="detail read-btn"
            to={'/read/' + item.id}
            style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            Read PDF
          </Link>
          <Link
            className="detail"
            to={'/resource/' + item.id}
            style={{
              textAlign: 'center',
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              color: '#334155',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            Details
          </Link>
        </div>
      </div>
    </article>
  );
}

export default BookCard;

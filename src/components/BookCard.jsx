import React from 'react';
import { Link } from 'react-router-dom';
import { BookCover } from './BookCover';
import { ExternalLink } from './ResourceGrid';

export function BookCard({ item, isSaved, onSaveToggle, style }) {
  const sourceName = item.source || (item.author ? item.author.split(',')[0] : 'Open Library');
  const levelText = item.level || (item.classNum ? `Class ${item.classNum}` : 'Open');

  return (
    <article
      className="book-card-item"
      style={{
        ...style,
        position: 'relative',
        background: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 4px 18px rgba(15, 94, 83, 0.05)',
        border: 'none',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
    >
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
          top: '18px',
          right: '18px',
          zIndex: 6,
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: isSaved ? '#0F5E53' : 'rgba(255, 255, 255, 0.92)',
          color: isSaved ? '#ffffff' : '#334155',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.18)',
          transition: 'all 0.15s ease',
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

      {/* 3:4 Subject-Coded Book Cover */}
      <Link to={'/read/' + item.id} style={{ display: 'block', textDecoration: 'none' }}>
        <BookCover item={item} />
      </Link>

      {/* Card Info */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, paddingTop: '10px' }}>
        {/* Title */}
        <h3
          style={{
            fontSize: '14px',
            fontWeight: 800,
            color: '#0f172a',
            margin: '0 0 6px',
            lineHeight: 1.35,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          title={item.title}
        >
          <Link to={'/resource/' + item.id} style={{ color: 'inherit', textDecoration: 'none' }}>
            {item.title}
          </Link>
        </h3>

        {/* Source & Level Tonal Pills */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '12px' }}>
          <span
            style={{
              background: '#E6F4F1',
              color: '#0F5E53',
              borderRadius: '6px',
              padding: '2px 8px',
              fontSize: '11px',
              fontWeight: 700,
            }}
          >
            {sourceName}
          </span>
          <span
            style={{
              background: '#f1f5f9',
              color: '#475569',
              borderRadius: '6px',
              padding: '2px 8px',
              fontSize: '11px',
              fontWeight: 600,
            }}
          >
            {levelText}
          </span>
        </div>

        {/* Action Buttons: Solid Teal Read PDF + Tonal Details */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            marginTop: 'auto',
          }}
        >
          <Link
            to={'/read/' + item.id}
            style={{
              background: '#0F5E53',
              color: '#ffffff',
              borderRadius: '8px',
              padding: '8px 12px',
              fontSize: '12px',
              fontWeight: 700,
              textDecoration: 'none',
              textAlign: 'center',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s ease',
            }}
          >
            Read PDF
          </Link>
          <Link
            to={'/resource/' + item.id}
            style={{
              background: '#f1f5f9',
              color: '#334155',
              borderRadius: '8px',
              padding: '8px 12px',
              fontSize: '12px',
              fontWeight: 700,
              textDecoration: 'none',
              textAlign: 'center',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s ease',
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

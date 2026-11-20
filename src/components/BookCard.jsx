import React from 'react';
import { Link } from 'react-router-dom';
import { BookCover } from './BookCover';

export function BookCard({ item, isSaved, onSaveToggle, style }) {
  const sourceName = item.author || item.source || 'NCERT';
  const levelText = item.level || (item.classNum ? `Class ${item.classNum}` : 'Class 12');

  // Specific level badge styles matching the mockup
  let levelBg = '#e0f2fe';
  let levelColor = '#0369a1';
  let avatarBg = '#0284c7';

  const sLower = ((item.title || '') + ' ' + (item.subject || '') + ' ' + sourceName).toLowerCase();

  if (sLower.includes('chem') || levelText.includes('11')) {
    levelBg = '#ffedd5';
    levelColor = '#c2410c';
    avatarBg = '#ea580c';
  } else if (sLower.includes('bio') || sLower.includes('cs50') || sourceName.includes('David')) {
    levelBg = '#dcfce7';
    levelColor = '#15803d';
    avatarBg = '#16a34a';
  }

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
        padding: '10px',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
    >
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
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: avatarBg,
                color: '#ffffff',
                fontSize: '10px',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {sourceName.slice(0, 1).toUpperCase()}
            </span>
            <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#475569' }}>
              {sourceName}
            </span>
          </div>

          <span
            style={{
              background: levelBg,
              color: levelColor,
              borderRadius: '6px',
              padding: '2px 8px',
              fontSize: '10.5px',
              fontWeight: 700,
              marginLeft: 'auto',
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
            gap: '6px',
            marginTop: 'auto',
          }}
        >
          <Link
            to={'/read/' + item.id}
            style={{
              background: '#0F5E53',
              color: '#ffffff',
              borderRadius: '8px',
              padding: '7px 6px',
              fontSize: '11px',
              fontWeight: 700,
              textAlign: 'center',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 6px rgba(15, 94, 83, 0.2)',
              transition: 'background 0.15s ease',
            }}
          >
            Read PDF
          </Link>
          <Link
            to={'/resource/' + item.id}
            style={{
              background: '#F1F5F4',
              color: '#475569',
              borderRadius: '8px',
              padding: '7px 6px',
              fontSize: '11px',
              fontWeight: 600,
              textAlign: 'center',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
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

import React from 'react';
import { Link } from 'react-router-dom';
import { BookCover } from './BookCover';
import { useAuth } from '../context/AuthContext';
import { triggerAuthPrompt } from '../utils/authPrompt';

export function BookCard({ item, isSaved, onSaveToggle, style }) {
  const { isLoggedIn } = useAuth();
  const sourceName = item.author || item.source || 'NCERT';
  const levelText = item.level || (item.classNum ? `Class ${item.classNum}` : (item.grade ? `Class ${item.grade}` : (item.tier || 'NCERT')));

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
      <div style={{ position: 'relative' }}>
        <Link to={'/read/' + item.id} style={{ display: 'block', textDecoration: 'none' }}>
          <BookCover item={item} />
        </Link>
        {onSaveToggle && (
          <button
            type="button"
            className={`card-bookmark-btn ${isSaved ? 'saved' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!isLoggedIn) {
                triggerAuthPrompt({
                  feature: 'Save to My Library',
                  title: 'Sign In to Save Books',
                  message: 'Please sign in or create an account to save books to your personal library and access them across all your devices.',
                  from: window.location.pathname,
                });
                return;
              }
              onSaveToggle(item.id);
            }}
            title={isSaved ? 'In My Library (Click to remove)' : 'Save to My Library'}
            aria-label={isSaved ? 'In My Library' : 'Save to My Library'}
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              zIndex: 3,
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: isSaved ? '#0F5E53' : 'rgba(255, 255, 255, 0.92)',
              color: isSaved ? '#ffffff' : '#475569',
              border: isSaved ? '1px solid #0F5E53' : '1px solid rgba(0, 0, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              backdropFilter: 'blur(4px)',
              padding: 0,
              transition: 'all 0.15s ease',
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill={isSaved ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>
        )}
      </div>

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

        {/* Author / Subject Row matching mockup */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '12px' }}>
          <span style={{ fontSize: '11px', color: '#64748b' }}>👤</span>
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Author {sourceName} {item.subject ? `| ${item.subject}` : ''}
          </span>
        </div>

        {/* Action Buttons: Solid Teal Read PDF + Tonal Details */}
        <div
          className="book-card-actions"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '6px',
            marginTop: 'auto',
          }}
        >
          <Link
            to={'/read/' + item.id}
            className="book-card-btn-read"
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
            className="book-card-btn-details"
            style={{
              background: '#E8F4F0',
              color: '#0F5E53',
              borderRadius: '8px',
              padding: '7px 6px',
              fontSize: '11px',
              fontWeight: 700,
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

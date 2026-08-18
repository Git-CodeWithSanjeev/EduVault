import React from 'react';
import { Link } from 'react-router-dom';
import { BookCover } from './BookCover';
import { ExternalLink } from './Cards';

export function BookCard({ item, isSaved, onSaveToggle, style }) {
  return (
    <article className="resource" style={style}>
      <BookCover item={item} />
      <div className="resource-info">
        <div className="badges">
          <span className="badge-license">{item.license}</span>
          <button
            className={`wishlist-btn ${isSaved ? 'saved' : ''}`}
            onClick={() => onSaveToggle(item.id)}
            title={isSaved ? 'Remove from wishlist' : 'Save to wishlist'}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span>{isSaved ? 'Saved' : 'Save'}</span>
          </button>
        </div>
        <h3>{item.title}</h3>
        <p>{item.description}</p>
        <small>
          {item.level}
          {item.medium ? ` · ${item.medium}` : ''}
        </small>
        <div className="actions">
          <Link className="detail read-btn" to={'/read/' + item.id}>
            Read PDF
          </Link>
          <div className="actions-sub">
            <Link className="detail" to={'/resource/' + item.id}>
              Details
            </Link>
            <ExternalLink item={item} className="detail external-btn">
              {item.source === 'NCERT' ? 'Download' : 'Open'}
            </ExternalLink>
          </div>
        </div>
      </div>
    </article>
  );
}

export default BookCard;

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
          >
            {isSaved ? '★ Saved' : '☆ Save'}
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
          <Link className="detail" to={'/resource/' + item.id}>
            Details
          </Link>
          <ExternalLink item={item} className="detail external-btn">
            {item.source === 'NCERT' ? 'Download ↗' : 'Open ↗'}
          </ExternalLink>
        </div>
      </div>
    </article>
  );
}

export default BookCard;

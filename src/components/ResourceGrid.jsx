import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookCard } from './BookCard';

export function ExternalLink({ item, children, className }) {
  return (
    <Link to={'/go/' + item.id} className={className}>
      {children}
    </Link>
  );
}

export function Cards({ list = [], saved = [], toggle, initialCount = 16, pageSize = 16 }) {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [displayCount, setDisplayCount] = React.useState(initialCount);

  // Reset display count when the list changes (e.g. user changes class or subject filter)
  React.useEffect(() => {
    setDisplayCount(initialCount);
  }, [list, initialCount]);

  const handleSave = (id) => {
    if (toggle) toggle(id);
  };

  const visibleList = list.slice(0, displayCount);
  const hasMore = displayCount < list.length;

  return (
    <div className="cards-paginated-container" style={{ width: '100%' }}>
      <div className="resource-grid">
        {visibleList.map((b) => (
          <BookCard
            key={b.id}
            item={b}
            isSaved={saved.includes(b.id)}
            onSaveToggle={handleSave}
          />
        ))}
      </div>

      {hasMore && (
        <div style={{ textAlign: 'center', marginTop: '28px', marginBottom: '24px' }}>
          <button
            type="button"
            onClick={() => setDisplayCount((prev) => prev + pageSize)}
            className="load-more-btn"
            style={{
              padding: '12px 28px',
              borderRadius: '99px',
              border: '1.5px solid rgba(13, 148, 136, 0.3)',
              background: '#ffffff',
              color: 'var(--p-dark, #0f5e53)',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(13, 148, 136, 0.08)',
              transition: 'all 0.2s ease',
            }}
          >
            <span>Load More Books</span>
            <span style={{ fontSize: '12px', opacity: 0.75, fontWeight: 500 }}>
              (Showing {visibleList.length} of {list.length})
            </span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

export default Cards;

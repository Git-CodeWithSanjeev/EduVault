'use client';

import React from 'react';
import { useParams, Link, useNavigate } from '../utils/routerCompat';
import { items } from '../data/openItems';
import { ExternalLink } from '../components/ResourceGrid';
import { useAuth } from '../context/AuthContext';
import { triggerAuthPrompt } from '../utils/authPrompt';

export function Detail({ saved = [], toggle = () => {} }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const b = items.find((x) => x.id === id);
  const isSaved = Array.isArray(saved) && b && saved.includes(b.id);

  const handleToggleSaved = () => {
    if (!b || !toggle) return;
    if (!isLoggedIn) {
      triggerAuthPrompt({
        feature: 'Save to My Library',
        title: 'Sign In to Save Books',
        message: 'Please sign in or create an account to save books to your personal library and access them across all your devices.',
        from: `/resource/${b.id}`,
      });
      return;
    }
    toggle(b.id);
  };

  const handleBack = (e) => {
    e.preventDefault();
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/library');
    }
  };

  if (!b) {
    return (
      <section className="page empty">
        Resource not found. <Link to="/library">Back to library</Link>
      </section>
    );
  }

  return (
    <section className="page detail-page">
      <a href="/library" onClick={handleBack} className="back">
        ← Back to previous page
      </a>

      <p className="eyebrow">
        {b.source} · {b.license}
      </p>
      <h1>{b.title}</h1>
      <p className="intro">{b.description}</p>
      <dl>
        <dt>Type</dt>
        <dd>{b.type}</dd>
        <dt>Subject</dt>
        <dd>{b.subject}</dd>
        <dt>Level</dt>
        <dd>{b.level}</dd>
        {b.authors && (
          <>
            <dt>Author(s)</dt>
            <dd>{b.authors}</dd>
          </>
        )}
        {b.firstPublishYear && (
          <>
            <dt>First Published</dt>
            <dd>{b.firstPublishYear}</dd>
          </>
        )}
        {b.medium && (
          <>
            <dt>Medium</dt>
            <dd>{b.medium}</dd>
          </>
        )}
        <dt>Hosting</dt>
        <dd>{b.source === 'Open Library' ? 'Internet Archive & Open Library' : 'Official external source'}</dd>
      </dl>
      <div className="detail-actions flex flex-wrap items-center gap-3">
        <Link className="detail-button detail-primary-cta inline-flex h-10 items-center whitespace-nowrap" to={'/read/' + b.id}>
          📖 Read PDF on EduVault
        </Link>
        <button
          type="button"
          className={`detail-button-secondary inline-flex h-10 items-center whitespace-nowrap ${isSaved ? 'saved-active' : ''}`}
          onClick={handleToggleSaved}
          style={isSaved ? { background: '#E6F4F1', color: '#0F5E53', borderColor: '#0F5E53', fontWeight: 700 } : {}}
        >
          {isSaved ? '✓ In My Library' : '＋ Save to my library'}
        </button>
        <ExternalLink item={b} className="detail-button-secondary inline-flex h-10 items-center whitespace-nowrap">
          {b.source === 'NCERT' ? 'Download from NCERT ↗' : (b.source === 'Open Library' ? 'Open on Open Library ↗' : 'Read at official source ↗')}
        </ExternalLink>
        {b.catalog && (
          <Link to="/go/ncert-catalog" className="detail-button-ghost inline-flex h-10 items-center whitespace-nowrap text-sm font-semibold">
            Browse NCERT catalog →
          </Link>
        )}
      </div>
    </section>
  );
}

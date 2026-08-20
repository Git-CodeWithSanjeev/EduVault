import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { items } from '../data/openItems';
import { ExternalLink } from '../components/ResourceGrid';
import { useAuth } from '../context/AuthContext';

export function Detail({ saved = [], toggle = () => {} }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const b = items.find((x) => x.id === id);

  const handleToggleSaved = () => {
    if (!isLoggedIn) {
      navigate('/login');
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
        {b.medium && (
          <>
            <dt>Medium</dt>
            <dd>{b.medium}</dd>
          </>
        )}
        <dt>Hosting</dt>
        <dd>Official external source</dd>
      </dl>
      <div className="detail-actions">
        <Link className="detail-button" style={{ background: 'var(--p-gradient)', textDecoration: 'none' }} to={'/read/' + b.id}>
          📖 Read PDF on EduVault
        </Link>
        <button onClick={handleToggleSaved}>
          {saved.includes(b.id) ? 'Remove from saved' : 'Save to my library'}
        </button>
        <ExternalLink item={b}>
          {b.source === 'NCERT' ? 'Download from NCERT ↗' : 'Read at official source ↗'}
        </ExternalLink>
        {b.catalog && (
          <Link to="/go/ncert-catalog">Browse NCERT catalog</Link>
        )}
      </div>
    </section>
  );
}

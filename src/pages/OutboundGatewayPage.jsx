import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { items } from '../data/openItems';

export function Outbound() {
  const { id } = useParams();
  const b = items.find((x) => x.id === id);
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    if (b) {
      const current = JSON.parse(localStorage.getItem('eduvault-recent') || '[]');
      const updated = [b.id, ...current.filter((x) => x !== b.id)].slice(0, 6);
      localStorage.setItem('eduvault-recent', JSON.stringify(updated));
    }
  }, [b]);

  if (!b) {
    return (
      <section className="page empty outbound">
        Link not found. <Link to="/library">Back to library</Link>
      </section>
    );
  }

  const openExternal = () => {
    sessionStorage.setItem('eduvault-left', '1');
    window.open(b.url, '_blank', 'noopener,noreferrer');
    setOpened(true);
  };

  const host = (() => {
    try {
      return new URL(b.url).hostname.replace('www.', '');
    } catch {
      return b.source;
    }
  })();

  return (
    <section className="page outbound">
      <p className="eyebrow">LEAVING EDUVAULT</p>
      <h2>Open on {b.source}?</h2>
      <p className="intro">
        You are about to visit <strong>{host}</strong> for <strong>{b.title}</strong>.
        This tab stays on EduVault so you can come back anytime.
      </p>
      <div className="outbound-card">
        <small>{b.source}</small>
        <h3>{b.title}</h3>
        <p>{b.description}</p>
      </div>
      <div className="outbound-actions">
        <button type="button" onClick={openExternal}>
          {b.source === 'NCERT' ? 'Download on NCERT ↗' : 'Open official site ↗'}
        </button>
        <Link className="outline-btn" to={'/resource/' + b.id}>
          ← Back to details
        </Link>
        <Link className="outline-btn" to="/library">
          ← Back to library
        </Link>
      </div>
      {opened ? (
        <p className="outbound-tip success">
          Opened in a new tab. Switch back here to browse more books or check your saved
          library.
        </p>
      ) : (
        <p className="outbound-tip">
          Tip: keep this EduVault tab open. Use your browser tab bar to return after
          downloading.
        </p>
      )}
    </section>
  );
}

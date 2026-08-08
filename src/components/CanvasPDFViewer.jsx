import React, { useState, useEffect, useRef } from 'react';

// Priority: VITE_PROXY_URL env -> /api/proxy (Vercel Serverless Function) -> localhost:3001 (Local Dev)
const PROXY_BASE = import.meta.env.VITE_PROXY_URL || (import.meta.env.DEV ? 'http://localhost:3001/pdf/proxy' : '/api/proxy');

/** Build the backend proxy URL */
function proxyUrl(originalUrl) {
  if (!originalUrl) return '';
  if (originalUrl.startsWith('http://localhost:3001') || originalUrl.startsWith('/api/proxy')) return originalUrl;
  return `${PROXY_BASE}?url=${encodeURIComponent(originalUrl)}`;
}

/* ─── Full-Page Download Overlay ──────────────────────────────────────────── */
function DownloadOverlay({ filename, progress, phase }) {
  if (phase === 'idle') return null;

  const isDone  = phase === 'done';
  const isError = phase === 'error';

  return (
    <div className="dl-overlay">
      <div className="dl-overlay-card">
        {/* Icon */}
        <div className={`dl-overlay-icon ${isDone ? 'done' : isError ? 'error' : ''}`}>
          {isDone  ? '✅' : isError ? '❌' : (
            <svg viewBox="0 0 44 44" fill="none" className="dl-circle-svg">
              <circle cx="22" cy="22" r="18" stroke="#2e2e46" strokeWidth="4" />
              <circle
                cx="22" cy="22" r="18"
                stroke="#9b8bf4"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 18}`}
                strokeDashoffset={`${2 * Math.PI * 18 * (1 - progress / 100)}`}
                style={{ transition: 'stroke-dashoffset 0.25s ease', transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
              />
              <text x="22" y="27" textAnchor="middle" fill="#c5b8ff" fontSize="10" fontWeight="700">
                {Math.round(progress)}%
              </text>
            </svg>
          )}
        </div>

        {/* Labels */}
        <div className="dl-overlay-label">
          {isDone  ? 'Download complete!' :
           isError ? 'Download failed — try again' :
                     'Preparing your PDF…'}
        </div>
        <div className="dl-overlay-filename">{filename}</div>

        {/* Progress bar strip */}
        {!isDone && !isError && (
          <div className="dl-overlay-bar-track">
            <div className="dl-overlay-bar-fill" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Animated Download Button ─────────────────────────────────────────────── */
export function DownloadPDFButton({ url, filename, label = '📥 Download PDF', className = 'pdf-btn' }) {
  const [phase, setPhase]       = useState('idle'); // idle | fetching | done | error
  const [progress, setProgress] = useState(0);
  const abortRef = useRef(null);

  const handleDownload = async (e) => {
    e.preventDefault();
    if (phase === 'fetching') return;

    setPhase('fetching');
    setProgress(0);

    // Smooth progress ticker up to 88% while fetching
    const ticker = setInterval(() => {
      setProgress((p) => (p < 88 ? p + Math.random() * 5 : p));
    }, 180);

    abortRef.current = new AbortController();

    try {
      const res = await fetch(proxyUrl(url), { signal: abortRef.current.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const blob = await res.blob();
      clearInterval(ticker);
      setProgress(100);

      // Trigger real file save
      const blobUrl = URL.createObjectURL(blob);
      const a       = document.createElement('a');
      a.href        = blobUrl;
      a.download    = filename || url.split('/').pop() || 'document.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 6000);

      setPhase('done');
      setTimeout(() => { setPhase('idle'); setProgress(0); }, 2800);
    } catch (err) {
      clearInterval(ticker);
      if (err.name !== 'AbortError') {
        setPhase('error');
        setTimeout(() => { setPhase('idle'); setProgress(0); }, 3200);
      }
    }
  };

  const btnLabel = {
    idle:     label,
    fetching: '⏳ Downloading…',
    done:     '✅ Downloaded!',
    error:    '❌ Try Again',
  }[phase];

  const btnClass = {
    idle: '', fetching: 'downloading', done: 'dl-done', error: 'dl-error',
  }[phase];

  const dlFilename = filename || url.split('/').pop() || 'document.pdf';

  return (
    <>
      {/* Full-page overlay — renders at document root level via the component */}
      <DownloadOverlay filename={dlFilename} progress={progress} phase={phase} />

      <button
        onClick={handleDownload}
        className={`${className} ${btnClass}`}
        disabled={phase === 'fetching'}
        style={{ position: 'relative', overflow: 'hidden', minWidth: '130px' }}
      >
        {phase === 'fetching' && (
          <span className="dl-progress-bar" style={{ width: `${progress}%` }} />
        )}
        {phase === 'done' && <span className="dl-shimmer" />}
        <span style={{ position: 'relative', zIndex: 1 }}>{btnLabel}</span>
      </button>
    </>
  );
}

/* ─── PDF Viewer (native browser renderer via proxy) ──────────────────────── */
export function CanvasPDFViewer({ url, title }) {
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const proxied = proxyUrl(url);

  useEffect(() => { setStatus('loading'); }, [url]);

  return (
    <div className="pdf-viewer-root">
      {/* Mini top bar */}
      <div className="pdf-viewer-topbar">
        <span className="pdf-viewer-title">📄 {title}</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <DownloadPDFButton url={url} filename={title + '.pdf'} label="📥 Download" className="pdf-btn" />
          <a href={url} target="_blank" rel="noopener noreferrer" className="pdf-btn secondary" style={{ padding: '4px 12px', fontSize: '11px' }}>
            ↗ Open
          </a>
        </div>
      </div>

      {/* Viewer area */}
      <div className="pdf-viewer-stage">
        {status === 'loading' && (
          <div className="pdf-loading-overlay">
            <div className="pdf-spinner" />
            <span>Loading PDF from server…</span>
          </div>
        )}
        {status === 'error' && (
          <div className="pdf-loading-overlay">
            <span style={{ fontSize: '32px' }}>⚠️</span>
            <span style={{ fontWeight: 700 }}>Could not render PDF</span>
            <a href={url} target="_blank" rel="noopener noreferrer" className="pdf-btn" style={{ marginTop: '8px' }}>
              Open Directly ↗
            </a>
          </div>
        )}
        <embed
          key={proxied}
          src={proxied}
          type="application/pdf"
          className="pdf-embed"
          style={{ display: status === 'error' ? 'none' : 'block' }}
          onLoad={() => setStatus('ready')}
          onError={() => setStatus('error')}
        />
      </div>
    </div>
  );
}

export default CanvasPDFViewer;

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { items } from '../data/openItems';
import { EmbedPdfViewer } from './EmbedPdfViewer';
import { getChapterPdfUrls, proxyUrl } from '../utils/pdfHelpers';

export { getChapterPdfUrls };

/** Self-contained direct Cloudflare R2 download button with CORS streaming proxy */
export function DownloadPDFButton({ url, cloudUrl, filename, label, className = 'pdf-btn' }) {
  const [phase, setPhase] = useState('idle');

  const handleDownload = async (e) => {
    e.preventDefault();
    if (phase === 'fetching') return;
    setPhase('fetching');

    try {
      const rawTarget = cloudUrl || url;
      const target = proxyUrl(rawTarget);
      const res = await fetch(target);
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename || (rawTarget ? rawTarget.split('/').pop() : 'document.pdf');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
      setPhase('done');
      setTimeout(() => setPhase('idle'), 2500);
    } catch {
      setPhase('error');
      setTimeout(() => setPhase('idle'), 3000);
    }
  };

  return (
    <button onClick={handleDownload} className={className} disabled={phase === 'fetching'}>
      {phase === 'fetching' ? 'Downloading…' : phase === 'done' ? 'Downloaded!' : (label || 'Download PDF')}
    </button>
  );
}

export function PDFReader({ saved = [], toggle = () => { } }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const normalizedId = id ? id.trim().replace(/\s+/g, '-') : '';
  const b = items.find((x) => x.id === id || x.id === normalizedId);

  const handleBack = (e) => {
    e.preventDefault();
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/library');
    }
  };

  const [activeChapIdx, setActiveChapIdx] = useState(0);
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  const [isChapterDrawerOpen, setIsChapterDrawerOpen] = useState(false);

  const handleToggleFullscreen = () => {
    const stage = document.querySelector('.reader-stage-container') || document.documentElement;
    if (!document.fullscreenElement) {
      stage.requestFullscreen().catch(() => { });
    } else {
      document.exitFullscreen().catch(() => { });
    }
  };

  // Screen resize tracking
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Track recently opened books
  useEffect(() => {
    if (!b) return;
    try {
      const prev = JSON.parse(localStorage.getItem('eduvault-recent') || '[]');
      const updated = [b.id, ...prev.filter((x) => x !== b.id)].slice(0, 6);
      localStorage.setItem('eduvault-recent', JSON.stringify(updated));
    } catch (_) { }
  }, [b?.id]);

  if (!b) {
    return (
      <section className="page empty" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <h2>Book Not Found</h2>
        <p style={{ color: 'var(--muted)', marginTop: '8px' }}>
          The requested textbook could not be found in EduVault library archive.
        </p>
        <Link to="/library" className="pdf-btn" style={{ marginTop: '16px', display: 'inline-block' }}>
          ← Back to Library
        </Link>
      </section>
    );
  }

  const chapterPdfs = getChapterPdfUrls(b);
  const activeChapter = chapterPdfs[activeChapIdx] ?? chapterPdfs[0];
  const isSaved = Array.isArray(saved) && saved.includes(b.id);

  const handlePrevChapter = () => {
    if (activeChapIdx > 0) setActiveChapIdx(activeChapIdx - 1);
  };

  const handleNextChapter = () => {
    if (activeChapIdx < chapterPdfs.length - 1) setActiveChapIdx(activeChapIdx + 1);
  };

  return (
    <div className={`pdf-reader-fullscreen-shell ${isMobile ? 'is-mobile-screen' : ''}`}>

      {/* ─── 1. DESKTOP READER HEADER (Desktop Only) ─── */}
      {!isMobile && (
        <header className="desktop-reader-toolbar">
          <div className="reader-toolbar-left">
            <a href="/library" onClick={handleBack} className="reader-back-btn">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              <span>Library</span>
            </a>
            <div className="reader-toolbar-divider" />
            <div className="reader-toolbar-bookinfo">
              <span className="reader-book-title" title={b.title}>{b.title}</span>
              <span className="reader-chap-badge">{activeChapter.name}</span>
            </div>
          </div>

          {/* Center Chapter Navigation */}
          <div className="reader-toolbar-center">
            {chapterPdfs.length > 1 && (
              <div className="reader-page-nav-pill">
                <button
                  type="button"
                  className="reader-tool-btn"
                  onClick={handlePrevChapter}
                  disabled={activeChapIdx <= 0}
                  title="Previous Chapter"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <span className="reader-zoom-text" style={{ fontSize: '11px', fontWeight: 700, padding: '0 8px', whiteSpace: 'nowrap' }}>
                  Chapter {activeChapIdx + 1} of {chapterPdfs.length}
                </span>
                <button
                  type="button"
                  className="reader-tool-btn"
                  onClick={handleNextChapter}
                  disabled={activeChapIdx >= chapterPdfs.length - 1}
                  title="Next Chapter"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          <div className="reader-toolbar-right">
            {/* Fullscreen Toggle */}
            <button
              type="button"
              className="reader-icon-btn"
              onClick={handleToggleFullscreen}
              title="Toggle Fullscreen"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
              </svg>
            </button>

            {/* Save Book */}
            <button
              type="button"
              className={`reader-save-btn ${isSaved ? 'saved' : ''}`}
              onClick={() => toggle && toggle(b.id)}
              title={isSaved ? 'Saved to Library' : 'Save Book'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span>{isSaved ? 'Saved' : 'Save'}</span>
            </button>
          </div>
        </header>
      )}

      {/* ─── 2. MOBILE HEADER (Mobile Only) ─── */}
      {isMobile && (
        <div className="mobile-reader-header">
          <a href="/library" onClick={handleBack} className="mobile-back-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span>Library</span>
          </a>

          <div className="mobile-book-info">
            <h4 title={b.title}>{b.title}</h4>
            <span className="mobile-active-chap-badge">{activeChapter.name}</span>
          </div>

          <button
            className="mobile-chapter-menu-btn"
            onClick={() => setIsChapterDrawerOpen(true)}
          >
            <span>📖</span>
            <span>Chapters ({chapterPdfs.length})</span>
          </button>
        </div>
      )}

      {/* ─── 2. MOBILE CHAPTER STRIP ─── */}
      {isMobile && chapterPdfs.length > 1 && (
        <div className="mobile-chap-pill-strip">
          {chapterPdfs.map((ch, idx) => (
            <button
              key={ch.id}
              className={`mobile-chap-pill ${activeChapIdx === idx ? 'active' : ''}`}
              onClick={() => setActiveChapIdx(idx)}
            >
              {ch.name}
            </button>
          ))}
        </div>
      )}

      {/* ─── 3. MAIN READER BODY ─── */}
      <div className="reader-body-layout">
        {/* Stage Viewport with EmbedPDF WASM Viewer */}
        <div className="reader-stage-container">
          <EmbedPdfViewer
            key={`embed-${activeChapter.pdfUrl}-${activeChapter.cloudUrl || ''}`}
            url={activeChapter.pdfUrl}
            cloudUrl={activeChapter.cloudUrl}
            title={`${b.title} - ${activeChapter.name}`}
            theme="light"
          />
        </div>

        {/* Desktop Chapter Sidebar */}
        {!isMobile && (
          <div className="reader-sidebar">
            <div className="reader-sidebar-title">
              <span>CHAPTERS</span>
              <span className="sidebar-count-badge">{chapterPdfs.length} PDFs</span>
            </div>

            <div className="chapter-list-scroll" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '5px', padding: '10px' }}>
              {chapterPdfs.map((ch, idx) => (
                <div
                  key={ch.id}
                  className={`chapter-nav-item ${activeChapIdx === idx ? 'active' : ''}`}
                  onClick={() => setActiveChapIdx(idx)}
                >
                  <span className="chapter-nav-name">{ch.name}</span>
                  <span className="chapter-badge">PDF</span>
                </div>
              ))}
            </div>

            {/* Sidebar Quick Action Buttons (Download, Save) */}
            <div className="sidebar-actions-panel" style={{ marginTop: 'auto', padding: '10px', borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <DownloadPDFButton
                url={activeChapter.pdfUrl}
                cloudUrl={activeChapter.cloudUrl}
                filename={`${b.title} - ${activeChapter.name}.pdf`}
              />

              <button
                className={`sidebar-btn-save ${isSaved ? 'saved' : ''}`}
                onClick={() => toggle && toggle(b.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '99px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: isSaved ? '1px solid #0d9488' : '1px solid #cbd5e1',
                  background: isSaved ? '#f0fdf9' : '#ffffff',
                  color: isSaved ? '#0f766e' : '#334155',
                  transition: 'all 0.2s ease',
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
                <span>{isSaved ? 'Saved to Library' : 'Save Book'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── 4. MOBILE CHAPTER DRAWER ─── */}
      {isMobile && isChapterDrawerOpen && (
        <div className="mobile-chapter-drawer-overlay" onClick={() => setIsChapterDrawerOpen(false)}>
          <div className="mobile-chapter-drawer-content" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h3>Chapters ({chapterPdfs.length})</h3>
              <button
                className="drawer-close-btn"
                onClick={() => setIsChapterDrawerOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="drawer-chapter-list">
              {chapterPdfs.map((ch, idx) => (
                <div
                  key={ch.id}
                  className={`drawer-chapter-item ${activeChapIdx === idx ? 'active' : ''}`}
                  onClick={() => {
                    setActiveChapIdx(idx);
                    setIsChapterDrawerOpen(false);
                  }}
                >
                  <span className="drawer-chap-index">#{idx + 1}</span>
                  <span className="drawer-chap-name">{ch.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PDFReader;

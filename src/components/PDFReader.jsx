import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { items } from '../data/openItems';
import { CanvasPDFViewer, DownloadPDFButton } from './CanvasPDFViewer';
import { getChapterPdfUrls } from '../utils/pdfHelpers';

export { getChapterPdfUrls };

export function PDFReader({ saved, toggle }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const b = items.find((x) => x.id === id);

  const handleBack = (e) => {
    e.preventDefault();
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/library');
    }
  };

  const [activeChapIdx, setActiveChapIdx] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isChapterDrawerOpen, setIsChapterDrawerOpen] = useState(false);

  // Screen resize tracking
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Track recently opened books
  useEffect(() => {
    if (!b) return;
    const prev = JSON.parse(localStorage.getItem('eduvault-recent') || '[]');
    const updated = [b.id, ...prev.filter((x) => x !== b.id)].slice(0, 6);
    localStorage.setItem('eduvault-recent', JSON.stringify(updated));
  }, [b?.id]);

  if (!b) {
    return (
      <section className="page empty">
        Book not found. <Link to="/library">Back to library</Link>
      </section>
    );
  }

  const chapterPdfs   = getChapterPdfUrls(b);
  const activeChapter = chapterPdfs[activeChapIdx] ?? chapterPdfs[0];

  return (
    <div className={`pdf-reader-fullscreen-shell ${isMobile ? 'is-mobile-screen' : ''}`}>

      {/* ─── 2. BOOK INFORMATION BAR (Fixed Header Row) ─── */}
      {isMobile ? (
        <div className="mobile-reader-header">
          <a href="/library" onClick={handleBack} className="mobile-back-btn">
            ‹ Library
          </a>

          <div className="mobile-book-info">
            <h4 title={b.title}>{b.title}</h4>
            <span className="mobile-active-chap-badge">{activeChapter.name}</span>
          </div>

          <button
            className="mobile-chapter-menu-btn"
            onClick={() => setIsChapterDrawerOpen(true)}
          >
            📖 Chapters ({chapterPdfs.length})
          </button>
        </div>
      ) : (
        <div className="pdf-toolbar">
          <div className="pdf-toolbar-header">
            <a href="/library" onClick={handleBack} className="pdf-btn secondary">← Library</a>
            <div className="pdf-toolbar-info">
              <h3 title={b.title}>{b.title}</h3>
              <small style={{ color: '#94a3b8', fontSize: '12px' }}>
                {b.source} · {b.subject || 'General'} · <span className="active-chap-tag">{activeChapter.name}</span>
              </small>
            </div>
          </div>

          <div className="pdf-toolbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              className={`pdf-btn secondary ${saved.includes(b.id) ? 'saved' : ''}`}
              onClick={() => toggle(b.id)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '7px' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill={saved.includes(b.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span>{saved.includes(b.id) ? 'Saved' : 'Save'}</span>
            </button>
            <DownloadPDFButton
              url={activeChapter.pdfUrl}
              filename={`${b.title} - ${activeChapter.name}.pdf`}
            />
          </div>
        </div>
      )}

      {/* ─── MOBILE CHAPTER STRIP ─── */}
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

      {/* ─── 3. READER BODY LAYOUT ─── */}
      <div className="reader-body-layout">
        {/* PDF Stage Viewport Container */}
        <div className="reader-stage-container">
          <CanvasPDFViewer
            key={activeChapter.pdfUrl}
            url={activeChapter.pdfUrl}
            title={activeChapter.name}
            isMobile={isMobile}
          />
        </div>

        {/* Fixed Desktop Chapter Sidebar */}
        {!isMobile && (
          <div className="reader-sidebar">
            <div className="reader-sidebar-title">
              <span>CHAPTERS</span>
              <span className="sidebar-count-badge">
                {chapterPdfs.length} PDFs
              </span>
            </div>

            <div className="chapter-list-scroll">
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

            <div className="sidebar-footer-archive">
              <div className="archive-title">Official Archive</div>
              <Link
                to={`/go/${b.id}`}
                className="archive-download-btn"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '7px' }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>Download Full Zip ↗</span>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* ─── MOBILE BOTTOM NAVIGATION BAR ─── */}
      {isMobile && (
        <div className="mobile-reader-bottombar">
          <button
            className="mobile-bottom-btn"
            onClick={() => setIsChapterDrawerOpen(true)}
          >
            📖 Chapters
          </button>
          <button
            className={`mobile-bottom-btn ${saved.includes(b.id) ? 'saved' : ''}`}
            onClick={() => toggle(b.id)}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill={saved.includes(b.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span>{saved.includes(b.id) ? 'Saved' : 'Save'}</span>
          </button>
          <div className="mobile-bottom-dl">
            <DownloadPDFButton
              url={activeChapter.pdfUrl}
              filename={`${b.title} - ${activeChapter.name}.pdf`}
              className="pdf-btn"
            />
          </div>
        </div>
      )}

      {/* ─── MOBILE CHAPTER DRAWER SHEET ─── */}
      {isMobile && isChapterDrawerOpen && (
        <div className="mobile-chapter-sheet-backdrop" onClick={() => setIsChapterDrawerOpen(false)}>
          <div className="mobile-chapter-sheet-card" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-sheet-header">
              <div className="mobile-sheet-title">
                <h3>📚 Select Chapter</h3>
                <small>{b.title}</small>
              </div>
              <button
                className="mobile-sheet-close"
                onClick={() => setIsChapterDrawerOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="mobile-sheet-list">
              {chapterPdfs.map((ch, idx) => (
                <button
                  key={ch.id}
                  className={`mobile-sheet-item ${activeChapIdx === idx ? 'active' : ''}`}
                  onClick={() => {
                    setActiveChapIdx(idx);
                    setIsChapterDrawerOpen(false);
                  }}
                >
                  <span className="mobile-sheet-item-name">{ch.name}</span>
                  {activeChapIdx === idx ? (
                    <span className="mobile-sheet-active-tag">Reading Now</span>
                  ) : (
                    <span className="mobile-sheet-pdf-tag">PDF</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PDFReader;

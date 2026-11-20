import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { items } from '../data/openItems';
import { AdobePDFViewer, DownloadPDFButton } from './AdobePDFViewer';
import { PdfJsViewer } from './PdfJsViewer';
import { getChapterPdfUrls } from '../utils/pdfHelpers';

export { getChapterPdfUrls };

export function PDFReader({ saved = [], toggle = () => {} }) {
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

  // Adobe Reader Interactive State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(16);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isPageMenuOpen, setIsPageMenuOpen] = useState(false);
  const [pageViewMode, setPageViewMode] = useState('single'); // 'single' | 'two-page'
  const [fitMode, setFitMode] = useState('fit-width'); // 'fit-width' | 'fit-page'
  const [isContinuousScroll, setIsContinuousScroll] = useState(true);
  const apisRef = useRef(null);
  const menuRef = useRef(null);

  // Close popover menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsPageMenuOpen(false);
      }
    };
    if (isPageMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isPageMenuOpen]);

  // Reset page on chapter change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeChapIdx]);

  const handleApiReady = useCallback((payload) => {
    if (!payload) return;
    const { apis, adobeDCView, container } = payload;
    apisRef.current = apis;
    window.__adobeViewerContainer = container;

    if (apis && apis.getPDFMetadata) {
      apis.getPDFMetadata()
        .then((meta) => {
          if (meta && meta.numPages) {
            setTotalPages(meta.numPages);
          }
        })
        .catch(() => {});
    }

    if (adobeDCView && window.AdobeDC?.View?.Enum) {
      try {
        adobeDCView.registerCallback(
          window.AdobeDC.View.Enum.CallbackType.EVENT_LISTENER,
          (event) => {
            if (event.type === 'PAGE_VIEW' && event.data?.pageNumber) {
              setCurrentPage(event.data.pageNumber);
            }
          },
          {
            enablePageZoomEvents: true,
            listenOn: [
              window.AdobeDC.View.Enum.PDFAnalyticsEvents.PAGE_VIEW,
              window.AdobeDC.View.Enum.PDFAnalyticsEvents.DOCUMENT_PAGE_VIEW,
            ],
          }
        );
      } catch (_) {}
    }
  }, []);

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => Math.max(prev - 1, 1));
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    }
  };

  const handlePageInputChange = (e) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val >= 1 && val <= totalPages) {
      setCurrentPage(val);
    }
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(Number((prev + 0.2).toFixed(2)), 3.0));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(Number((prev - 0.2).toFixed(2)), 0.5));
  };

  const handleFitWidth = () => {
    setFitMode('fit-width');
    setZoomLevel(1.0);
  };

  const handleFitPage = () => {
    setFitMode('fit-page');
    setZoomLevel(1.0);
  };

  const handleToggleTwoPage = () => {
    setPageViewMode((prev) => (prev === 'two-page' ? 'single' : 'two-page'));
  };

  const handleToggleFullscreen = () => {
    const stage = document.querySelector('.reader-stage-container') || document.documentElement;
    if (!document.fullscreenElement) {
      stage.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
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
    } catch (_) {}
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

          <div className="reader-toolbar-center">
            {/* Page Navigation */}
            <div className="reader-page-nav-pill">
              <button
                type="button"
                className="reader-tool-btn"
                onClick={handlePrevPage}
                disabled={currentPage <= 1}
                title="Previous Page"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <div className="reader-page-indicator">
                <input
                  type="text"
                  value={currentPage}
                  onChange={handlePageInputChange}
                  className="reader-page-input"
                  aria-label="Current Page"
                />
                <span className="reader-page-total">/ {totalPages || 1}</span>
              </div>
              <button
                type="button"
                className="reader-tool-btn"
                onClick={handleNextPage}
                disabled={currentPage >= totalPages}
                title="Next Page"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="reader-zoom-nav-pill">
              <button
                type="button"
                className="reader-tool-btn"
                onClick={handleZoomOut}
                title="Zoom Out"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
              <span className="reader-zoom-text">{Math.round((zoomLevel || 1) * 100)}%</span>
              <button
                type="button"
                className="reader-tool-btn"
                onClick={handleZoomIn}
                title="Zoom In"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="reader-toolbar-right">
            {/* View Mode Switching */}
            <div className="reader-view-mode-pill">
              <button
                type="button"
                className={`reader-mode-btn ${fitMode === 'fit-width' ? 'active' : ''}`}
                onClick={handleFitWidth}
                title="Fit Width"
              >
                Fit Width
              </button>
              <button
                type="button"
                className={`reader-mode-btn ${fitMode === 'fit-page' ? 'active' : ''}`}
                onClick={handleFitPage}
                title="Fit Page"
              >
                Fit Page
              </button>
              <button
                type="button"
                className={`reader-mode-btn ${pageViewMode === 'two-page' ? 'active' : ''}`}
                onClick={handleToggleTwoPage}
                title="Two-Page Spread"
              >
                2-Up
              </button>
            </div>

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
        {/* Stage Viewport with High-Performance Streaming PDF.js Reader */}
        <div className="reader-stage-container">
          <PdfJsViewer
            key={`${activeChapter.pdfUrl}-${activeChapter.cloudUrl || ''}`}
            url={activeChapter.pdfUrl}
            cloudUrl={activeChapter.cloudUrl}
            title={`${b.title} - ${activeChapter.name}`}
            currentPage={currentPage}
            onTotalPagesChange={(total) => setTotalPages(total)}
            onPageRendered={(page) => setCurrentPage(page)}
            zoomLevel={zoomLevel}
            viewMode={pageViewMode}
            fitMode={fitMode}
            isMobile={isMobile}
            onPrevPage={handlePrevPage}
            onNextPage={handleNextPage}
            nextChapterUrl={chapterPdfs[activeChapIdx + 1]?.cloudUrl || chapterPdfs[activeChapIdx + 1]?.pdfUrl}
          />
        </div>

        {/* Desktop Chapter Sidebar */}
        {!isMobile && (
          <div className="reader-sidebar">
            <div className="reader-sidebar-title">
              <span>CHAPTERS</span>
              <span className="sidebar-count-badge">{chapterPdfs.length} PDFs</span>
            </div>

            <div className="chapter-list-scroll" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
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

            {/* Sidebar Quick Action Buttons (Download, Save, Library) */}
            <div className="sidebar-actions-panel" style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
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

              <a
                href="/library"
                onClick={handleBack}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '99px',
                  fontSize: '12px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  color: '#475569',
                  transition: 'all 0.2s ease',
                }}
              >
                ← Back to Library
              </a>
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

      {/* ─── 4. MOBILE BOTTOM BAR ─── */}
      {isMobile && (
        <div className="mobile-reader-bottombar">
          <button
            className={`mobile-bottom-btn ${isSaved ? 'saved' : ''}`}
            onClick={() => toggle && toggle(b.id)}
          >
            {isSaved ? '★ Saved to Library' : '☆ Save Book'}
          </button>

          <div className="mobile-bottom-dl">
            <DownloadPDFButton
              url={activeChapter.pdfUrl}
              cloudUrl={activeChapter.cloudUrl}
              filename={`${b.title} - ${activeChapter.name}.pdf`}
              className="pdf-btn"
            />
          </div>
        </div>
      )}

      {/* ─── 5. MOBILE CHAPTER DRAWER SHEET ─── */}
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

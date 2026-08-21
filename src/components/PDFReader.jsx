import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { items } from '../data/openItems';
import { AdobePDFViewer, DownloadPDFButton } from './AdobePDFViewer';
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

  const handlePrevPage = async () => {
    if (currentPage > 1) {
      const nextP = currentPage - 1;
      setCurrentPage(nextP);
      if (apisRef.current?.gotoLocation) {
        try {
          await apisRef.current.gotoLocation(nextP);
        } catch (e) {
          console.warn('Adobe gotoLocation error:', e);
        }
      }
    }
  };

  const handleNextPage = async () => {
    if (currentPage < totalPages) {
      const nextP = currentPage + 1;
      setCurrentPage(nextP);
      if (apisRef.current?.gotoLocation) {
        try {
          await apisRef.current.gotoLocation(nextP);
        } catch (e) {
          console.warn('Adobe gotoLocation error:', e);
        }
      }
    }
  };

  const handlePageInputChange = async (e) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val >= 1 && val <= totalPages) {
      setCurrentPage(val);
      if (apisRef.current?.gotoLocation) {
        try {
          await apisRef.current.gotoLocation(val);
        } catch (e) {
          console.warn('Adobe gotoLocation error:', e);
        }
      }
    }
  };

  const handleZoomIn = async () => {
    try {
      if (apisRef.current?.getZoomAPIs) {
        const zoomAPIs = await apisRef.current.getZoomAPIs();
        if (zoomAPIs?.zoomIn) {
          await zoomAPIs.zoomIn();
          return;
        }
      }
      if (apisRef.current?.setZoomLevel) {
        await apisRef.current.setZoomLevel(zoomLevel + 0.25);
        setZoomLevel(prev => prev + 0.25);
      }
    } catch (e) {
      console.warn('Adobe Zoom In notice:', e);
    }
  };

  const handleZoomOut = async () => {
    try {
      if (apisRef.current?.getZoomAPIs) {
        const zoomAPIs = await apisRef.current.getZoomAPIs();
        if (zoomAPIs?.zoomOut) {
          await zoomAPIs.zoomOut();
          return;
        }
      }
      if (apisRef.current?.setZoomLevel) {
        const nextZ = Math.max(zoomLevel - 0.25, 0.5);
        await apisRef.current.setZoomLevel(nextZ);
        setZoomLevel(nextZ);
      }
    } catch (e) {
      console.warn('Adobe Zoom Out notice:', e);
    }
  };

  const handleFitWidth = async () => {
    setFitMode('fit-width');
    try {
      if (apisRef.current?.getZoomAPIs) {
        const zoomAPIs = await apisRef.current.getZoomAPIs();
        if (zoomAPIs?.zoomToFitWidth) {
          await zoomAPIs.zoomToFitWidth();
          return;
        }
      }
      if (apisRef.current?.setZoomLevel) {
        await apisRef.current.setZoomLevel(1.0);
      }
    } catch (e) {
      console.warn('Adobe Fit Width notice:', e);
    }
  };

  const handleFitPage = async () => {
    setFitMode('fit-page');
    try {
      if (apisRef.current?.getZoomAPIs) {
        const zoomAPIs = await apisRef.current.getZoomAPIs();
        if (zoomAPIs?.zoomToFitPage) {
          await zoomAPIs.zoomToFitPage();
          return;
        }
      }
    } catch (e) {
      console.warn('Adobe Fit Page notice:', e);
    }
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

      {/* ─── 1. MOBILE HEADER (Mobile Only) ─── */}
      {isMobile && (
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
        {/* Stage Viewport with Adobe PDF Embed API Reader */}
        {(() => {
          const effectiveMode = pageViewMode === 'two-page'
            ? (isContinuousScroll ? 'TWO_COLUMN' : 'TWO_COLUMN_FIT_PAGE')
            : (fitMode === 'fit-page' || !isContinuousScroll ? 'FIT_PAGE' : 'FIT_WIDTH');

          return (
            <div className="reader-stage-container">
              <AdobePDFViewer
                key={`${activeChapter.pdfUrl}-${effectiveMode}`}
                url={activeChapter.pdfUrl}
                title={`${b.title} - ${activeChapter.name}`}
                isMobile={isMobile}
                viewMode={effectiveMode}
                onApiReady={handleApiReady}
                readUrl={b?.readUrl}
                sourceUrl={b?.url}
              />
            </div>
          );
        })()}

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

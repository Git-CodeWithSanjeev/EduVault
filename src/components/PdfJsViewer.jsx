import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Point pdf.js to the local high-performance worker in /public
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

/**
 * Modern Document Skeleton Loader with determinate progress indicator
 */
export function PdfSkeletonLoader({ progress = 0, title }) {
  return (
    <div className="pdf-skeleton-wrapper" style={{
      width: '100%',
      height: '100%',
      minHeight: '520px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f8fafc',
      padding: '24px',
      position: 'relative',
      boxSizing: 'border-box',
    }}>
      {/* Animated Document Preview Outline */}
      <div style={{
        width: '100%',
        maxWidth: '460px',
        height: '420px',
        background: '#ffffff',
        borderRadius: '14px',
        boxShadow: '0 8px 30px rgba(15, 94, 83, 0.08)',
        border: '1px solid #e2e8f0',
        padding: '28px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}>
        {/* Shimmer sweep animation */}
        <div className="pdf-shimmer-sweep" style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.7) 50%, transparent 100%)',
          animation: 'shimmerSweep 1.8s infinite',
          pointerEvents: 'none',
        }} />

        {/* Skeleton Header Bars */}
        <div style={{ height: '22px', width: '65%', background: '#e2e8f0', borderRadius: '6px' }} />
        <div style={{ height: '14px', width: '40%', background: '#f1f5f9', borderRadius: '4px', marginBottom: '12px' }} />

        {/* Skeleton Content Paragraphs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
          <div style={{ height: '12px', width: '100%', background: '#f1f5f9', borderRadius: '4px' }} />
          <div style={{ height: '12px', width: '92%', background: '#f1f5f9', borderRadius: '4px' }} />
          <div style={{ height: '12px', width: '96%', background: '#f1f5f9', borderRadius: '4px' }} />
          <div style={{ height: '12px', width: '84%', background: '#f1f5f9', borderRadius: '4px' }} />
          <div style={{ height: '120px', width: '100%', background: '#f8fafc', border: '1.5px dashed #cbd5e1', borderRadius: '8px', margin: '8px 0' }} />
          <div style={{ height: '12px', width: '90%', background: '#f1f5f9', borderRadius: '4px' }} />
          <div style={{ height: '12px', width: '75%', background: '#f1f5f9', borderRadius: '4px' }} />
        </div>

        {/* Loader Status Footer */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px',
          paddingTop: '12px',
          borderTop: '1px solid #f1f5f9',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f5e53' }}>
              Streaming document...
            </span>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a' }}>
              {progress > 0 ? `${progress}%` : 'Fast Edge Stream'}
            </span>
          </div>

          {/* Progress Track */}
          <div style={{
            width: '100%',
            height: '6px',
            background: '#e2e8f0',
            borderRadius: '99px',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${Math.max(progress, 15)}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #0d9488 0%, #10b981 100%)',
              borderRadius: '99px',
              transition: 'width 0.25s ease',
            }} />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shimmerSweep {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}

/**
 * 8-Second Timeout / Error State with Clear Action Fallbacks
 */
export function PdfTimeoutFallback({ title, originalUrl, onRetry }) {
  const directUrl = originalUrl || '#';
  const googleDocsViewer = `https://docs.google.com/viewer?url=${encodeURIComponent(directUrl)}&embedded=true`;

  return (
    <div style={{
      width: '100%',
      height: '100%',
      minHeight: '480px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f8fafc',
      padding: '24px',
      boxSizing: 'border-box',
    }}>
      <div style={{
        maxWidth: '460px',
        width: '100%',
        background: '#ffffff',
        borderRadius: '16px',
        padding: '32px 24px',
        textAlign: 'center',
        boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
        border: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '14px',
      }}>
        <div style={{
          width: '54px',
          height: '54px',
          borderRadius: '50%',
          background: '#fee2e2',
          color: '#ef4444',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
        }}>
          ⚠️
        </div>

        <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
          Server Response Delay
        </h3>

        <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
          The upstream educational server (NCERT) is experiencing high traffic or took longer than 8 seconds to stream{' '}
          <strong>{title || 'this chapter'}</strong>.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', marginTop: '6px' }}>
          <a
            href={directUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '11px 18px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
              color: '#ffffff',
              fontSize: '13.5px',
              fontWeight: 700,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)',
            }}
          >
            <span>🚀 Open Official PDF in New Tab</span>
            <span style={{ fontSize: '11px', opacity: 0.85 }}>↗</span>
          </a>

          <a
            href={googleDocsViewer}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              background: '#f1f5f9',
              color: '#334155',
              fontSize: '13px',
              fontWeight: 600,
              textDecoration: 'none',
              border: '1px solid #cbd5e1',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <span>📄 View in Google Docs Viewer</span>
            <span style={{ fontSize: '11px', opacity: 0.85 }}>↗</span>
          </a>

          {onRetry && (
            <button
              onClick={onRetry}
              type="button"
              style={{
                padding: '9px 18px',
                borderRadius: '10px',
                background: '#ffffff',
                color: '#64748b',
                fontSize: '12.5px',
                fontWeight: 600,
                border: '1px solid #e2e8f0',
                cursor: 'pointer',
              }}
            >
              🔄 Retry Connection
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * High-Performance Streaming PDF Viewer with Virtualized Page Rendering
 */
export function PdfJsViewer({
  url,
  cloudUrl,
  title,
  currentPage = 1,
  onTotalPagesChange,
  onPageRendered,
  zoomLevel = 1,
  viewMode = 'single', // 'single' | 'two-page'
  fitMode = 'fit-width', // 'fit-width' | 'fit-page'
  nextChapterUrl,
  isMobile = false,
  onPrevPage,
  onNextPage,
}) {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [timedOut, setTimedOut] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null);

  const containerRef = useRef(null);
  const canvas1Ref = useRef(null);
  const canvas2Ref = useRef(null);
  const renderTask1Ref = useRef(null);
  const renderTask2Ref = useRef(null);
  const loadingTaskRef = useRef(null);
  const timerRef = useRef(null);
  const touchStartXRef = useRef(null);

  // Reliable Edge CORS Proxy for both R2 Edge and official NCERT links
  const targetPdfUrl = cloudUrl || url;
  const primarySource = targetPdfUrl
    ? (targetPdfUrl.startsWith('/api/') ? targetPdfUrl : `/api/pdf?url=${encodeURIComponent(targetPdfUrl)}`)
    : null;

  // 1. Prefetch Next Chapter PDF in background on idle
  useEffect(() => {
    if (!nextChapterUrl) return;
    const prefetchUrl = nextChapterUrl.startsWith('http')
      ? `/api/pdf?url=${encodeURIComponent(nextChapterUrl)}`
      : nextChapterUrl;

    const doPrefetch = () => {
      try {
        fetch(prefetchUrl, { method: 'GET', headers: { Range: 'bytes=0-65535' } }).catch(() => {});
      } catch (_) {}
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const handle = window.requestIdleCallback(doPrefetch, { timeout: 3000 });
      return () => window.cancelIdleCallback(handle);
    } else {
      const timer = setTimeout(doPrefetch, 1500);
      return () => clearTimeout(timer);
    }
  }, [nextChapterUrl]);

  // Keyboard navigation (ArrowLeft = prev page, ArrowRight = next page)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target && ['input', 'textarea'].includes(e.target.tagName?.toLowerCase())) return;
      if (e.key === 'ArrowLeft' && onPrevPage) {
        onPrevPage();
      } else if (e.key === 'ArrowRight' && onNextPage) {
        onNextPage();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onPrevPage, onNextPage]);

  // Touch Swipe navigation for mobile
  const handleTouchStart = (e) => {
    if (e.touches && e.touches[0]) {
      touchStartXRef.current = e.touches[0].clientX;
    }
  };

  const handleTouchEnd = (e) => {
    if (touchStartXRef.current === null) return;
    const touchEndX = e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientX : null;
    if (touchEndX !== null) {
      const diffX = touchEndX - touchStartXRef.current;
      if (diffX < -50 && onNextPage) {
        onNextPage(); // Swiped Left -> Next page
      } else if (diffX > 50 && onPrevPage) {
        onPrevPage(); // Swiped Right -> Previous page
      }
    }
    touchStartXRef.current = null;
  };

  // 2. Load PDF Document with Streaming & Range Chunking
  const loadDocument = useCallback(() => {
    if (!primarySource) return;

    setLoading(true);
    setTimedOut(false);
    setErrorMsg(null);
    setProgress(15);

    // 8-second fallback timer
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setTimedOut(true);
    }, 8000);

    // Cancel prior loading task if any
    if (loadingTaskRef.current) {
      try { loadingTaskRef.current.destroy(); } catch (_) {}
    }

    try {
      const task = pdfjsLib.getDocument({
        url: primarySource,
        disableStream: false,       // Enable progressive streaming
        disableAutoFetch: true,      // Fetch chunks on demand via HTTP Range
        disableRange: false,        // Enable range byte chunking
        cMapUrl: 'https://unpkg.com/pdfjs-dist@4.10.38/cmaps/',
        cMapPacked: true,
      });

      loadingTaskRef.current = task;

      task.onProgress = ({ loaded, total }) => {
        if (total > 0) {
          const pct = Math.round((loaded / total) * 100);
          setProgress(pct);
        }
      };

      task.promise
        .then((doc) => {
          if (timerRef.current) clearTimeout(timerRef.current);
          setPdfDoc(doc);
          setLoading(false);
          setTimedOut(false);
          setProgress(100);
          if (onTotalPagesChange) {
            onTotalPagesChange(doc.numPages);
          }
        })
        .catch((err) => {
          if (timerRef.current) clearTimeout(timerRef.current);
          console.warn('[PDF.js Loading Info]:', err.message);
          // If Edge proxy failed, fallback to direct target URL
          if (targetPdfUrl && primarySource !== targetPdfUrl) {
            const fallbackTask = pdfjsLib.getDocument({
              url: targetPdfUrl,
              disableStream: false,
              disableAutoFetch: true,
            });
            fallbackTask.promise
              .then((doc) => {
                setPdfDoc(doc);
                setLoading(false);
                setTimedOut(false);
                if (onTotalPagesChange) onTotalPagesChange(doc.numPages);
              })
              .catch((fErr) => {
                setErrorMsg(fErr.message);
                setLoading(false);
                setTimedOut(true);
              });
          } else {
            setErrorMsg(err.message);
            setLoading(false);
            setTimedOut(true);
          }
        });
    } catch (initErr) {
      if (timerRef.current) clearTimeout(timerRef.current);
      setErrorMsg(initErr.message);
      setLoading(false);
      setTimedOut(true);
    }
  }, [primarySource, targetPdfUrl, onTotalPagesChange]);

  useEffect(() => {
    loadDocument();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (loadingTaskRef.current) {
        try { loadingTaskRef.current.destroy(); } catch (_) {}
      }
    };
  }, [loadDocument]);

  // 3. Render Virtualized Page (Active Page ± 1) onto Canvas
  const renderPage = useCallback(
    async (pageNumber, canvasRef, renderTaskRef) => {
      if (!pdfDoc || !canvasRef.current || pageNumber < 1 || pageNumber > pdfDoc.numPages) return;

      try {
        const page = await pdfDoc.getPage(pageNumber);

        // Cancel existing render on this canvas if active
        if (renderTaskRef.current) {
          try { renderTaskRef.current.cancel(); } catch (_) {}
        }

        const containerWidth = containerRef.current ? containerRef.current.clientWidth - 40 : 800;
        const unscaledViewport = page.getViewport({ scale: 1 });

        // Calculate responsive scale
        let scale = zoomLevel;
        if (fitMode === 'fit-width') {
          const targetWidth = viewMode === 'two-page' ? (containerWidth / 2) - 16 : containerWidth;
          scale = (targetWidth / unscaledViewport.width) * zoomLevel;
        } else if (fitMode === 'fit-page') {
          const containerHeight = (containerRef.current ? containerRef.current.clientHeight : 700) - 40;
          scale = Math.min(containerWidth / unscaledViewport.width, containerHeight / unscaledViewport.height) * zoomLevel;
        }

        scale = Math.max(scale, 0.45);

        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        // HiDPI / Retina Crisp Rendering
        const outputScale = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;

        const renderContext = {
          canvasContext: context,
          transform: transform,
          viewport: viewport,
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;

        await renderTask.promise;
        renderTaskRef.current = null;

        if (onPageRendered) onPageRendered(pageNumber);
      } catch (err) {
        if (err.name !== 'RenderingCancelledException') {
          console.warn(`[Page ${pageNumber} Render Warning]:`, err.message);
        }
      }
    },
    [pdfDoc, zoomLevel, viewMode, fitMode, onPageRendered]
  );

  useEffect(() => {
    if (!pdfDoc) return;
    renderPage(currentPage, canvas1Ref, renderTask1Ref);

    if (viewMode === 'two-page' && currentPage + 1 <= pdfDoc.numPages) {
      renderPage(currentPage + 1, canvas2Ref, renderTask2Ref);
    }
  }, [pdfDoc, currentPage, viewMode, fitMode, zoomLevel, renderPage]);

  // Show Timeout Fallback if 8s elapsed or loading failed
  if (timedOut && loading) {
    return (
      <PdfTimeoutFallback
        title={title}
        originalUrl={url}
        onRetry={() => {
          setTimedOut(false);
          loadDocument();
        }}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className="pdf-js-stage"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '520px',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: loading ? 'center' : 'flex-start',
        overflow: 'auto',
        background: '#f1f5f9',
        padding: '20px 10px',
        boxSizing: 'border-box',
      }}
    >
      {/* 1. Document Skeleton Loader while initial stream buffers */}
      {loading && (
        <PdfSkeletonLoader progress={progress} title={title} />
      )}

      {/* 2. Virtualized Canvas Display (Single or Two-Page) */}
      <div
        style={{
          display: loading ? 'none' : 'flex',
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'center',
          gap: '16px',
          margin: '0 auto',
          maxWidth: '100%',
        }}
      >
        <div style={{
          background: '#ffffff',
          borderRadius: '4px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
          overflow: 'hidden',
          display: 'flex',
          maxWidth: '100%',
        }}>
          <canvas ref={canvas1Ref} style={{ display: 'block', maxWidth: '100%' }} />
        </div>

        {viewMode === 'two-page' && pdfDoc && currentPage + 1 <= pdfDoc.numPages && (
          <div style={{
            background: '#ffffff',
            borderRadius: '4px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
            overflow: 'hidden',
            display: 'flex',
            maxWidth: '100%',
          }}>
            <canvas ref={canvas2Ref} style={{ display: 'block', maxWidth: '100%' }} />
          </div>
        )}
      </div>

      {/* 3. Mobile Floating Page Nav Pill */}
      {isMobile && !loading && pdfDoc && (
        <div
          style={{
            position: 'sticky',
            bottom: '16px',
            marginTop: 'auto',
            paddingTop: '16px',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(15, 23, 42, 0.88)',
            backdropFilter: 'blur(8px)',
            color: '#ffffff',
            padding: '8px 14px',
            borderRadius: '99px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          }}
        >
          <button
            type="button"
            onClick={onPrevPage}
            disabled={currentPage <= 1}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              color: '#ffffff',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
              opacity: currentPage <= 1 ? 0.4 : 1,
            }}
            title="Previous Page"
          >
            ◀
          </button>

          <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.3px', minWidth: '70px', textAlign: 'center' }}>
            Page {currentPage} / {pdfDoc.numPages}
          </span>

          <button
            type="button"
            onClick={onNextPage}
            disabled={currentPage >= pdfDoc.numPages}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              color: '#ffffff',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: currentPage >= pdfDoc.numPages ? 'not-allowed' : 'pointer',
              opacity: currentPage >= pdfDoc.numPages ? 0.4 : 1,
            }}
            title="Next Page"
          >
            ▶
          </button>
        </div>
      )}
    </div>
  );
}

export default PdfJsViewer;

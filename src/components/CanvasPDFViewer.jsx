import React, { useState, useEffect, useRef, useCallback, memo } from 'react';

const PROXY_BASE = import.meta.env.VITE_PROXY_URL || (import.meta.env.DEV ? 'http://localhost:3001/pdf/proxy' : '/api/proxy');

const PDFJS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const WORKER_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

/** Build backend proxy URL */
export function proxyUrl(originalUrl) {
  if (!originalUrl) return '';
  if (originalUrl.startsWith('http://localhost:3001') || originalUrl.startsWith('/api/proxy')) return originalUrl;
  return `${PROXY_BASE}?url=${encodeURIComponent(originalUrl)}`;
}

/** Dynamically load PDF.js from CDN */
function loadPdfJsScript() {
  return new Promise((resolve, reject) => {
    if (window.pdfjsLib) {
      resolve(window.pdfjsLib);
      return;
    }

    const existing = document.getElementById('pdfjs-script');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.pdfjsLib));
      existing.addEventListener('error', reject);
      return;
    }

    const script = document.createElement('script');
    script.id = 'pdfjs-script';
    script.src = PDFJS_CDN;
    script.onload = () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER_CDN;
        resolve(window.pdfjsLib);
      } else {
        reject(new Error('PDF.js failed to initialize'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load PDF.js script'));
    document.head.appendChild(script);
  });
}

/* ─── Download Overlay & Button ────────────────────────────────────────────── */
function DownloadOverlay({ filename, progress, phase }) {
  if (phase === 'idle') return null;

  const isDone  = phase === 'done';
  const isError = phase === 'error';

  return (
    <div className="dl-overlay">
      <div className="dl-overlay-card">
        <div className={`dl-overlay-icon ${isDone ? 'done' : isError ? 'error' : ''}`}>
          {isDone  ? '✅' : isError ? '❌' : (
            <svg viewBox="0 0 44 44" fill="none" className="dl-circle-svg">
              <circle cx="22" cy="22" r="18" stroke="var(--line)" strokeWidth="4" />
              <circle
                cx="22" cy="22" r="18"
                stroke="var(--p)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 18}`}
                strokeDashoffset={`${2 * Math.PI * 18 * (1 - progress / 100)}`}
                style={{ transition: 'stroke-dashoffset 0.25s ease', transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
              />
              <text x="22" y="27" textAnchor="middle" fill="var(--p)" fontSize="10" fontWeight="700">
                {Math.round(progress)}%
              </text>
            </svg>
          )}
        </div>

        <div className="dl-overlay-label">
          {isDone  ? 'Download complete!' :
           isError ? 'Download failed — try again' :
                     'Preparing your PDF…'}
        </div>
        <div className="dl-overlay-filename">{filename}</div>

        {!isDone && !isError && (
          <div className="dl-overlay-bar-track">
            <div className="dl-overlay-bar-fill" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>
    </div>
  );
}

export function DownloadPDFButton({ url, filename, label = '📥 Download PDF', className = 'pdf-btn' }) {
  const [phase, setPhase]       = useState('idle');
  const [progress, setProgress] = useState(0);
  const abortRef = useRef(null);

  const handleDownload = async (e) => {
    e.preventDefault();
    if (phase === 'fetching') return;

    setPhase('fetching');
    setProgress(0);

    const ticker = setInterval(() => {
      setProgress((p) => (p < 88 ? p + Math.random() * 5 : p));
    }, 180);

    abortRef.current = new AbortController();

    try {
      let res;
      try {
        res = await fetch(proxyUrl(url), { signal: abortRef.current.signal });
      } catch {
        res = await fetch(url, { signal: abortRef.current.signal });
      }

      if (!res || !res.ok) throw new Error(`HTTP ${res?.status || 'Error'}`);

      const blob = await res.blob();
      clearInterval(ticker);
      setProgress(100);

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
    fetching: '⏳',
    done:     '✅',
    error:    '❌',
  }[phase];

  const btnClass = {
    idle: '', fetching: 'downloading', done: 'dl-done', error: 'dl-error',
  }[phase];

  const dlFilename = filename || url.split('/').pop() || 'document.pdf';

  return (
    <>
      <DownloadOverlay filename={dlFilename} progress={progress} phase={phase} />

      <button
        onClick={handleDownload}
        className={`${className} ${btnClass}`}
        disabled={phase === 'fetching'}
        style={{ position: 'relative', overflow: 'hidden' }}
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

/* ─── Keyboard Shortcuts Modal ──────────────────────────────────────────────── */
function KeyboardShortcutsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="auth-overlay" onClick={onClose} style={{ zIndex: 2000 }}>
      <div className="auth-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        <button className="auth-close" onClick={onClose} aria-label="Close">✕</button>
        <div className="auth-header">
          <h2>⌨️ Keyboard Shortcuts</h2>
          <p>Standard navigation &amp; zoom controls for PDF reader.</p>
        </div>

        <div className="shortcuts-grid">
          <div className="shortcut-row">
            <kbd>↑</kbd> <kbd>↓</kbd>
            <span>Scroll document vertically</span>
          </div>
          <div className="shortcut-row">
            <kbd>←</kbd> <kbd>→</kbd>
            <span>Previous / Next Page</span>
          </div>
          <div className="shortcut-row">
            <kbd>PageUp</kbd> <kbd>PageDown</kbd>
            <span>Jump previous / next page</span>
          </div>
          <div className="shortcut-row">
            <kbd>+</kbd> / <kbd>-</kbd>
            <span>Zoom In / Zoom Out</span>
          </div>
          <div className="shortcut-row">
            <kbd>0</kbd>
            <span>Reset Zoom / Fit to Width</span>
          </div>
          <div className="shortcut-row">
            <kbd>Home</kbd> / <kbd>End</kbd>
            <span>First Page / Last Page</span>
          </div>
          <div className="shortcut-row">
            <kbd>F</kbd>
            <span>Toggle Fullscreen</span>
          </div>
          <div className="shortcut-row">
            <kbd>?</kbd>
            <span>Show / Hide Shortcuts</span>
          </div>
        </div>

        <button className="auth-submit-btn" onClick={onClose} style={{ marginTop: '20px' }}>
          Got It
        </button>
      </div>
    </div>
  );
}

/* ─── Memoized PDF Page Card Component with Interactive Drawing Overlay ─────── */
const PDFPageCard = memo(function PDFPageCard({
  pIndex,
  numPages,
  isActive,
  shouldRender,
  pdfDoc,
  scale,
  containerWidth,
  registerPageRef,
  activeTool = 'cursor',
  activeColor = '#fde047',
}) {
  const canvasRef = useRef(null);
  const drawCanvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const renderTaskRef = useRef(null);
  const [isRendered, setIsRendered] = useState(false);

  // Sync drawing canvas overlay size with PDF canvas size
  useEffect(() => {
    if (!canvasRef.current || !drawCanvasRef.current) return;
    const canvas = canvasRef.current;
    const drawCanvas = drawCanvasRef.current;
    if (canvas.width > 0 && canvas.height > 0) {
      drawCanvas.width = canvas.width;
      drawCanvas.height = canvas.height;
      drawCanvas.style.width = canvas.style.width;
      drawCanvas.style.height = canvas.style.height;
    }
  }, [isRendered, containerWidth, scale]);

  const getPos = (e) => {
    const drawCanvas = drawCanvasRef.current;
    if (!drawCanvas) return { x: 0, y: 0 };
    const rect = drawCanvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const scaleX = drawCanvas.width / rect.width;
    const scaleY = drawCanvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e) => {
    if (activeTool === 'cursor') return;
    isDrawingRef.current = true;
    const ctx = drawCanvasRef.current?.getContext('2d');
    if (!ctx) return;

    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);

    if (activeTool === 'highlighter') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = activeColor + '66'; // semi-transparent highlighter ink
      ctx.lineWidth = 26;
      ctx.lineCap = 'square';
      ctx.lineJoin = 'bevel';
    } else if (activeTool === 'pen') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    } else if (activeTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = 32;
      ctx.lineCap = 'round';
    }
  };

  const draw = (e) => {
    if (!isDrawingRef.current || activeTool === 'cursor') return;
    const ctx = drawCanvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    const ctx = drawCanvasRef.current?.getContext('2d');
    if (ctx) ctx.closePath();
  };

  useEffect(() => {
    if (!shouldRender || !pdfDoc || !canvasRef.current) return;

    let isCancelled = false;

    const drawPage = async () => {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }

      try {
        const page = await pdfDoc.getPage(pIndex);
        if (isCancelled || !canvasRef.current) return;

        const viewport = page.getViewport({ scale: 1.0 });
        const targetWidth = Math.max(containerWidth || 800, 320);

        const baseFitScale = targetWidth / viewport.width;
        const finalScale = baseFitScale * scale;
        const responsiveViewport = page.getViewport({ scale: finalScale });

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const canvas = canvasRef.current;
        canvas.width = Math.floor(responsiveViewport.width * dpr);
        canvas.height = Math.floor(responsiveViewport.height * dpr);
        canvas.style.width = `${Math.floor(responsiveViewport.width)}px`;
        canvas.style.height = `${Math.floor(responsiveViewport.height)}px`;

        const context = canvas.getContext('2d');
        context.scale(dpr, dpr);

        const renderTask = page.render({
          canvasContext: context,
          viewport: responsiveViewport,
        });

        renderTaskRef.current = renderTask;
        await renderTask.promise;
        if (!isCancelled) setIsRendered(true);
      } catch (err) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error(`Page ${pIndex} render error:`, err);
        }
      }
    };

    drawPage();

    return () => {
      isCancelled = true;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [shouldRender, pdfDoc, pIndex, scale, containerWidth]);

  return (
    <div
      id={`pdf-page-${pIndex}`}
      data-page-num={pIndex}
      ref={(el) => registerPageRef(pIndex, el)}
      className={`pdf-page-card ${isActive ? 'active-page' : ''}`}
    >
      <div className={`pdf-canvas-container ${activeTool !== 'cursor' ? 'annotating' : ''}`}>
        {!isRendered && (
          <div className="pdf-page-placeholder">
            <span className="pdf-spinner" style={{ width: '24px', height: '24px' }} />
            <span>Page {pIndex}</span>
          </div>
        )}
        <canvas ref={canvasRef} className="pdf-canvas" />
        <canvas
          ref={drawCanvasRef}
          className="pdf-draw-canvas"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={{ pointerEvents: activeTool === 'cursor' ? 'none' : 'auto' }}
        />
      </div>
      <div className="pdf-page-card-footer">
        Page {pIndex} of {numPages}
      </div>
    </div>
  );
});

/* ─── Modern Fixed-Shell PDF Viewer Component ───────────────────────────────── */
export function CanvasPDFViewer({ url, title, isMobile = false }) {
  const [status, setStatus]               = useState('loading');
  const [pdfDoc, setPdfDoc]               = useState(null);
  const [pageNum, setPageNum]             = useState(1);
  const [numPages, setNumPages]           = useState(0);
  const [scale, setScale]                 = useState(1.0);
  const [pageInput, setPageInput]         = useState('1');
  const [isFullscreen, setIsFullscreen]   = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [containerWidth, setContainerWidth] = useState(900);
  const [loadingMsg, setLoadingMsg]       = useState('Loading PDF document...');
  const [activeTool, setActiveTool]       = useState('cursor');
  const [activeColor, setActiveColor]     = useState('#fde047');

  const rootRef            = useRef(null);
  const scrollContainerRef = useRef(null);
  const pageRefs           = useRef({});
  const touchStartDistRef  = useRef(null);
  const touchStartScaleRef = useRef(1.0);
  const lastTapTimeRef     = useRef(0);

  const registerPageRef = useCallback((pIndex, el) => {
    if (el) pageRefs.current[pIndex] = el;
  }, []);

  useEffect(() => {
    setPageInput(String(pageNum));
  }, [pageNum]);

  // Load PDF Document
  useEffect(() => {
    let isCancelled = false;
    setStatus('loading');
    setLoadingMsg('Fetching PDF document...');
    setPageNum(1);
    setPdfDoc(null);

    loadPdfJsScript()
      .then((pdfjs) => {
        if (isCancelled) return;
        return pdfjs.getDocument({
          url: proxyUrl(url),
          cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
          cMapPacked: true,
        }).promise;
      })
      .then((doc) => {
        if (isCancelled || !doc) return;
        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setStatus('ready');
      })
      .catch(() => {
        if (isCancelled) return;
        loadPdfJsScript()
          .then((pdfjs) => {
            return pdfjs.getDocument({
              url: url,
              cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
              cMapPacked: true,
            }).promise;
          })
          .then((doc) => {
            if (isCancelled || !doc) return;
            setPdfDoc(doc);
            setNumPages(doc.numPages);
            setStatus('ready');
          })
          .catch((directErr) => {
            console.error('PDF render error:', directErr);
            if (!isCancelled) setStatus('error');
          });
      });

    return () => {
      isCancelled = true;
    };
  }, [url]);

  // Real-Time Container Width Observer utilizing full available width
  useEffect(() => {
    if (!scrollContainerRef.current) return;

    const updateWidth = (measuredWidth) => {
      const w = measuredWidth - (isMobile ? 24 : 48);
      if (w > 300) {
        setContainerWidth(Math.floor(w));
      }
    };

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (entry.contentRect.width) {
          updateWidth(entry.contentRect.width);
        }
      }
    });

    resizeObserver.observe(scrollContainerRef.current);
    updateWidth(scrollContainerRef.current.clientWidth);

    return () => resizeObserver.disconnect();
  }, [isMobile, status]);

  // Intersection Observer for Current Visible Page Tracking
  useEffect(() => {
    if (status !== 'ready' || !numPages || !scrollContainerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.35) {
            const pIndex = Number(entry.target.getAttribute('data-page-num'));
            if (pIndex && pIndex !== pageNum) {
              setPageNum(pIndex);
            }
          }
        });
      },
      {
        root: scrollContainerRef.current,
        threshold: [0.35, 0.7],
      }
    );

    Object.values(pageRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [status, numPages, pageNum]);

  // Scroll to Specific Page
  const scrollToPage = (p) => {
    const target = Math.max(1, Math.min(p, numPages));
    setPageNum(target);

    const pageEl = pageRefs.current[target];
    if (pageEl) {
      pageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const prevPage = () => scrollToPage(pageNum - 1);
  const nextPage = () => scrollToPage(pageNum + 1);
  const zoomIn   = () => setScale((s) => Math.min(s + 0.25, 2.5));
  const zoomOut  = () => setScale((s) => Math.max(s - 0.25, 0.6));
  const resetZoom = () => setScale(1.0);

  const handlePageInputChange = (e) => setPageInput(e.target.value);

  const handlePageInputSubmit = (e) => {
    e.preventDefault();
    const val = parseInt(pageInput, 10);
    if (!isNaN(val)) scrollToPage(val);
  };

  // Fullscreen Toggle
  const toggleFullscreen = () => {
    if (!rootRef.current) return;
    if (!document.fullscreenElement) {
      rootRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Mobile Touch Gestures
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartDistRef.current = dist;
      touchStartScaleRef.current = scale;
    } else if (e.touches.length === 1) {
      const now = Date.now();
      if (now - lastTapTimeRef.current < 300) {
        e.preventDefault();
        setScale((s) => (s > 1.2 ? 1.0 : 1.8));
      }
      lastTapTimeRef.current = now;
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && touchStartDistRef.current) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = dist / touchStartDistRef.current;
      const newScale = Math.min(Math.max(touchStartScaleRef.current * factor, 0.7), 2.5);
      setScale(newScale);
    }
  };

  const handleTouchEnd = () => {
    touchStartDistRef.current = null;
  };

  // Keyboard Shortcuts System
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (
        tag === 'input' ||
        tag === 'textarea' ||
        tag === 'select' ||
        document.activeElement?.isContentEditable
      ) {
        return;
      }

      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setShowShortcuts((prev) => !prev);
      } else if (e.key === '+' || e.key === '=' || ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '='))) {
        e.preventDefault();
        zoomIn();
      } else if (e.key === '-' || ((e.ctrlKey || e.metaKey) && e.key === '-')) {
        e.preventDefault();
        zoomOut();
      } else if (e.key === '0' || ((e.ctrlKey || e.metaKey) && e.key === '0')) {
        e.preventDefault();
        resetZoom();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        scrollContainerRef.current?.scrollBy({ top: -window.innerHeight * 0.7, behavior: 'smooth' });
      } else if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        scrollContainerRef.current?.scrollBy({ top: window.innerHeight * 0.7, behavior: 'smooth' });
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevPage();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextPage();
      } else if (e.key === 'Home') {
        e.preventDefault();
        scrollToPage(1);
      } else if (e.key === 'End') {
        e.preventDefault();
        scrollToPage(numPages);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [numPages]);

  return (
    <div
      ref={rootRef}
      className={`pdf-viewer-root ${isMobile ? 'mobile-mode' : ''} ${isFullscreen ? 'fullscreen-mode' : ''}`}
    >
      <KeyboardShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />

      {/* LEFT TOOLBAR PANEL WITH HIGHLIGHTER & ANNOTATION TOOLS */}
      {!isMobile && (
        <div className="pdf-left-rail">
          {status === 'ready' && (
            <>
              {/* Page Nav Box */}
              <div className="pdf-rail-box">
                <span className="pdf-rail-box-label">PAGE</span>
                <button className="pdf-rail-btn" onClick={prevPage} disabled={pageNum <= 1} title="Previous Page (←)">▲</button>
                <div className="pdf-rail-page-row">
                  <form onSubmit={handlePageInputSubmit} className="pdf-rail-page-form">
                    <input type="text" className="pdf-rail-input" value={pageInput} onChange={handlePageInputChange} aria-label="Page" />
                  </form>
                  <span className="pdf-rail-total">/{numPages}</span>
                </div>
                <button className="pdf-rail-btn" onClick={nextPage} disabled={pageNum >= numPages} title="Next Page (→)">▼</button>
              </div>

              {/* Zoom Box */}
              <div className="pdf-rail-box">
                <span className="pdf-rail-box-label">ZOOM</span>
                <button className="pdf-rail-btn" onClick={zoomIn} title="Zoom In (+)">+</button>
                <button className="pdf-rail-zoom-badge" onClick={resetZoom} title="Reset Zoom (0)">{Math.round(scale * 100)}%</button>
                <button className="pdf-rail-btn" onClick={zoomOut} title="Zoom Out (-)">-</button>
              </div>

              {/* ANNOTATION & HIGHLIGHTER TOOLS BOX */}
              <div className="pdf-rail-box">
                <span className="pdf-rail-box-label">TOOLS</span>
                <div className="pdf-rail-tools-grid">
                  <button
                    className={`pdf-rail-tool-btn ${activeTool === 'cursor' ? 'active' : ''}`}
                    onClick={() => setActiveTool('cursor')}
                    title="Select / Scroll Mode"
                  >
                    🖐️
                  </button>
                  <button
                    className={`pdf-rail-tool-btn ${activeTool === 'highlighter' ? 'active' : ''}`}
                    onClick={() => setActiveTool('highlighter')}
                    title="Highlighter"
                  >
                    🖍️
                  </button>
                  <button
                    className={`pdf-rail-tool-btn ${activeTool === 'pen' ? 'active' : ''}`}
                    onClick={() => setActiveTool('pen')}
                    title="Pen / Draw"
                  >
                    ✏️
                  </button>
                  <button
                    className={`pdf-rail-tool-btn ${activeTool === 'eraser' ? 'active' : ''}`}
                    onClick={() => setActiveTool('eraser')}
                    title="Eraser"
                  >
                    🧹
                  </button>
                </div>

                {(activeTool === 'highlighter' || activeTool === 'pen') && (
                  <div className="pdf-rail-colors-row">
                    {[
                      { id: 'yellow', hex: '#fde047' },
                      { id: 'green',  hex: '#4ade80' },
                      { id: 'pink',   hex: '#f472b6' },
                      { id: 'blue',   hex: '#38bdf8' },
                    ].map((c) => (
                      <button
                        key={c.id}
                        className={`pdf-color-dot ${activeColor === c.hex ? 'selected' : ''}`}
                        style={{ backgroundColor: c.hex }}
                        onClick={() => setActiveColor(c.hex)}
                        title={`${c.id} color`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* View Box */}
              <div className="pdf-rail-box">
                <span className="pdf-rail-box-label">VIEW</span>
                <div className="pdf-rail-tools-row">
                  <button className="pdf-rail-btn" onClick={toggleFullscreen} title="Toggle Fullscreen (F)">
                    {isFullscreen ? '↙' : '⤢'}
                  </button>
                  <button className="pdf-rail-btn help-btn" onClick={() => setShowShortcuts(true)} title="Shortcuts (?)">
                    ?
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* MOBILE COMPACT TOPBAR */}
      {isMobile && (
        <div className="pdf-viewer-topbar mobile-only">
          <div className="pdf-title-block">
            <span className="pdf-viewer-title" title={title}>📄 {title}</span>
          </div>
          {status === 'ready' && (
            <div className="pdf-controls-group">
              <button className="pdf-ctrl-btn" onClick={prevPage} disabled={pageNum <= 1}>◀</button>
              <span className="pdf-page-total">{pageNum} / {numPages}</span>
              <button className="pdf-ctrl-btn" onClick={nextPage} disabled={pageNum >= numPages}>▶</button>
              <button className="pdf-ctrl-btn" onClick={zoomOut}>-</button>
              <span className="pdf-zoom-level">{Math.round(scale * 100)}%</span>
              <button className="pdf-ctrl-btn" onClick={zoomIn}>+</button>
            </div>
          )}
          <DownloadPDFButton url={url} filename={title + '.pdf'} label="📥" className="pdf-btn" />
        </div>
      )}

      {/* PDF STAGE VIEWPORT — SCROLLABLE FULL-WIDTH CONTAINER */}
      <div className="pdf-viewer-stage">
        {status === 'loading' && (
          <div className="pdf-loading-overlay">
            <div className="pdf-loading-card">
              <div className="pdf-loader-pulse-wrap">
                <div className="pdf-loader-ring" />
                <span className="pdf-loader-icon">📄</span>
              </div>
              <h4 className="pdf-loading-title">{title}</h4>
              <p className="pdf-loading-msg">{loadingMsg}</p>
              <div className="pdf-loading-bar-track">
                <div className="pdf-loading-bar-fill" />
              </div>
            </div>
          </div>
        )}

        {status === 'ready' && (
          <div
            className="pdf-vertical-scroll-container"
            ref={scrollContainerRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {Array.from({ length: numPages }, (_, i) => i + 1).map((pIndex) => {
              const shouldRender = Math.abs(pIndex - pageNum) <= 1;
              return (
                <PDFPageCard
                  key={pIndex}
                  pIndex={pIndex}
                  numPages={numPages}
                  isActive={pageNum === pIndex}
                  shouldRender={shouldRender}
                  pdfDoc={pdfDoc}
                  scale={scale}
                  containerWidth={containerWidth}
                  registerPageRef={registerPageRef}
                  activeTool={activeTool}
                  activeColor={activeColor}
                />
              );
            })}
          </div>
        )}

        {status === 'error' && (
          <div className="pdf-loading-overlay">
            <div className="pdf-loading-card">
              <span style={{ fontSize: '36px' }}>📄</span>
              <h4 className="pdf-loading-title">PDF Ready for Download</h4>
              <p className="pdf-loading-msg">
                The document is available. You can download or view this chapter directly:
              </p>
              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <DownloadPDFButton url={url} filename={title + '.pdf'} label="📥 Download PDF" className="pdf-btn" />
                <a href={url} target="_blank" rel="noopener noreferrer" className="pdf-btn secondary">
                  Open External ↗
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CanvasPDFViewer;

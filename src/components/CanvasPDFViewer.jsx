import React, { useState, useEffect, useLayoutEffect, useRef, useCallback, memo } from 'react';

// Global prototype patch to ensure all 2D canvas contexts default to willReadFrequently: true
if (typeof window !== 'undefined') {
  const patchCanvasContext = (proto) => {
    if (!proto || !proto.getContext || proto._willReadFrequentlyPatched) return;
    const originalGetContext = proto.getContext;
    proto.getContext = function (type, attributes) {
      if (type === '2d') {
        attributes = Object.assign({ willReadFrequently: true }, attributes);
      }
      return originalGetContext.call(this, type, attributes);
    };
    proto._willReadFrequentlyPatched = true;
  };

  patchCanvasContext(HTMLCanvasElement.prototype);
  if (typeof OffscreenCanvas !== 'undefined') {
    patchCanvasContext(OffscreenCanvas.prototype);
  }

  // Filter out noisy non-critical PDF worker warning logs
  const origWarn = console.warn;
  const origLog = console.log;
  const isPdfWorkerSpam = (msg) => {
    if (typeof msg !== 'string') return false;
    return (
      msg.includes('Unknown colorspace') ||
      msg.includes('Unsupported header type') ||
      msg.includes('fetchStandardFontData')
    );
  };
  console.warn = function (...args) {
    if (isPdfWorkerSpam(args[0])) return;
    origWarn.apply(console, args);
  };
  console.log = function (...args) {
    if (isPdfWorkerSpam(args[0])) return;
    origLog.apply(console, args);
  };
}

const PROXY_BASE = import.meta.env.VITE_PROXY_URL || '/api/proxy';

const PDFJS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const WORKER_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// Global In-Memory PDF Document & Buffer Cache for Instant Loading (0ms) across component mounts
const pdfDocumentCache = new Map();

const ZOOM_STEPS = [0.5, 0.6, 0.75, 0.9, 1.0, 1.1, 1.25, 1.5, 1.75, 2.0, 2.5, 3.0];

function getNextZoomIn(currentScale) {
  for (let i = 0; i < ZOOM_STEPS.length; i++) {
    if (ZOOM_STEPS[i] > currentScale + 0.001) {
      return ZOOM_STEPS[i];
    }
  }
  return 3.0;
}

function getPrevZoomOut(currentScale) {
  for (let i = ZOOM_STEPS.length - 1; i >= 0; i--) {
    if (ZOOM_STEPS[i] < currentScale - 0.001) {
      return ZOOM_STEPS[i];
    }
  }
  return 0.5;
}

/** Build backend proxy URL */
export function proxyUrl(originalUrl) {
  if (!originalUrl) return '';
  if (originalUrl.startsWith('/api/proxy') || originalUrl.startsWith('/pdf/proxy')) return originalUrl;
  return `${PROXY_BASE}?url=${encodeURIComponent(originalUrl)}`;
}

/** Dynamically load PDF.js from CDN */
function loadPdfJsScript() {
  return new Promise((resolve, reject) => {
    if (window.pdfjsLib) {
      window.pdfjsLib.verbosity = 0;
      resolve(window.pdfjsLib);
      return;
    }

    const existing = document.getElementById('pdfjs-script');
    if (existing) {
      existing.addEventListener('load', () => {
        if (window.pdfjsLib) window.pdfjsLib.verbosity = 0;
        resolve(window.pdfjsLib);
      });
      existing.addEventListener('error', reject);
      return;
    }

    const script = document.createElement('script');
    script.id = 'pdfjs-script';
    script.src = PDFJS_CDN;
    script.onload = () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER_CDN;
        window.pdfjsLib.verbosity = 0;
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

  const isDone = phase === 'done';
  const isError = phase === 'error';

  return (
    <div className="dl-overlay">
      <div className="dl-overlay-card">
        <div className={`dl-overlay-icon ${isDone ? 'done' : isError ? 'error' : ''}`}>
          {isDone ? '✅' : isError ? '❌' : (
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
          {isDone ? 'Download complete!' :
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
  const [phase, setPhase] = useState('idle');
  const [progress, setProgress] = useState(0);
  const abortRef = useRef(null);
  const tickerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (tickerRef.current) clearInterval(tickerRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  const handleDownload = async (e) => {
    e.preventDefault();
    if (phase === 'fetching') return;

    setPhase('fetching');
    setProgress(0);

    if (tickerRef.current) clearInterval(tickerRef.current);
    tickerRef.current = setInterval(() => {
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
      if (tickerRef.current) clearInterval(tickerRef.current);
      setProgress(100);

      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename || url.split('/').pop() || 'document.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 6000);

      setPhase('done');
      setTimeout(() => { setPhase('idle'); setProgress(0); }, 2800);
    } catch (err) {
      if (tickerRef.current) clearInterval(tickerRef.current);
      if (err.name !== 'AbortError') {
        setPhase('error');
        setTimeout(() => { setPhase('idle'); setProgress(0); }, 3200);
      }
    }
  };

  const btnLabel = {
    idle: label,
    fetching: '⏳',
    done: '✅',
    error: '❌',
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

/* ─── PDF.js Canvas Factory for smooth rendering without getImageData warnings ─── */
const pdfCanvasFactory = {
  create(width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    return { canvas, context };
  },
  reset(canvasAndContext, width, height) {
    if (canvasAndContext?.canvas) {
      canvasAndContext.canvas.width = width;
      canvasAndContext.canvas.height = height;
    }
  },
  destroy(canvasAndContext) {
    if (canvasAndContext?.canvas) {
      canvasAndContext.canvas.width = 0;
      canvasAndContext.canvas.height = 0;
      canvasAndContext.canvas = null;
      canvasAndContext.context = null;
    }
  },
};

/* ─── Memoized PDF Page Card Component with Double-Buffered Offscreen Rendering ─────── */
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
  const lastRenderedKeyRef = useRef('');
  const aspectRatioRef = useRef(1.414);
  const [isRendered, setIsRendered] = useState(false);

  const strokesRef = useRef([]);
  const currentStrokeRef = useRef(null);
  const lastPointRef = useRef(null);

  const redrawStrokes = useCallback(() => {
    const drawCanvas = drawCanvasRef.current;
    if (!drawCanvas || drawCanvas.width === 0 || drawCanvas.height === 0) return;
    const ctx = drawCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);

    const w = drawCanvas.width;
    const h = drawCanvas.height;

    strokesRef.current.forEach((stroke) => {
      if (!stroke.points || stroke.points.length < 1) return;
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].nx * w, stroke.points[0].ny * h);

      if (stroke.tool === 'highlighter') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = (stroke.color || '#fde047') + '66';
        ctx.lineWidth = Math.max(16, Math.round(w * 0.025));
        ctx.lineCap = 'square';
        ctx.lineJoin = 'bevel';
      } else if (stroke.tool === 'pen') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = stroke.color || '#fde047';
        ctx.lineWidth = Math.max(3, Math.round(w * 0.004));
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      } else if (stroke.tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = Math.max(20, Math.round(w * 0.03));
        ctx.lineCap = 'round';
      }

      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].nx * w, stroke.points[i].ny * h);
      }
      ctx.stroke();
    });
  }, []);

  // Sync drawing canvas overlay size with PDF canvas size & redraw persistent strokes
  useEffect(() => {
    if (!canvasRef.current || !drawCanvasRef.current) return;
    const canvas = canvasRef.current;
    const drawCanvas = drawCanvasRef.current;
    if (canvas.width > 0 && canvas.height > 0) {
      drawCanvas.width = canvas.width;
      drawCanvas.height = canvas.height;
      drawCanvas.style.width = canvas.style.width;
      drawCanvas.style.height = canvas.style.height;
      redrawStrokes();
    }
  }, [isRendered, containerWidth, scale, redrawStrokes]);

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
    const drawCanvas = drawCanvasRef.current;
    if (!drawCanvas || drawCanvas.width === 0 || drawCanvas.height === 0) return;
    isDrawingRef.current = true;
    const pos = getPos(e);
    const w = drawCanvas.width;
    const h = drawCanvas.height;

    const startPt = { nx: pos.x / w, ny: pos.y / h };
    lastPointRef.current = startPt;

    currentStrokeRef.current = {
      tool: activeTool,
      color: activeColor,
      points: [startPt],
    };
    strokesRef.current.push(currentStrokeRef.current);

    const ctx = drawCanvas.getContext('2d', { willReadFrequently: true });
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      if (activeTool === 'highlighter') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = (activeColor || '#fde047') + '66';
        ctx.lineWidth = Math.max(16, Math.round(w * 0.025));
        ctx.lineCap = 'square';
        ctx.lineJoin = 'bevel';
      } else if (activeTool === 'pen') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = activeColor || '#fde047';
        ctx.lineWidth = Math.max(3, Math.round(w * 0.004));
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      } else if (activeTool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = Math.max(20, Math.round(w * 0.03));
        ctx.lineCap = 'round';
      }
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }
  };

  const draw = (e) => {
    if (!isDrawingRef.current || !currentStrokeRef.current || activeTool === 'cursor') return;
    const drawCanvas = drawCanvasRef.current;
    if (!drawCanvas || drawCanvas.width === 0 || drawCanvas.height === 0) return;
    const pos = getPos(e);
    const w = drawCanvas.width;
    const h = drawCanvas.height;

    const currPt = { nx: pos.x / w, ny: pos.y / h };
    currentStrokeRef.current.points.push(currPt);

    const ctx = drawCanvas.getContext('2d', { willReadFrequently: true });
    if (ctx && lastPointRef.current) {
      const prevX = lastPointRef.current.nx * w;
      const prevY = lastPointRef.current.ny * h;

      ctx.beginPath();
      ctx.moveTo(prevX, prevY);
      if (activeTool === 'highlighter') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = (activeColor || '#fde047') + '66';
        ctx.lineWidth = Math.max(16, Math.round(w * 0.025));
        ctx.lineCap = 'square';
        ctx.lineJoin = 'bevel';
      } else if (activeTool === 'pen') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = activeColor || '#fde047';
        ctx.lineWidth = Math.max(3, Math.round(w * 0.004));
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      } else if (activeTool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = Math.max(20, Math.round(w * 0.03));
        ctx.lineCap = 'round';
      }
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }
    lastPointRef.current = currPt;
  };

  const stopDrawing = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    currentStrokeRef.current = null;
    lastPointRef.current = null;
  };

  // Safe canvas memory release on unmount
  useEffect(() => {
    return () => {
      if (renderTaskRef.current) {
        try { renderTaskRef.current.cancel(); } catch (_) { }
        renderTaskRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!shouldRender) {
      if (renderTaskRef.current) {
        try { renderTaskRef.current.cancel(); } catch (_) { }
        renderTaskRef.current = null;
      }
      if (canvasRef.current) {
        canvasRef.current.width = 0;
        canvasRef.current.height = 0;
      }
      if (drawCanvasRef.current) {
        drawCanvasRef.current.width = 0;
        drawCanvasRef.current.height = 0;
      }
      lastRenderedKeyRef.current = '';
      setIsRendered(false);
      return;
    }

    if (!pdfDoc || !canvasRef.current) return;

    const renderKey = `${pIndex}_${scale}_${containerWidth}`;
    if (lastRenderedKeyRef.current === renderKey && isRendered) return;

    let isCancelled = false;

    const drawPage = async () => {
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch (_) { }
        renderTaskRef.current = null;
      }

      try {
        const page = await pdfDoc.getPage(pIndex);
        if (isCancelled || !canvasRef.current) return;

        const viewport = page.getViewport({ scale: 1.0 });
        if (viewport.width > 0 && viewport.height > 0) {
          aspectRatioRef.current = viewport.height / viewport.width;
        }

        const availableWidth = containerWidth && containerWidth > 0
          ? containerWidth
          : (typeof window !== 'undefined' && window.innerWidth < 768
            ? Math.max(window.innerWidth - 24, 300)
            : 800);
        const baseFitScale = availableWidth / viewport.width;
        const finalScale = baseFitScale * scale;
        const responsiveViewport = page.getViewport({ scale: finalScale });

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const renderWidth = Math.floor(responsiveViewport.width * dpr);
        const renderHeight = Math.floor(responsiveViewport.height * dpr);
        const cssWidth = `${Math.floor(responsiveViewport.width)}px`;
        const cssHeight = `${Math.floor(responsiveViewport.height)}px`;

        // Offscreen canvas for flicker-free double buffering
        const offscreen = document.createElement('canvas');
        offscreen.width = renderWidth;
        offscreen.height = renderHeight;
        const offscreenCtx = offscreen.getContext('2d', { willReadFrequently: true });
        offscreenCtx.scale(dpr, dpr);

        const renderTask = page.render({
          canvasContext: offscreenCtx,
          viewport: responsiveViewport,
          canvasFactory: pdfCanvasFactory,
        });

        renderTaskRef.current = renderTask;
        await renderTask.promise;

        if (isCancelled || !canvasRef.current) {
          offscreen.width = 0;
          offscreen.height = 0;
          return;
        }

        const canvas = canvasRef.current;
        if (canvas.width !== renderWidth || canvas.height !== renderHeight) {
          canvas.width = renderWidth;
          canvas.height = renderHeight;
        }
        canvas.style.width = cssWidth;
        canvas.style.height = cssHeight;

        const context = canvas.getContext('2d', { willReadFrequently: true });
        context.clearRect(0, 0, renderWidth, renderHeight);
        context.drawImage(offscreen, 0, 0);

        offscreen.width = 0;
        offscreen.height = 0;

        lastRenderedKeyRef.current = renderKey;
        setIsRendered(true);
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
        try {
          renderTaskRef.current.cancel();
        } catch (_) { }
        renderTaskRef.current = null;
      }
    };
  }, [shouldRender, pdfDoc, pIndex, scale, containerWidth]);

  const availableW = containerWidth && containerWidth > 0
    ? containerWidth
    : (typeof window !== 'undefined' && window.innerWidth < 768
      ? Math.max(window.innerWidth - 24, 300)
      : 800);
  const targetW = availableW * scale;
  const minCardHeight = Math.floor(targetW * aspectRatioRef.current);

  return (
    <div
      id={`pdf-page-${pIndex}`}
      data-page-num={pIndex}
      ref={(el) => registerPageRef(pIndex, el)}
      className="pdf-page-card"
      style={{ minHeight: `${minCardHeight}px` }}
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
  const [status, setStatus] = useState('loading');
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [pageInput, setPageInput] = useState('1');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [containerWidth, setContainerWidth] = useState(900);
  const [loadingMsg, setLoadingMsg] = useState('Loading PDF document...');
  const [activeTool, setActiveTool] = useState('cursor');
  const [activeColor, setActiveColor] = useState('#fde047');

  const rootRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const pagesWrapperRef = useRef(null);
  const pageRefs = useRef({});

  const registerPageRef = useCallback((pIndex, el) => {
    if (el) pageRefs.current[pIndex] = el;
  }, []);

  useEffect(() => {
    setPageInput(String(pageNum));
  }, [pageNum]);

  // Load PDF Document
  useEffect(() => {
    let isCancelled = false;
    let loadingTaskHandle = null;

    if (pdfDocumentCache.has(url)) {
      const cached = pdfDocumentCache.get(url);
      setPdfDoc(cached.doc);
      setNumPages(cached.numPages);
      setStatus('ready');
      return;
    }

    setStatus('loading');
    setLoadingMsg('Fetching PDF document...');
    setPageNum(1);
    setPdfDoc(null);

    const loadDocument = async () => {
      try {
        const pdfjs = await loadPdfJsScript();
        if (isCancelled) return;

        const pdfParams = {
          cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
          cMapPacked: true,
          standardFontDataUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/standard_fonts/',
          verbosity: 0,
          rangeChunkSize: 65536,
          disableAutoFetch: false,
          disableStream: false,
        };

        const tryStreamDocument = async (fetchUrl) => {
          const loadingTask = pdfjs.getDocument({ ...pdfParams, url: fetchUrl });
          loadingTaskHandle = loadingTask;
          const doc = await loadingTask.promise;
          loadingTaskHandle = null;
          return doc;
        };

        const tryLoadUrlWithBuffer = async (fetchUrl) => {
          const res = await fetch(fetchUrl);
          if (!res.ok) throw new Error(`HTTP status ${res.status}`);
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('text/html')) {
            throw new Error('Response is HTML page, expected PDF binary');
          }
          const arrayBuffer = await res.arrayBuffer();
          const header = new TextDecoder().decode(arrayBuffer.slice(0, 5));
          if (!header.startsWith('%PDF-')) {
            throw new Error('Invalid PDF magic header');
          }
          const loadingTask = pdfjs.getDocument({ ...pdfParams, data: new Uint8Array(arrayBuffer) });
          loadingTaskHandle = loadingTask;
          const doc = await loadingTask.promise;
          loadingTaskHandle = null;
          return doc;
        };

        const pUrl = proxyUrl(url);

        // Attempt 0: Primary Proxy Stream Load (/api/proxy) - prevents CORS errors on external PDF URLs
        try {
          const doc = await tryStreamDocument(pUrl);
          if (!isCancelled && doc) {
            pdfDocumentCache.set(url, { doc, numPages: doc.numPages });
            setPdfDoc(doc);
            setNumPages(doc.numPages);
            setStatus('ready');
            return;
          }
        } catch (e0) {
          if (isCancelled) return;
          console.warn('Primary proxy stream load failed, trying direct stream...', e0?.message);
        }

        // Attempt 1: Direct Stream Load (for CORS-enabled CDNs or local assets)
        try {
          const doc = await tryStreamDocument(url);
          if (!isCancelled && doc) {
            pdfDocumentCache.set(url, { doc, numPages: doc.numPages });
            setPdfDoc(doc);
            setNumPages(doc.numPages);
            setStatus('ready');
            return;
          }
        } catch (e1) {
          if (isCancelled) return;
          console.warn('Direct stream load failed, trying buffer load...', e1?.message);
        }

        // Attempt 2: Buffer Proxy Load (/api/proxy)
        try {
          const doc = await tryLoadUrlWithBuffer(proxyUrl(url));
          if (!isCancelled && doc) {
            pdfDocumentCache.set(url, { doc, numPages: doc.numPages });
            setPdfDoc(doc);
            setNumPages(doc.numPages);
            setStatus('ready');
            return;
          }
        } catch (e2) {
          if (isCancelled) return;
          console.warn('Buffer proxy load failed:', e2?.message);
        }

        // Attempt 3: Direct getDocument
        const loadingTask = pdfjs.getDocument({ ...pdfParams, url: url });
        loadingTaskHandle = loadingTask;
        const doc = await loadingTask.promise;
        loadingTaskHandle = null;
        if (!isCancelled && doc) {
          pdfDocumentCache.set(url, { doc, numPages: doc.numPages });
          setPdfDoc(doc);
          setNumPages(doc.numPages);
          setStatus('ready');
        }
      } catch (err) {
        console.error('PDF load error:', err);
        if (!isCancelled) setStatus('error');
      }
    };

    loadDocument();

    return () => {
      isCancelled = true;
      if (loadingTaskHandle) {
        try { loadingTaskHandle.destroy(); } catch (_) { }
      }
    };
  }, [url]);

  const pageNumRef = useRef(pageNum);
  useEffect(() => {
    pageNumRef.current = pageNum;
  }, [pageNum]);

  // Real-Time Container Width Observer
  useEffect(() => {
    if (!scrollContainerRef.current) return;

    let prevW = 0;
    let rafId = null;

    const updateWidth = (measuredWidth) => {
      const w = Math.floor(measuredWidth - (isMobile ? 24 : 48));
      if (w > 300 && Math.abs(w - prevW) >= 8) {
        prevW = w;
        setContainerWidth(w);
      }
    };

    const resizeObserver = new ResizeObserver((entries) => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        for (let entry of entries) {
          if (entry.contentRect.width) {
            updateWidth(entry.contentRect.width);
          }
        }
      });
    });

    resizeObserver.observe(scrollContainerRef.current);
    updateWidth(scrollContainerRef.current.clientWidth);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
    };
  }, [isMobile, status]);

  const isZoomingRef = useRef(false);

  useEffect(() => {
    isZoomingRef.current = true;
    const timer = setTimeout(() => {
      isZoomingRef.current = false;
    }, 450);
    return () => clearTimeout(timer);
  }, [scale]);

  // Intersection Observer for Current Visible Page Tracking
  useEffect(() => {
    if (status !== 'ready' || !numPages || !scrollContainerRef.current) return;

    const visibleRatios = new Map();

    const observer = new IntersectionObserver(
      (entries) => {
        if (isZoomingRef.current) return;
        entries.forEach((entry) => {
          const pIndex = Number(entry.target.getAttribute('data-page-num'));
          if (!pIndex) return;
          if (entry.isIntersecting) {
            visibleRatios.set(pIndex, entry.intersectionRatio);
          } else {
            visibleRatios.delete(pIndex);
          }
        });

        if (visibleRatios.size > 0) {
          let maxRatio = -1;
          let bestPage = pageNumRef.current;
          visibleRatios.forEach((ratio, pIndex) => {
            if (ratio > maxRatio) {
              maxRatio = ratio;
              bestPage = pIndex;
            }
          });
          if (bestPage && bestPage !== pageNumRef.current && maxRatio >= 0.2) {
            setPageNum(bestPage);
          }
        }
      },
      {
        root: scrollContainerRef.current,
        threshold: [0.1, 0.3, 0.6, 0.8],
      }
    );

    Object.values(pageRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [status, numPages]);

  // Scroll to Specific Page
  const scrollToPage = (p, behavior = 'smooth') => {
    const target = Math.max(1, Math.min(p, numPages));
    setPageNum(target);

    const pageEl = pageRefs.current[target];
    if (pageEl) {
      pageEl.scrollIntoView({ behavior, block: 'start' });
    }
  };

  const pendingScrollRef = useRef(null);

  const commitZoomScale = useCallback((targetScale, anchor = null, baseScroll = null, baseScale = null) => {
    const clamped = Math.max(0.5, Math.min(targetScale, 3.0));
    const container = scrollContainerRef.current;
    const currentS = baseScale || scaleRef.current || 1.0;

    if (!container || Math.abs(currentS - clamped) < 0.001) {
      setScale(clamped);
      return;
    }

    const scaleFactor = clamped / currentS;

    let px = container.clientWidth / 2;
    let py = container.clientHeight / 2;
    if (anchor && typeof anchor.x === 'number' && typeof anchor.y === 'number') {
      px = anchor.x;
      py = anchor.y;
    }

    const startScrollLeft = baseScroll ? baseScroll.left : container.scrollLeft;
    const startScrollTop = baseScroll ? baseScroll.top : container.scrollTop;

    const newScrollLeft = Math.round((startScrollLeft + px) * scaleFactor - px);
    const newScrollTop = Math.round((startScrollTop + py) * scaleFactor - py);

    pendingScrollRef.current = {
      left: Math.max(0, newScrollLeft),
      top: Math.max(0, newScrollTop),
    };

    setScale(clamped);
  }, []);

  useLayoutEffect(() => {
    if (pendingScrollRef.current && scrollContainerRef.current) {
      const { left, top } = pendingScrollRef.current;
      scrollContainerRef.current.scrollLeft = left;
      scrollContainerRef.current.scrollTop = top;
      pendingScrollRef.current = null;
    }
    if (pagesWrapperRef.current) {
      pagesWrapperRef.current.style.transform = 'none';
      pagesWrapperRef.current.style.transformOrigin = 'center center';
      pagesWrapperRef.current.style.transition = 'none';
      pagesWrapperRef.current.style.willChange = 'auto';
    }
  }, [scale]);

  const prevPage = () => scrollToPage(pageNum - 1);
  const nextPage = () => scrollToPage(pageNum + 1);
  const zoomIn = () => commitZoomScale(getNextZoomIn(scale));
  const zoomOut = () => commitZoomScale(getPrevZoomOut(scale));
  const resetZoom = () => commitZoomScale(1.0);

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
      rootRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => { });
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => { });
    }
  };

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const scaleRef = useRef(scale);
  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  // Pointer- & Midpoint-Anchored GPU-Accelerated Zoom Engine
  useEffect(() => {
    const stageEl = rootRef.current || scrollContainerRef.current;
    if (!stageEl) return;

    let initialDist = 0;
    let initialScale = 1.0;
    let initialScroll = null;
    let currentFactor = 1.0;
    let isPinching = false;
    let isWheeling = false;
    let animationFrameId = null;
    let debounceTimer = null;
    let gestureTargetScale = null;
    let gestureAnchor = null;

    const clearTransformStyles = () => {
      if (pagesWrapperRef.current) {
        pagesWrapperRef.current.style.transform = 'none';
        pagesWrapperRef.current.style.transformOrigin = 'center center';
        pagesWrapperRef.current.style.transition = 'none';
        pagesWrapperRef.current.style.willChange = 'auto';
      }
    };

    const onTouchStart = (e) => {
      if (e.touches.length === 2) {
        if (e.cancelable) e.preventDefault();
        isPinching = true;
        initialDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        initialScale = scaleRef.current || 1.0;
        currentFactor = 1.0;

        if (scrollContainerRef.current && pagesWrapperRef.current) {
          const rect = scrollContainerRef.current.getBoundingClientRect();
          const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
          const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;
          gestureAnchor = { x: midX, y: midY };
          initialScroll = { left: scrollContainerRef.current.scrollLeft, top: scrollContainerRef.current.scrollTop };

          pagesWrapperRef.current.style.transformOrigin = `${midX}px ${midY}px`;
          pagesWrapperRef.current.style.transition = 'none';
          pagesWrapperRef.current.style.willChange = 'transform';
        }
      }
    };

    const onTouchMove = (e) => {
      if (e.touches.length === 2 && initialDist > 0 && isPinching) {
        if (e.cancelable) e.preventDefault();
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        currentFactor = dist / initialDist;
        const targetScale = Math.min(Math.max(initialScale * currentFactor, 0.5), 3.0);
        gestureTargetScale = targetScale;

        if (pagesWrapperRef.current) {
          pagesWrapperRef.current.style.transform = `scale(${targetScale / initialScale})`;
        }
      }
    };

    const onTouchEnd = (e) => {
      if (isPinching && e.touches.length < 2) {
        isPinching = false;
        const finalScale = gestureTargetScale || Math.min(Math.max(initialScale * currentFactor, 0.5), 3.0);
        const anchor = gestureAnchor;

        if (initialDist > 0 && Math.abs(currentFactor - 1.0) > 0.01) {
          commitZoomScale(finalScale, anchor, initialScroll, initialScale);
        } else {
          clearTransformStyles();
        }
        initialDist = 0;
        currentFactor = 1.0;
        gestureTargetScale = null;
        gestureAnchor = null;
        initialScroll = null;
      }
    };

    // Pointer-anchored wheel zoom (Ctrl / Cmd + Wheel)
    const onWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.cancelable) e.preventDefault();

        const container = scrollContainerRef.current;
        if (!container) return;

        if (!isWheeling) {
          initialScroll = { left: container.scrollLeft, top: container.scrollTop };
          initialScale = scaleRef.current || 1.0;
          isWheeling = true;
        }

        const rect = container.getBoundingClientRect();
        const anchorX = e.clientX - rect.left;
        const anchorY = e.clientY - rect.top;
        gestureAnchor = { x: anchorX, y: anchorY };

        const delta = e.deltaY;
        const factor = Math.pow(0.996, delta);
        const currentS = gestureTargetScale || scaleRef.current || 1.0;
        const targetScale = Math.min(Math.max(currentS * factor, 0.5), 3.0);
        gestureTargetScale = targetScale;

        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        animationFrameId = requestAnimationFrame(() => {
          if (pagesWrapperRef.current) {
            const visualRatio = targetScale / (initialScale || 1.0);
            pagesWrapperRef.current.style.transformOrigin = `${anchorX}px ${anchorY}px`;
            pagesWrapperRef.current.style.willChange = 'transform';
            pagesWrapperRef.current.style.transition = 'none';
            pagesWrapperRef.current.style.transform = `scale(${visualRatio})`;
          }
        });

        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          isWheeling = false;
          const finalScale = gestureTargetScale;
          const anchor = gestureAnchor;
          if (finalScale) {
            commitZoomScale(finalScale, anchor, initialScroll, initialScale);
          } else {
            clearTransformStyles();
          }
          gestureTargetScale = null;
          gestureAnchor = null;
          initialScroll = null;
        }, 160);
      }
    };

    const onGestureStart = (e) => {
      if (e.cancelable) e.preventDefault();
      initialScale = scaleRef.current || 1.0;
    };

    const onGestureChange = (e) => {
      if (e.cancelable) e.preventDefault();
      const targetScale = Math.min(Math.max(initialScale * e.scale, 0.5), 3.0);
      gestureTargetScale = targetScale;
      if (pagesWrapperRef.current) {
        pagesWrapperRef.current.style.transform = `scale(${targetScale / initialScale})`;
      }
    };

    const onGestureEnd = (e) => {
      if (e.cancelable) e.preventDefault();
      const finalScale = gestureTargetScale;
      if (finalScale) {
        commitZoomScale(finalScale);
      } else {
        clearTransformStyles();
      }
    };

    stageEl.addEventListener('touchstart', onTouchStart, { passive: false });
    stageEl.addEventListener('touchmove', onTouchMove, { passive: false });
    stageEl.addEventListener('touchend', onTouchEnd, { passive: false });
    stageEl.addEventListener('touchcancel', onTouchEnd, { passive: false });
    stageEl.addEventListener('wheel', onWheel, { passive: false });
    stageEl.addEventListener('gesturestart', onGestureStart, { passive: false });
    stageEl.addEventListener('gesturechange', onGestureChange, { passive: false });
    stageEl.addEventListener('gestureend', onGestureEnd, { passive: false });

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (debounceTimer) clearTimeout(debounceTimer);
      clearTransformStyles();
      stageEl.removeEventListener('touchstart', onTouchStart);
      stageEl.removeEventListener('touchmove', onTouchMove);
      stageEl.removeEventListener('touchend', onTouchEnd);
      stageEl.removeEventListener('touchcancel', onTouchEnd);
      stageEl.removeEventListener('wheel', onWheel);
      stageEl.removeEventListener('gesturestart', onGestureStart);
      stageEl.removeEventListener('gesturechange', onGestureChange);
      stageEl.removeEventListener('gestureend', onGestureEnd);
    };
  }, [commitZoomScale]);

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
                      { id: 'green', hex: '#4ade80' },
                      { id: 'pink', hex: '#f472b6' },
                      { id: 'blue', hex: '#38bdf8' },
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

              {/* View & Zoom Box */}
              <div className="pdf-rail-box">
                <span className="pdf-rail-box-label">ZOOM &amp; VIEW</span>
                <div className="pdf-rail-tools-row" style={{ marginBottom: '6px' }}>
                  <button
                    className="pdf-rail-btn"
                    onClick={zoomOut}
                    disabled={scale <= 0.5}
                    title="Zoom Out (-)"
                  >
                    −
                  </button>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--fg)', minWidth: '36px', textAlign: 'center', display: 'inline-block' }}>
                    {Math.round(scale * 100)}%
                  </span>
                  <button
                    className="pdf-rail-btn"
                    onClick={zoomIn}
                    disabled={scale >= 3.0}
                    title="Zoom In (+)"
                  >
                    +
                  </button>
                </div>
                <div className="pdf-rail-tools-row">
                  <button className="pdf-rail-btn" onClick={resetZoom} title="Reset Zoom (0)">
                    100%
                  </button>
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
          >
            <div
              className="pdf-pages-inner-wrapper"
              ref={pagesWrapperRef}
              style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            >
              {Array.from({ length: numPages }, (_, i) => i + 1).map((pIndex) => {
                const bufferWindow = isMobile ? 3 : 5;
                const shouldRender = Math.abs(pIndex - pageNum) <= bufferWindow;
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

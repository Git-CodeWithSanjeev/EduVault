import React, { useState, useEffect, useRef, useCallback } from 'react';

// Priority: VITE_PROXY_URL env -> /api/proxy (Vercel Serverless Function) -> localhost:3001 (Local Dev)
const PROXY_BASE = import.meta.env.VITE_PROXY_URL || (import.meta.env.DEV ? 'http://localhost:3001/pdf/proxy' : '/api/proxy');

const PDFJS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const WORKER_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

/** Build the backend proxy URL */
export function proxyUrl(originalUrl) {
  if (!originalUrl) return '';
  if (originalUrl.startsWith('http://localhost:3001') || originalUrl.startsWith('/api/proxy')) return originalUrl;
  return `${PROXY_BASE}?url=${encodeURIComponent(originalUrl)}`;
}

/** Dynamically load PDF.js from CDN if not already present */
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
      <DownloadOverlay filename={dlFilename} progress={progress} phase={phase} />

      <button
        onClick={handleDownload}
        className={`${className} ${btnClass}`}
        disabled={phase === 'fetching'}
        style={{ position: 'relative', overflow: 'hidden', minWidth: '110px' }}
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

/* ─── PDF Canvas & Mobile Viewer ─────────────────────────────────────────── */
export function CanvasPDFViewer({ url, title }) {
  const [status, setStatus]     = useState('loading'); // loading | ready | error | fallback
  const [pdfDoc, setPdfDoc]     = useState(null);
  const [pageNum, setPageNum]   = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale]       = useState(1.2);
  const [rendering, setRendering] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('Loading PDF...');

  const canvasRef  = useRef(null);
  const renderTaskRef = useRef(null);
  const proxied    = proxyUrl(url);

  // Load PDF document using PDF.js
  useEffect(() => {
    let isCancelled = false;
    setStatus('loading');
    setLoadingMsg('Initializing PDF renderer...');
    setPageNum(1);
    setPdfDoc(null);

    loadPdfJsScript()
      .then((pdfjs) => {
        if (isCancelled) return;
        setLoadingMsg('Fetching PDF document...');
        
        return pdfjs.getDocument({
          url: proxied,
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
      .catch((err) => {
        console.warn('PDF.js rendering failed, attempting direct fetch or fallback:', err);
        if (isCancelled) return;
        // Fallback to Google Docs embedded viewer iframe if PDF.js direct render fails
        setStatus('fallback');
      });

    return () => {
      isCancelled = true;
    };
  }, [proxied, url]);

  // Render canvas for current page & scale
  const renderPage = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current) return;

    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
    }

    try {
      setRendering(true);
      const page = await pdfDoc.getPage(pageNum);
      const canvas = canvasRef.current;
      if (!canvas) return;

      const viewport = page.getViewport({ scale });
      const context  = canvas.getContext('2d');

      // Adjust scale dynamically for smaller screens if scale is 1.2
      const containerWidth = canvas.parentElement?.clientWidth || window.innerWidth;
      let targetScale = scale;
      if (containerWidth < 600) {
        // Fit page to screen width on mobile
        targetScale = (containerWidth - 24) / page.getViewport({ scale: 1.0 }).width;
      }

      const responsiveViewport = page.getViewport({ scale: targetScale });

      canvas.height = responsiveViewport.height;
      canvas.width  = responsiveViewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: responsiveViewport,
      };

      const renderTask = page.render(renderContext);
      renderTaskRef.current = renderTask;
      await renderTask.promise;
      setRendering(false);
    } catch (err) {
      if (err?.name !== 'RenderingCancelledException') {
        console.error('Error rendering page:', err);
      }
      setRendering(false);
    }
  }, [pdfDoc, pageNum, scale]);

  useEffect(() => {
    if (status === 'ready' && pdfDoc) {
      renderPage();
    }
  }, [status, pdfDoc, pageNum, scale, renderPage]);

  // Page controls
  const prevPage = () => setPageNum((p) => Math.max(p - 1, 1));
  const nextPage = () => setPageNum((p) => Math.min(p + 1, numPages));
  const zoomIn   = () => setScale((s) => Math.min(s + 0.25, 3.0));
  const zoomOut  = () => setScale((s) => Math.max(s - 0.25, 0.6));

  const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;

  return (
    <div className="pdf-viewer-root">
      {/* Top Controls Bar */}
      <div className="pdf-viewer-topbar">
        <div className="pdf-title-block">
          <span className="pdf-viewer-title" title={title}>📄 {title}</span>
        </div>

        {status === 'ready' && (
          <div className="pdf-controls-group">
            <button
              className="pdf-ctrl-btn"
              onClick={prevPage}
              disabled={pageNum <= 1}
              title="Previous Page"
            >
              ◀
            </button>
            <span className="pdf-page-indicator">
              {pageNum} / {numPages}
            </span>
            <button
              className="pdf-ctrl-btn"
              onClick={nextPage}
              disabled={pageNum >= numPages}
              title="Next Page"
            >
              ▶
            </button>
            <div className="pdf-divider" />
            <button className="pdf-ctrl-btn" onClick={zoomOut} title="Zoom Out">-</button>
            <span className="pdf-zoom-level">{Math.round(scale * 100)}%</span>
            <button className="pdf-ctrl-btn" onClick={zoomIn} title="Zoom In">+</button>
          </div>
        )}

        <div className="pdf-action-group">
          <DownloadPDFButton url={url} filename={title + '.pdf'} label="📥 Download" className="pdf-btn" />
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="pdf-btn secondary"
            style={{ padding: '6px 12px', fontSize: '11px' }}
          >
            ↗ Open External
          </a>
        </div>
      </div>

      {/* Main Stage */}
      <div className="pdf-viewer-stage">
        {status === 'loading' && (
          <div className="pdf-loading-overlay">
            <div className="pdf-spinner" />
            <span>{loadingMsg}</span>
          </div>
        )}

        {status === 'ready' && (
          <div className="pdf-canvas-wrapper">
            {rendering && (
              <div className="pdf-render-badge">Rendering page {pageNum}…</div>
            )}
            <canvas ref={canvasRef} className="pdf-canvas" />
          </div>
        )}

        {status === 'fallback' && (
          <div className="pdf-fallback-container">
            <iframe
              src={googleViewerUrl}
              title={title}
              className="pdf-iframe-fallback"
              onError={() => setStatus('error')}
            />
          </div>
        )}

        {status === 'error' && (
          <div className="pdf-loading-overlay">
            <span style={{ fontSize: '36px' }}>⚠️</span>
            <span style={{ fontWeight: 700, fontSize: '15px' }}>Could not load PDF on mobile screen</span>
            <p style={{ fontSize: '12px', opacity: 0.8, textAlign: 'center', maxWidth: '300px' }}>
              The file source can be downloaded directly or opened in your mobile browser's default reader.
            </p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
              <DownloadPDFButton url={url} filename={title + '.pdf'} label="📥 Download PDF" className="pdf-btn" />
              <a href={url} target="_blank" rel="noopener noreferrer" className="pdf-btn secondary">
                Open in Browser ↗
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CanvasPDFViewer;


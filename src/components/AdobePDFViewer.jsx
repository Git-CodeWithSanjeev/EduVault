import React, { useEffect, useState, useRef } from 'react';
import { proxyUrl } from '../utils/pdfHelpers';

const ADOBE_SDK_SRC = 'https://acrobatservices.adobe.com/view-sdk/viewer.js';
const DEFAULT_CLIENT_ID = '77e2671a6d444f8a8709760aa2ca4e9d'; // User's Adobe PDF Embed API Client ID

/** Dynamically load Adobe View SDK script reliably */
function loadAdobeScript() {
  return new Promise((resolve, reject) => {
    const isReady = () =>
      typeof window !== 'undefined' &&
      window.AdobeDC &&
      typeof window.AdobeDC.View === 'function';

    if (isReady()) {
      resolve();
      return;
    }

    const handleReady = () => {
      if (isReady()) {
        resolve();
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('adobe_dc_view_sdk.ready', handleReady);
    }

    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (isReady()) {
        clearInterval(interval);
        if (typeof document !== 'undefined') {
          document.removeEventListener('adobe_dc_view_sdk.ready', handleReady);
        }
        resolve();
      } else if (attempts > 300) {
        clearInterval(interval);
        if (typeof document !== 'undefined') {
          document.removeEventListener('adobe_dc_view_sdk.ready', handleReady);
        }
        reject(new Error('Adobe View SDK load timeout'));
      }
    }, 50);

    const existingScript = document.getElementById('adobe-view-sdk-script');
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'adobe-view-sdk-script';
      script.src = ADOBE_SDK_SRC;
      script.async = true;
      script.onerror = () => {
        clearInterval(interval);
        reject(new Error('Failed to load Adobe View SDK script from CDN'));
      };
      document.head.appendChild(script);
    }
  });
}

// In-memory cache for instant view mode transitions without re-fetching
const pdfBufferCache = new Map();

export function AdobePDFViewer({
  url,
  title,
  isMobile = false,
  viewMode = 'FIT_WIDTH',
  onApiReady,
  readUrl,
  sourceUrl,
}) {
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(!pdfBufferCache.has(proxyUrl(url)));
  const [error, setError] = useState(null);
  const [viewFallbackEmbed, setViewFallbackEmbed] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const adobeViewRef = useRef(null);

  const containerId = useRef(`adobe-pdf-view-${Math.random().toString(36).substring(2, 8)}`).current;

  const handleRetry = () => {
    const targetUrl = proxyUrl(url);
    pdfBufferCache.delete(targetUrl);
    setError(null);
    setViewFallbackEmbed(false);
    setLoading(true);
    setRetryCount((c) => c + 1);
  };

  useEffect(() => {
    let isCancelled = false;
    const targetUrl = proxyUrl(url);

    if (!pdfBufferCache.has(targetUrl)) {
      setLoading(true);
    }
    setError(null);

    const initAdobeViewer = async () => {
      try {
        await loadAdobeScript();
        if (isCancelled) return;

        if (!window.AdobeDC || !window.AdobeDC.View) {
          throw new Error('Adobe PDF View SDK failed to initialize');
        }

        const LOCALHOST_KEY = '3f4a35af329a493a9562b7134b374e4e'; // EduVault Local Key
        const PROD_KEY = import.meta.env.VITE_ADOBE_CLIENT_ID_PROD || '77e2671a6d444f8a8709760aa2ca4e9d'; // EduVault Vercel Key

        const isLocal = typeof window !== 'undefined' &&
          (window.location.hostname === 'localhost' ||
           window.location.hostname === '127.0.0.1' ||
           /^10\./.test(window.location.hostname) ||
           /^192\.168\./.test(window.location.hostname) ||
           /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(window.location.hostname));

        const activeClientId = isLocal ? LOCALHOST_KEY : PROD_KEY;

        const targetElem = document.getElementById(containerId);
        if (isCancelled || !targetElem) return;

        // Clear any previous child nodes if reusing
        targetElem.innerHTML = '';

        // Fetch ArrayBuffer first to validate upstream HTTP status and prevent Adobe SDK internal dialog crashes on 503/502
        let contentPayload;
        if (pdfBufferCache.has(targetUrl)) {
          contentPayload = { promise: Promise.resolve(pdfBufferCache.get(targetUrl)) };
        } else {
          try {
            const res = await fetch(targetUrl);
            if (!res.ok) {
              let detailMsg = `HTTP ${res.status} (${res.statusText || 'Error'})`;
              try {
                const errData = await res.json();
                if (errData.error) detailMsg = `${errData.error}${errData.details ? ` (${errData.details})` : ''}`;
              } catch {}
              throw new Error(`Upstream server returned ${detailMsg}`);
            }
            const buffer = await res.arrayBuffer();
            pdfBufferCache.set(targetUrl, buffer);
            contentPayload = { promise: Promise.resolve(buffer) };
          } catch (fetchErr) {
            if (isCancelled) return;
            throw new Error(fetchErr.message || 'Failed to fetch PDF file');
          }
        }

        if (isCancelled || !document.getElementById(containerId)) return;

        // Initialize Adobe DC View
        const adobeDCView = new window.AdobeDC.View({
          clientId: activeClientId,
          divId: containerId,
        });

        adobeViewRef.current = adobeDCView;

        const cleanTitle = title || 'document.pdf';
        const fileId = (url || cleanTitle || 'eduvault_pdf').replace(/[^a-zA-Z0-9-_]/g, '_').slice(-64) || 'doc_id';

        // Preview File using Adobe PDF Embed API without Adobe floating bar/logo
        const viewerPromise = adobeDCView.previewFile(
          {
            content: contentPayload,
            metaData: {
              fileName: cleanTitle,
              id: fileId,
            },
          },
          {
            embedMode: 'FULL_WINDOW',
            showAnnotationTools: false,
            showDownloadPDF: false,
            showPrintPDF: false,
            showPageControls: false, // Disables Adobe bottom bar & red logo completely
            dockPageControls: false,
            showLeftHandPanel: false,
            enableAnnotationAPIs: true,
            includePDFAnnotations: true,
            defaultViewMode: viewMode || 'FIT_WIDTH',
          }
        );

        viewerPromise
          .then(async (adobeViewer) => {
            if (isCancelled) return;
            try {
              const apis = await adobeViewer.getAPIs();
              if (onApiReady && !isCancelled) {
                onApiReady({
                  apis,
                  adobeDCView,
                  adobeViewer,
                  container: document.getElementById(containerId),
                });
              }
            } catch (apiErr) {
              console.warn('Adobe getAPIs notice:', apiErr);
            }
          })
          .catch((previewErr) => {
            if (isCancelled) return;
            console.error('Adobe DC View previewFile error:', previewErr);
            setError(previewErr?.message || 'Error rendering document in Adobe Viewer');
            setLoading(false);
          });

        if (!isCancelled) {
          setLoading(false);
        }
      } catch (err) {
        if (isCancelled) return;
        console.error('Adobe PDF Embed error:', err);
        setError(err.message || 'Failed to render PDF using Adobe Reader');
        setLoading(false);
      }
    };

    initAdobeViewer();

    return () => {
      isCancelled = true;
      const el = document.getElementById(containerId);
      if (el) el.innerHTML = '';
    };
  }, [url, title, isMobile, containerId, onApiReady, retryCount]);

  const mobileHeight = typeof window !== 'undefined' ? `${window.innerHeight - 160}px` : '500px';
  const effectiveReadUrl = readUrl || (url.includes('archive.org/download/') ? url.replace('/download/', '/embed/').replace(/\.pdf$/i, '') : null);
  const googleDocsViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: isMobile ? mobileHeight : '100%',
      minHeight: isMobile ? '400px' : '600px',
      background: 'var(--bg, #f0fdf9)',
      borderRadius: 0,
      overflow: 'hidden',
    }}>
      {loading && !error && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', background: '#ffffff', zIndex: 10 }}>
          <span className="pdf-spinner" style={{ width: '32px', height: '32px' }} />
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--p)' }}>Loading…</span>
        </div>
      )}

      {/* Fallback Embed Viewer Mode */}
      {viewFallbackEmbed && effectiveReadUrl && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 15, background: '#ffffff', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '8px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>
              🌐 Web Reader Embed
            </span>
            <button
              onClick={() => setViewFallbackEmbed(false)}
              style={{
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 600,
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                cursor: 'pointer',
              }}
            >
              Back to Standard View
            </button>
          </div>
          <iframe
            src={effectiveReadUrl}
            title={title || 'Document Reader'}
            style={{ width: '100%', height: '100%', border: 'none', flex: 1 }}
            allowFullScreen
          />
        </div>
      )}

      {/* Error Fallback Screen */}
      {error && !viewFallbackEmbed && (() => {
        const is403 = error.includes('403');
        const is503or502 = error.includes('503') || error.includes('502');
        const isOpenLib = (sourceUrl && sourceUrl.includes('openlibrary.org')) || (url && url.includes('archive.org'));
        const directReadingUrl = sourceUrl || readUrl || url;

        return (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px 20px',
            background: '#ffffff',
            zIndex: 12,
            textAlign: 'center',
            overflowY: 'auto',
          }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: is403 ? '#ecfdf5' : '#fef2f2',
              color: is403 ? '#059669' : '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              marginBottom: '14px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            }}>
              {is403 ? '📖' : '⚠️'}
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0' }}>
              {is403
                ? 'Open Library Digital Edition'
                : is503or502
                ? 'Document Temporarily Unavailable'
                : 'Document Load Error'}
            </h3>

            <p style={{
              fontSize: '13px',
              color: '#475569',
              maxWidth: '440px',
              lineHeight: 1.5,
              margin: '0 0 18px 0',
            }}>
              {is403
                ? 'Direct raw PDF download for this title is restricted under Open Library digital lending copyright. You can borrow and read the digital edition directly on Open Library for free.'
                : is503or502
                ? 'The remote document host (e.g. Internet Archive) is currently offline, undergoing maintenance, or experiencing high traffic.'
                : error}
            </p>

            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '10px',
              justifyContent: 'center',
              alignItems: 'center',
              maxWidth: '420px',
            }}>
              {isOpenLib && directReadingUrl && (
                <a
                  href={directReadingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    background: 'var(--p, #0d9488)',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 700,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 6px rgba(13, 148, 136, 0.25)',
                  }}
                >
                  📖 Borrow & Read on Open Library ↗
                </a>
              )}

              {effectiveReadUrl && effectiveReadUrl !== directReadingUrl && (
                <button
                  onClick={() => setViewFallbackEmbed(true)}
                  style={{
                    padding: '9px 16px',
                    borderRadius: '8px',
                    background: '#f0fdf9',
                    color: '#0f766e',
                    border: '1px solid #99f6e4',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  🌐 Embedded Web Reader
                </button>
              )}

              <a
                href={googleDocsViewerUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '9px 16px',
                  borderRadius: '8px',
                  background: '#f8fafc',
                  color: '#334155',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                📄 Google Docs Viewer ↗
              </a>

              <button
                onClick={handleRetry}
                style={{
                  padding: '9px 16px',
                  borderRadius: '8px',
                  background: '#ffffff',
                  color: '#64748b',
                  border: '1px solid #e2e8f0',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                🔄 Retry
              </button>
            </div>
          </div>
        );
      })()}

      {/* 1. Rectangular EduVault Logo Cover */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          height: '38px',
          padding: '0 14px 0 10px',
          background: '#ffffff',
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          border: 'none',
          boxShadow: 'none',
          userSelect: 'none',
        }}
        title="EduVault Reader"
      >
        <img
          src="/logo.png"
          alt="EduVault"
          style={{ height: '22px', width: '22px', objectFit: 'contain' }}
        />
        <span
          style={{
            fontSize: '13px',
            fontWeight: 800,
            color: 'var(--p-dark, #0f766e)',
            letterSpacing: '-0.2px',
            whiteSpace: 'nowrap',
            fontFamily: 'inherit',
          }}
        >
          EduVault
        </span>
      </div>

      {/* 2. Cover Top-Right 3-Dots Menu (keeps Search icon on the left of it active) */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '36px',
          height: '36px',
          background: '#ffffff',
          zIndex: 20,
        }}
      />

      <div
        id={containerId}
        ref={containerRef}
        style={{
          width: '100%',
          height: isMobile ? mobileHeight : '100%',
          minHeight: isMobile ? '400px' : '550px',
        }}
      />
    </div>
  );
}

/* ─── Download PDF Button Helper ───────────────────────────────────────────── */
export function DownloadPDFButton({ url, filename, label, className = 'pdf-btn' }) {
  const [phase, setPhase] = useState('idle');

  const handleDownload = async (e) => {
    e.preventDefault();
    if (phase === 'fetching') return;
    setPhase('fetching');

    try {
      let res;
      try {
        res = await fetch(proxyUrl(url));
      } catch {
        res = await fetch(url);
      }
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename || url.split('/').pop() || 'document.pdf';
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

export default AdobePDFViewer;

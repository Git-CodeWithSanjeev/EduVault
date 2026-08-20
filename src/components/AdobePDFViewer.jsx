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

export function AdobePDFViewer({ url, title, isMobile = false, viewMode = 'FIT_WIDTH', onApiReady }) {
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(!pdfBufferCache.has(proxyUrl(url)));
  const [error, setError] = useState(null);
  const adobeViewRef = useRef(null);

  const containerId = useRef(`adobe-pdf-view-${Math.random().toString(36).substring(2, 8)}`).current;

  useEffect(() => {
    let isCancelled = false;
    if (!pdfBufferCache.has(proxyUrl(url))) {
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

        // Initialize Adobe DC View
        const adobeDCView = new window.AdobeDC.View({
          clientId: activeClientId,
          divId: containerId,
        });

        adobeViewRef.current = adobeDCView;

        const cleanTitle = title || 'document.pdf';
        const fileId = (url || cleanTitle || 'eduvault_pdf').replace(/[^a-zA-Z0-9-_]/g, '_').slice(-64) || 'doc_id';
        const targetUrl = proxyUrl(url);

        // Fetch or retrieve ArrayBuffer from memory cache for instant switching
        let contentPayload;
        if (pdfBufferCache.has(targetUrl)) {
          contentPayload = { promise: Promise.resolve(pdfBufferCache.get(targetUrl)) };
        } else {
          try {
            const res = await fetch(targetUrl);
            if (res.ok) {
              const buffer = await res.arrayBuffer();
              pdfBufferCache.set(targetUrl, buffer);
              contentPayload = { promise: Promise.resolve(buffer) };
            } else {
              contentPayload = { location: { url: targetUrl } };
            }
          } catch {
            contentPayload = { location: { url: targetUrl } };
          }
        }

        if (isCancelled || !document.getElementById(containerId)) return;

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
          .catch(() => {});

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
  }, [url, title, isMobile, containerId, onApiReady]);

  const mobileHeight = typeof window !== 'undefined' ? `${window.innerHeight - 160}px` : '500px';

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
      {loading && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', background: '#ffffff', zIndex: 10 }}>
          <span className="pdf-spinner" style={{ width: '32px', height: '32px' }} />
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--p)' }}>Loading…</span>
        </div>
      )}

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

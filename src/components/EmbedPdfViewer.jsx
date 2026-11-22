import React, { useEffect, useRef, useState } from 'react';
import { proxyUrl } from '../utils/pdfHelpers';

/**
 * Global dynamic loader for EmbedPDF Web Component
 * Based on https://github.com/embedpdf/embed-pdf-viewer
 * Registers the <embedpdf-viewer> custom element with PDFium WASM engine.
 */
let embedPdfScriptPromise = null;

export function loadEmbedPdfScript() {
  if (typeof window === 'undefined') return Promise.resolve();

  // If already registered in customElements registry
  if (window.customElements && window.customElements.get('embedpdf-viewer')) {
    return Promise.resolve();
  }

  if (!embedPdfScriptPromise) {
    embedPdfScriptPromise = new Promise((resolve, reject) => {
      // Check if tag already exists in DOM
      const existing = document.querySelector('script[data-embedpdf-loader]');
      if (existing) {
        let attempts = 0;
        const interval = setInterval(() => {
          attempts++;
          if (window.customElements && window.customElements.get('embedpdf-viewer')) {
            clearInterval(interval);
            resolve();
          } else if (attempts > 100) {
            clearInterval(interval);
            resolve(); // proceed anyway
          }
        }, 50);
        return;
      }

      const script = document.createElement('script');
      script.type = 'module';
      script.src = 'https://cdn.jsdelivr.net/npm/@embedpdf/viewer@3/dist/embedpdf.js';
      script.setAttribute('data-embedpdf-loader', 'true');

      script.onload = () => {
        let attempts = 0;
        const interval = setInterval(() => {
          attempts++;
          if (window.customElements && window.customElements.get('embedpdf-viewer')) {
            clearInterval(interval);
            resolve();
          } else if (attempts > 60) {
            clearInterval(interval);
            resolve();
          }
        }, 50);
      };

      script.onerror = (err) => {
        console.warn('[EmbedPDF] Failed to load WASM script from CDN:', err);
        reject(err);
      };

      document.head.appendChild(script);
    });
  }

  return embedPdfScriptPromise;
}

/**
 * Modern EmbedPDF Viewer Component
 * Features:
 *  - High-performance PDFium WebAssembly rendering engine
 *  - Thumbnail drawer & navigation sidebar
 *  - In-document full text search with highlighting
 *  - Text selection, highlight, underline, annotations & comments
 *  - Zoom, fit-width, fit-page, and rotation
 *  - Print & direct download
 *  - Theme switching (light / dark)
 */
export function EmbedPdfViewer({
  url,
  cloudUrl,
  title,
  theme = 'light',
  className = 'embedpdf-container',
  style = { width: '100%', height: '100%', minHeight: '600px', display: 'block' },
  onReady,
  onError,
}) {
  const [isScriptReady, setIsScriptReady] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const elementRef = useRef(null);

  // 1. Resolve proxy URL with CORS headers enabled
  const targetPdfUrl = cloudUrl || url;
  const activePdfSource = targetPdfUrl ? proxyUrl(targetPdfUrl) : null;

  // 2. Load EmbedPDF script asynchronously
  useEffect(() => {
    let isMounted = true;

    loadEmbedPdfScript()
      .then(() => {
        if (isMounted) setIsScriptReady(true);
      })
      .catch((err) => {
        if (isMounted) {
          setLoadError(err);
          if (onError) onError(err);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [onError]);

  // 3. Attach properties and event listeners to the custom element
  useEffect(() => {
    const el = elementRef.current;
    if (!el || !isScriptReady || !activePdfSource) return;

    try {
      // Set properties on the custom element
      el.src = activePdfSource;
      el.theme = theme;

      const handleReady = (e) => {
        if (onReady) onReady(el.viewer || e.detail);
      };

      el.addEventListener('epdf:ready', handleReady);
      return () => {
        el.removeEventListener('epdf:ready', handleReady);
      };
    } catch (err) {
      console.warn('[EmbedPDF] Config error:', err);
    }
  }, [isScriptReady, activePdfSource, theme, onReady]);

  // Fallback state if CDN script fails
  if (loadError) {
    return (
      <div style={{
        padding: '32px',
        textAlign: 'center',
        background: '#f8fafc',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        margin: '24px',
      }}>
        <p style={{ fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
          ⚠️ EmbedPDF WebAssembly engine could not be loaded
        </p>
        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
          Your network connection may be blocking the external engine script.
        </p>
        <a
          href={targetPdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="action-btn active"
          style={{ textDecoration: 'none', display: 'inline-block' }}
        >
          Open PDF in New Tab
        </a>
      </div>
    );
  }

  // Loading skeleton state
  if (!isScriptReady) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        minHeight: '560px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
        gap: '16px',
      }}>
        <div style={{
          width: '42px',
          height: '42px',
          border: '3px solid #e2e8f0',
          borderTopColor: '#0d9488',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <p style={{ fontSize: '14px', fontWeight: 600, color: '#475569' }}>
          Initializing EmbedPDF Engine…
        </p>
        <span style={{ fontSize: '12px', color: '#94a3b8' }}>
          {title || 'Loading document'}
        </span>
      </div>
    );
  }

  return (
    <embedpdf-viewer
      ref={elementRef}
      src={activePdfSource}
      theme={theme}
      class={className}
      style={style}
    />
  );
}

export default EmbedPdfViewer;

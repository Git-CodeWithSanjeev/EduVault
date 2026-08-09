import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { items } from '../data/openItems';
import { CanvasPDFViewer, DownloadPDFButton } from './CanvasPDFViewer';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Generate the list of chapter PDF URLs for an NCERT book */
export function getChapterPdfUrls(book) {
  if (book.source === 'NCERT' && book.url) {
    const match = book.url.match(/\/pdf\/([a-z0-9]+)dd\.zip/i);
    const code = match ? match[1] : null;

    if (code) {
      return [
        { id: 'ps', name: '0. Prelims & Index',  pdfUrl: `https://ncert.nic.in/textbook/pdf/${code}ps.pdf` },
        { id: '01', name: '1. Chapter 1',         pdfUrl: `https://ncert.nic.in/textbook/pdf/${code}01.pdf` },
        { id: '02', name: '2. Chapter 2',         pdfUrl: `https://ncert.nic.in/textbook/pdf/${code}02.pdf` },
        { id: '03', name: '3. Chapter 3',         pdfUrl: `https://ncert.nic.in/textbook/pdf/${code}03.pdf` },
        { id: '04', name: '4. Chapter 4',         pdfUrl: `https://ncert.nic.in/textbook/pdf/${code}04.pdf` },
        { id: '05', name: '5. Chapter 5',         pdfUrl: `https://ncert.nic.in/textbook/pdf/${code}05.pdf` },
        { id: '06', name: '6. Chapter 6',         pdfUrl: `https://ncert.nic.in/textbook/pdf/${code}06.pdf` },
        { id: 'an', name: '7. Answers & Solutions', pdfUrl: `https://ncert.nic.in/textbook/pdf/${code}an.pdf` },
      ];
    }
  }

  return [
    { id: 'full', name: `${book.title} (Full PDF)`, pdfUrl: book.pdfUrl || book.url },
  ];
}

// ---------------------------------------------------------------------------
// PDFReader Component
// ---------------------------------------------------------------------------

export function PDFReader({ saved, toggle }) {
  const { id } = useParams();
  const b = items.find((x) => x.id === id);
  const [activeChapIdx, setActiveChapIdx] = useState(0);

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

  const chapterPdfs     = getChapterPdfUrls(b);
  const activeChapter   = chapterPdfs[activeChapIdx] ?? chapterPdfs[0];

  return (
    <div className="pdf-reader-container" id="pdf-reader-stage">

      {/* ── Toolbar ── */}
      <div className="pdf-toolbar">
        <div className="pdf-toolbar-header">
          <Link to="/library" className="pdf-btn secondary">← Library</Link>
          <div className="pdf-toolbar-info">
            <h3 title={b.title}>{b.title}</h3>
            <small style={{ color: '#a0a0b0', fontSize: '11px' }}>
              {b.source} · {b.subject} · <span className="active-chap-tag">{activeChapter.name}</span>
            </small>
          </div>
        </div>

        <div className="pdf-toolbar-actions">
          <button className="pdf-btn secondary" onClick={() => toggle(b.id)}>
            {saved.includes(b.id) ? '★ Saved' : '☆ Save'}
          </button>
          <DownloadPDFButton
            url={activeChapter.pdfUrl}
            filename={`${b.title} - ${activeChapter.name}.pdf`}
            label="📥 Download PDF"
          />
        </div>
      </div>

      {/* ── Mobile Chapter Bar (visible only on mobile screens) ── */}
      {chapterPdfs.length > 1 && (
        <div className="mobile-chapter-bar">
          <span className="mobile-chap-label">📖 Select Chapter:</span>
          <div className="mobile-chap-pills">
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
        </div>
      )}

      {/* ── Body: PDF viewer (left) + chapter list (right desktop) ── */}
      <div className="reader-body-layout">

        {/* PDF Viewer */}
        <div className="reader-stage-container">
          <CanvasPDFViewer
            key={activeChapter.pdfUrl}
            url={activeChapter.pdfUrl}
            title={activeChapter.name}
          />
        </div>

        {/* Chapter Sidebar (Desktop View) */}
        <div className="reader-sidebar">
          <div className="reader-sidebar-title">
            <span>📚 Chapters</span>
            <span style={{ fontSize: '10px', background: '#2a2840', color: '#9b8bf4', padding: '2px 8px', borderRadius: '4px' }}>
              {chapterPdfs.length} PDFs
            </span>
          </div>

          {chapterPdfs.map((ch, idx) => (
            <div
              key={ch.id}
              className={`chapter-nav-item ${activeChapIdx === idx ? 'active' : ''}`}
              onClick={() => setActiveChapIdx(idx)}
            >
              <span>{ch.name}</span>
              <span className="chapter-badge">PDF</span>
            </div>
          ))}

          <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid #282834' }}>
            <div style={{ fontSize: '11px', color: '#8d8aa0', marginBottom: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Official Archive
            </div>
            <Link
              to={`/go/${b.id}`}
              style={{ fontSize: '12px', color: '#9b8bf4', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 12px', background: '#1c1c2e', borderRadius: '8px', border: '1px solid #2e2e44' }}
            >
              📥 Download Full Book Zip ↗
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}

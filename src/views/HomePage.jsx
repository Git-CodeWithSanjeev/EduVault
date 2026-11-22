'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from '../utils/routerCompat';
import { items } from '../data/openItems';
import { ncertBooks } from '../data/ncertBooksData';
import { educationalGalleryData } from '../data/educationalGalleryData';
import { VideoCard } from '../components/VideoCard';
import { BookCard } from '../components/BookCard';
import { useAuth } from '../context/AuthContext';
import { triggerAuthPrompt } from '../utils/authPrompt';

export function Home({ saved = [], toggle = () => { } }) {
  const { isLoggedIn } = useAuth();
  const [selectedSubject, setSelectedSubject] = useState('Mathematics');
  const [selectedGrade, setSelectedGrade] = useState('Class 10');

  // Subjects configuration matching the design
  const subjects = [
    { id: 'Mathematics', label: 'Mathematics' },
    { id: 'Physics', label: 'Physics' },
    { id: 'Chemistry', label: 'Chemistry' },
    { id: 'Computer Science', label: 'Computer Science' },
  ];

  // Grade levels configuration matching the design
  const grades = [
    { id: 'Class 10', label: 'Class 10' },
    { id: 'Class 11', label: 'Class 11' },
    { id: 'Class 12', label: 'Class 12' },
    { id: 'UG', label: 'UG' },
  ];

  // Continue Learning State backed by localStorage
  const [recentBook, setRecentBook] = useState({
    id: 'ncert-leph1',
    title: 'Physics Part 1 – Class 12',
    progress: 65,
  });

  const handleSaveBook = (bookId) => {
    if (!isLoggedIn) {
      triggerAuthPrompt({
        feature: 'Save to My Library',
        title: 'Sign In to Save Books',
        message: 'Please sign in or create an account to save books to your personal library and access them across all your devices.',
        from: window.location.pathname,
      });
      return;
    }
    toggle(bookId);
  };

  useEffect(() => {
    try {
      const storedRecent = JSON.parse(localStorage.getItem('eduvault-recent') || '[]');
      if (Array.isArray(storedRecent) && storedRecent.length > 0) {
        const found = [...items, ...ncertBooks].find((x) => x.id === storedRecent[0]);
        if (found) {
          setRecentBook({
            id: found.id,
            title: found.title,
            progress: 68,
          });
        }
      }
    } catch (_) { }
  }, []);

  // Canonical 3 video playlists from the target design
  const canonicalVideos = useMemo(() => [
    {
      id: 'class-12-quantum-mechanics',
      videoId: 'quantum-mechanics',
      title: 'Introduction to Quantum Mechanics',
      description: 'Introduction to quantum science, video courses... and quantum mechanics.',
      channel: 'Samantha Ray',
      tier: 'Class 12',
      level: 'Class 12',
      duration: '12 Hours · 24 Videos',
      theme: 'quantum',
      badgePosition: 'left',
    },
    {
      id: 'ug-organic-chemistry',
      videoId: 'organic-chemistry',
      title: 'Organic Chemistry Masterclass',
      description: 'Organic chemistry masterclass chemistry and lots few more.',
      channel: 'James Miller',
      tier: 'Undergraduate (UG)',
      level: 'UG',
      duration: '12 Hours · 24 Videos',
      theme: 'organic-chem',
      badgePosition: 'right',
    },
    {
      id: 'cs-masterclass',
      videoId: 'cs-masterclass-vid',
      title: 'Computer Science Masterclass',
      description: 'Learn programming with molecular and computer.',
      channel: 'Soran Jenkins',
      tier: 'Class 12',
      level: 'Class 12',
      duration: '12 Hours · 24 Videos',
      theme: 'cs-tech',
      badgePosition: 'left',
    },
  ], []);

  // Filtered Video Playlists (Curated 3 cards matching design by default)
  const filteredVideos = useMemo(() => {
    if (selectedSubject === 'Mathematics' && selectedGrade === 'Class 10') {
      return canonicalVideos;
    }

    const sLower = selectedSubject.toLowerCase();
    const gLower = selectedGrade.toLowerCase();

    const matches = educationalGalleryData.filter((v) => {
      const vSub = (v.subject || v.focusArea || '').toLowerCase();
      const vTitle = (v.title || '').toLowerCase();
      const vTier = (v.tier || '').toLowerCase();
      const vLevel = String(v.level || v.classNum || '').toLowerCase();

      const matchSubject =
        vSub.includes(sLower) ||
        sLower.includes(vSub) ||
        vTitle.includes(sLower) ||
        (selectedSubject === 'Computer Science' && (vSub.includes('tech') || vSub.includes('computer') || vTitle.includes('web') || vTitle.includes('code') || vTitle.includes('python')));

      const matchGrade =
        selectedGrade === 'UG'
          ? (vTier.includes('ug') || vTier.includes('undergraduate') || vLevel.includes('ug'))
          : (vLevel.includes(gLower) || String(v.classNum) === selectedGrade.replace(/\D/g, '') || vTier.includes('class 1–12'));

      return matchSubject || matchGrade;
    });

    if (matches.length < 3) {
      return canonicalVideos;
    }
    return matches.slice(0, 3);
  }, [selectedSubject, selectedGrade, canonicalVideos]);

  // Canonical 3 textbooks matching the target design
  const canonicalBooks = useMemo(() => [
    {
      id: 'ncert-leph1',
      title: 'Physics Part 1',
      author: 'NCERT',
      level: 'Class 12',
      coverBadge: 'Indigo Cover',
      subject: 'Physics',
    },
    {
      id: 'ncert-kech1',
      title: 'Comprehensive Chemistry',
      author: 'NCERT',
      level: 'Class 11',
      coverBadge: 'Amber Cover',
      subject: 'Chemistry',
    },
    {
      id: 'biology',
      title: 'Biology: Life Sciences',
      author: 'NCERT',
      level: 'Class 12',
      coverBadge: 'Emerald Cover',
      subject: 'Biology',
    },
  ], []);

  // Featured Textbooks (3 items matching design)
  const featuredBooks = useMemo(() => {
    if (selectedSubject === 'Mathematics') {
      return canonicalBooks;
    }

    const allBooks = [...ncertBooks, ...items];
    const sLower = selectedSubject.toLowerCase();

    const matches = allBooks.filter((b) => {
      const bSub = (b.subject || b.category || '').toLowerCase();
      const bTitle = (b.title || '').toLowerCase();
      return bSub.includes(sLower) || bTitle.includes(sLower);
    });

    if (matches.length >= 3) {
      return matches.slice(0, 3);
    }
    return canonicalBooks;
  }, [selectedSubject, canonicalBooks]);

  // Horizontal pill scroll chevrons
  const pillsRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = pillsRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 6);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 6);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  return (
    <div className="home-content-container">
      {/* ─── 1. TWO-TONE HERO SECTION ─── */}
      <section className="hero-card-section">
        <div className="hero-grid-layout">
          {/* Header Area (Title & Subtitle) */}
          <div className="hero-header-area">
            <h1 className="hero-two-tone-title">
              Your trusted library for<br className="mobile-break" />{' '}
              <span className="accent">textbooks &amp; video</span><br className="mobile-break" />{' '}
              masterclasses
            </h1>

            <p className="hero-subtitle">
              Access high-quality open textbooks, video courses, and study resources absolutely free.
            </p>
          </div>

          {/* CTA Actions Area */}
          <div className="hero-cta-area">
            {/* Search Pill (Hidden on mobile) */}
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('open-search-modal'))}
              className="hero-search-pill"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <span style={{ color: '#64748b', fontSize: '12.5px', fontWeight: 500, flex: 1, textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Search NCERT, OpenStax, or video courses...
              </span>
              <kbd style={{ background: '#F1F5F9', color: '#64748b', padding: '3px 7px', borderRadius: '6px', fontSize: '10.5px', fontWeight: 700, flexShrink: 0 }}>
                Ctrl K
              </kbd>
            </button>

            {/* Stacked CTAs */}
            <div className="hero-cta-stack">
              <Link to="/library" className="hero-cta-primary">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                </svg>
                <span>Explore Textbooks</span>
              </Link>

              <Link to="/videos" className="hero-cta-secondary">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <circle cx="12" cy="12" r="10" />
                  <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" />
                </svg>
                <span>Watch Playlists</span>
              </Link>
            </div>
          </div>

          {/* Visual Area (3D Students Illustration & Frosted Trust Pill) */}
          <div className="hero-visual-area">
            <div className="hero-students-img-wrap">
              <img
                src="/images/hero-students.png"
                alt="EduVault students studying with textbooks and video masterclasses"
                width="1376"
                height="768"
                loading="eager"
                fetchPriority="high"
                className="hero-students-img"
              />
            </div>

            {/* Frosted-Glass Trust Pill (Desktop & Tablet) */}
            <div className="hero-trust-pill desktop-hero-trust-pill">
              <span style={{ color: '#eab308' }}>⭐</span>
              <span>200+ Open Books</span>
              <span style={{ color: '#cbd5e1' }}>•</span>
              <span className="desktop-only-trust-item">50+ Video Courses</span>
              <span className="desktop-only-trust-item" style={{ color: '#cbd5e1' }}>•</span>
              <span>100% Free &amp; Verified</span>
            </div>
          </div>

          {/* Frosted-Glass Trust Pill (Mobile: centered across full card width below actions + visual) */}
          <div className="hero-trust-pill mobile-hero-trust-pill">
            <span style={{ color: '#eab308', flexShrink: 0 }}>⭐</span>
            <span style={{ flexShrink: 0 }}>200+ Open Books</span>
            <span style={{ color: '#cbd5e1', flexShrink: 0 }}>•</span>
            <span style={{ flexShrink: 0 }}>100% Free &amp; Verified</span>
          </div>
        </div>
      </section>

      {/* ─── 2. MIDDLE STRIP (FILTERS + CONTINUE LEARNING) ─── */}
      <section className="middle-strip-grid">
        {/* Left: Filter Card */}
        <div className="filter-card">
          {/* Row 1: SUBJECTS */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', minWidth: 0, flexWrap: 'nowrap' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: '#64748b',
                letterSpacing: '0.6px',
                width: '74px',
                flexShrink: 0,
                userSelect: 'none',
              }}
            >
              SUBJECTS:
            </span>

            <div
              ref={pillsRef}
              onScroll={checkScroll}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                overflowX: 'auto',
                flexWrap: 'nowrap',
                flex: 1,
                minWidth: 0,
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch',
                padding: '2px 0',
              }}
            >
              {subjects.map((sub) => {
                const isActive = selectedSubject === sub.id;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setSelectedSubject(sub.id)}
                    style={{
                      background: isActive ? '#0F5E53' : '#E5F1EE',
                      color: isActive ? '#ffffff' : '#334155',
                      border: 'none',
                      borderRadius: '9999px',
                      padding: '6px 16px',
                      minHeight: '34px',
                      fontSize: '12.5px',
                      fontWeight: isActive ? 700 : 500,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s ease',
                      flexShrink: 0,
                    }}
                  >
                    {sub.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 2: GRADE */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', minWidth: 0, flexWrap: 'nowrap' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: '#64748b',
                letterSpacing: '0.6px',
                width: '74px',
                flexShrink: 0,
                userSelect: 'none',
              }}
            >
              GRADE:
            </span>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                overflowX: 'auto',
                flexWrap: 'nowrap',
                flex: 1,
                minWidth: 0,
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch',
                padding: '2px 0',
              }}
            >
              {grades.map((gr) => {
                const isActive = selectedGrade === gr.id;
                return (
                  <button
                    key={gr.id}
                    type="button"
                    onClick={() => setSelectedGrade(gr.id)}
                    style={{
                      background: isActive ? '#0F5E53' : '#E5F1EE',
                      color: isActive ? '#ffffff' : '#334155',
                      border: 'none',
                      borderRadius: '9999px',
                      padding: '6px 16px',
                      minHeight: '34px',
                      fontSize: '12.5px',
                      fontWeight: isActive ? 700 : 500,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s ease',
                      flexShrink: 0,
                    }}
                  >
                    {gr.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Continue Learning Banner */}
        <div className="continue-learning-card">
          <div className="continue-learning-left">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0F5E53" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-1 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1.3.5 2.5 1.5 3.5.8.8 1.3 1.5 1.5 2.5" />
              <line x1="9" y1="18" x2="15" y2="18" />
              <line x1="10" y1="22" x2="14" y2="22" />
              <line x1="2" y1="8" x2="4" y2="8" />
              <line x1="20" y1="8" x2="22" y2="8" />
              <line x1="4.93" y1="3.93" x2="6.34" y2="5.34" />
              <line x1="17.66" y1="5.34" x2="19.07" y2="3.93" />
            </svg>
            <span
              className="continue-learning-title"
              title={recentBook.title}
            >
              Continue Learning: {recentBook.title}
            </span>
          </div>

          <div className="continue-learning-right">
            <div className="continue-learning-bar-wrap">
              <div style={{ width: '65%', height: '100%', background: '#0F5E53', borderRadius: '4px' }} />
            </div>

            <Link
              to={'/read/' + recentBook.id}
              className="continue-learning-btn"
              onClick={(e) => {
                if (!isLoggedIn) {
                  e.preventDefault();
                  triggerAuthPrompt({
                    feature: 'Continue Reading',
                    title: 'Sign In to Resume Reading',
                    message: 'Sign in or create an account to pick up right where you left off, sync your page position, and access your notes across devices.',
                    from: `/read/${recentBook.id}`,
                  });
                }
              }}
            >
              <span>▶</span>
              <span>Resume PDF</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── 3. SPLIT 2-PANEL CONTENT SECTION (VIDEOS ON LEFT, TEXTBOOKS ON RIGHT) ─── */}
      <section className="split-panels-grid">
        {/* Panel 1: Popular Video Playlists */}
        <div className="panel-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: '#0F5E53',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                }}
              >
                ▶
              </span>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.3px' }}>
                Popular Video Playlists
              </h2>
            </div>
            <Link
              to="/videos"
              style={{
                color: '#0F5E53',
                fontWeight: 700,
                fontSize: '13px',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              View All →
            </Link>
          </div>

          <div className="cards-grid-3 videos-grid-responsive">
            {filteredVideos.slice(0, 3).map((vid, idx) => (
              <VideoCard key={(vid.id || vid.videoId || 'vid') + '-' + idx} video={vid} />
            ))}
          </div>
        </div>

        {/* Panel 2: Featured Textbooks */}
        <div className="panel-container">
          {/* Top Filter Tabs: All, Textbooks, Videos */}
          <div className="featured-books-filter-tabs" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <button
              type="button"
              style={{
                background: '#0F5E53',
                color: '#ffffff',
                borderRadius: '9999px',
                padding: '4px 14px',
                fontSize: '12px',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              All
            </button>
            <button
              type="button"
              style={{
                background: '#F1F5F4',
                color: '#64748b',
                borderRadius: '9999px',
                padding: '4px 14px',
                fontSize: '12px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Textbooks
            </button>
            <button
              type="button"
              style={{
                background: '#F1F5F4',
                color: '#64748b',
                borderRadius: '9999px',
                padding: '4px 14px',
                fontSize: '12px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Videos
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#eab308', fontSize: '16px' }}>⭐</span>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.3px' }}>
                Featured Textbooks
              </h2>
            </div>
            <Link
              to="/library"
              style={{
                color: '#0F5E53',
                fontWeight: 700,
                fontSize: '13px',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              View All →
            </Link>
          </div>

          <div className="cards-grid-3 textbooks-grid-responsive">
            {featuredBooks.slice(0, 3).map((b) => (
              <BookCard
                key={b.id}
                item={b}
                isSaved={saved.includes(b.id)}
                onSaveToggle={handleSaveBook}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;

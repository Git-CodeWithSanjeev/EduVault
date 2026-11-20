import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { items } from '../data/openItems';
import { ncertBooks } from '../data/ncertBooksData';
import { educationalGalleryData } from '../data/educationalGalleryData';
import { VideoCard } from '../components/VideoCard';
import { BookCard } from '../components/BookCard';

export function Home({ saved = [], toggle = () => {} }) {
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
    title: 'Physics Part 1 — Class 12',
    progress: 65,
  });

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
    } catch (_) {}
  }, []);

  // Canonical 3 video playlists from the target design
  const canonicalVideos = useMemo(() => [
    {
      id: 'class-12-quantum-mechanics',
      videoId: 'quantum-mechanics',
      title: 'Introduction to Quantum Mechanics',
      description: 'Introduction to quantum mechanics covering video, particle duality and theoretical fundamentals.',
      channel: 'Creator/Semenviraret',
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
      description: 'Organic chemistry masterclass on reaction mechanisms, functional groups, and molecular synthesis.',
      channel: 'Creator James Miller',
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
      description: 'Learn computational thinking, data structures, algorithms, and full-stack software development.',
      channel: 'Creator/Earah Jankins',
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

  // Canonical 4 textbooks matching the target design
  const canonicalBooks = useMemo(() => [
    {
      id: 'ncert-leph1',
      title: 'Physics Part 1',
      author: 'NCERT',
      level: 'Class 12',
      coverBadge: 'NCERT · Class 12',
      subject: 'Physics',
    },
    {
      id: 'ncert-kech1',
      title: 'Comprehensive Chemistry',
      author: 'NCERT',
      level: 'Class 11',
      coverBadge: 'NCERT · Class 11',
      subject: 'Chemistry',
    },
    {
      id: 'biology',
      title: 'Biology: Life Sciences',
      author: 'OpenStax',
      level: 'Class 12',
      coverBadge: 'OpenStax · Biology',
      subject: 'Biology',
    },
    {
      id: 'cs50-harvard',
      title: 'CS50: Introduction to Computer Science',
      author: 'David J. Malan',
      level: 'Class 12',
      coverBadge: 'Harvard · CS50',
      subject: 'Computer Science',
    },
  ], []);

  // Featured Textbooks (4 items matching design)
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

    if (matches.length >= 4) {
      return matches.slice(0, 4);
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
    <div style={{ background: '#EAF3F2', minHeight: '100vh', paddingBottom: '60px' }}>
      {/* ─── 1. TWO-TONE HERO SECTION ─── */}
      <section
        style={{
          maxWidth: '1240px',
          margin: '0 auto',
          padding: '36px 24px 28px',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '32px',
            alignItems: 'center',
          }}
        >
          {/* Left Hero Content */}
          <div style={{ maxWidth: '560px' }}>
            <h1
              style={{
                fontSize: 'clamp(32px, 4.2vw, 46px)',
                lineHeight: 1.18,
                fontWeight: 800,
                color: '#0f172a',
                margin: '0 0 16px',
                letterSpacing: '-0.025em',
              }}
            >
              Your trusted library for <span style={{ color: '#0F5E53' }}>textbooks</span> &amp;{' '}
              <span style={{ color: '#0F5E53' }}>video</span> masterclasses
            </h1>

            <p
              style={{
                fontSize: '15px',
                color: '#475569',
                lineHeight: 1.6,
                margin: '0 0 24px',
              }}
            >
              Access high-quality open textbooks, video courses, and study resources absolutely free.
            </p>

            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
              <Link
                to="/library"
                style={{
                  background: '#0F5E53',
                  color: '#ffffff',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '14px',
                  textDecoration: 'none',
                  boxShadow: '0 4px 14px rgba(15, 94, 83, 0.25)',
                  transition: 'all 0.18s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                Explore Textbooks
              </Link>

              <Link
                to="/videos"
                style={{
                  background: 'transparent',
                  color: '#0F5E53',
                  padding: '12px 18px',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '14px',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.18s ease',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <circle cx="12" cy="12" r="10" />
                  <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" />
                </svg>
                <span>Watch Playlists</span>
              </Link>
            </div>
          </div>

          {/* Right Hero: Soft Mint-Wave Backdrop with Students Illustration & Non-overlapping Trust Pill */}
          <div
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              minHeight: '270px',
            }}
          >
            {/* Soft Mint Wave Glow */}
            <div
              style={{
                position: 'absolute',
                inset: '0 10px',
                background: 'radial-gradient(ellipse at 50% 50%, #d5eee7 0%, #def2ed 60%, transparent 85%)',
                borderRadius: '40px',
                zIndex: 0,
              }}
            />

            {/* Students 3D Illustration */}
            <img
              src="/hero-students.png"
              alt="EduVault students studying with textbooks and video masterclasses"
              style={{
                position: 'relative',
                zIndex: 1,
                maxHeight: '220px',
                width: 'auto',
                maxWidth: '100%',
                objectFit: 'contain',
                filter: 'drop-shadow(0 8px 24px rgba(15, 94, 83, 0.12))',
              }}
            />

            {/* Non-Overlapping Bottom Trust Pill */}
            <div
              style={{
                position: 'relative',
                zIndex: 2,
                marginTop: '12px',
                background: '#ffffff',
                borderRadius: '9999px',
                padding: '7px 20px',
                boxShadow: '0 4px 18px rgba(15, 94, 83, 0.08)',
                fontSize: '12px',
                fontWeight: 700,
                color: '#0f172a',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <span style={{ color: '#0F5E53' }}>⭐ 200+ Open Books</span>
              <span style={{ color: '#cbd5e1' }}>·</span>
              <span style={{ color: '#0F5E53' }}>100% Free &amp; Verified</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 2. BORDERLESS ELEVATED FILTER BAR ─── */}
      <section style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 24px 18px' }}>
        <div
          style={{
            background: '#ffffff',
            borderRadius: '20px',
            boxShadow: '0 4px 20px rgba(15, 94, 83, 0.05)',
            padding: '18px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            position: 'relative',
          }}
        >
          {/* Row 1: SUBJECTS */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', overflow: 'hidden' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: '#64748b',
                letterSpacing: '0.6px',
                width: '84px',
                flexShrink: 0,
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
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
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
                      padding: '7px 18px',
                      fontSize: '13px',
                      fontWeight: isActive ? 700 : 500,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {sub.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 2: GRADE */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: '#64748b',
                letterSpacing: '0.6px',
                width: '84px',
                flexShrink: 0,
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
                scrollbarWidth: 'none',
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
                      padding: '7px 18px',
                      fontSize: '13px',
                      fontWeight: isActive ? 700 : 500,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {gr.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ─── 3. CONTINUE LEARNING STRIP ─── */}
      <section style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 24px 32px' }}>
        <div
          style={{
            background: '#D9EFEA',
            borderRadius: '16px',
            padding: '14px 22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 800, fontSize: '14px', color: '#0F5E53' }}>
              Continue Learning: {recentBook.title}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '64px', height: '8px', background: '#B8E0D7', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: '60%', height: '100%', background: '#0F5E53', borderRadius: '4px' }} />
            </div>

            <Link
              to={'/read/' + recentBook.id}
              style={{
                background: '#0F5E53',
                color: '#ffffff',
                padding: '7px 18px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: '0 2px 8px rgba(15, 94, 83, 0.2)',
                transition: 'background 0.15s ease',
              }}
            >
              Resume PDF
            </Link>
          </div>
        </div>
      </section>

      {/* ─── 4. POPULAR VIDEO PLAYLISTS (3-COLUMN 16:9 CARDS) ─── */}
      <section
        style={{
          maxWidth: '1240px',
          margin: '0 auto',
          padding: '0 24px 36px',
          contentVisibility: 'auto',
          containIntrinsicSize: '0 500px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.3px' }}>
            Popular Video Playlists
          </h2>
          <Link
            to="/videos"
            style={{
              color: '#0F5E53',
              fontWeight: 700,
              fontSize: '13.5px',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            View All →
          </Link>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
            gap: '24px',
          }}
        >
          {filteredVideos.map((vid, idx) => (
            <VideoCard key={(vid.id || vid.videoId || 'vid') + '-' + idx} video={vid} />
          ))}
        </div>
      </section>

      {/* ─── 5. FEATURED TEXTBOOKS (4-COLUMN 3:4 CARDS) ─── */}
      <section
        style={{
          maxWidth: '1240px',
          margin: '0 auto',
          padding: '0 24px 20px',
          contentVisibility: 'auto',
          containIntrinsicSize: '0 500px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.3px' }}>
            Featured Textbooks
          </h2>
          <Link
            to="/library"
            style={{
              color: '#0F5E53',
              fontWeight: 700,
              fontSize: '13.5px',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            View All →
          </Link>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '20px',
          }}
        >
          {featuredBooks.map((b) => (
            <BookCard
              key={b.id}
              item={b}
              isSaved={saved.includes(b.id)}
              onSaveToggle={toggle}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

export default Home;

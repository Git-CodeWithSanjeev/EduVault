import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { items } from '../data/openItems';
import { ncertBooks } from '../ncertBooks';
import { educationalVideos } from '../data/educationalVideos';
import { Cards } from '../components/Cards';
import { BookCarousel } from '../components/BookCarousel';
import { VideoGallery } from '../components/VideoGallery';
import { educationalGalleryData } from '../data/educationalGalleryData';
import { useAuth } from '../context/AuthContext';
import { useDragScroll } from '../hooks/useDragScroll';

export function VideoCarousel({ title, videosList }) {
  const { trackRef, dragProps } = useDragScroll();

  if (!videosList || videosList.length === 0) return null;

  return (
    <div className="carousel-section" style={{ marginTop: '8px', marginBottom: '28px' }}>
      <div className="carousel-header">
        <h2>{title}</h2>
        <Link to="/videos" className="pdf-btn secondary" style={{ fontSize: '11px', textDecoration: 'none' }}>
          View All Videos →
        </Link>
      </div>
      <div className="carousel-track-wrapper">
        <div
          className="carousel-track"
          ref={trackRef}
          style={{ cursor: 'grab' }}
          {...dragProps}
        >
          {videosList.map((vid) => (
            <div key={vid.id} className="carousel-item" style={{ minWidth: '280px', maxWidth: '320px' }}>
              <div className="video-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Link to={'/video/' + vid.id} className="video-thumb-wrap" style={{ display: 'block', textDecoration: 'none' }}>
                  <img
                    src={vid.thumbnail}
                    alt={vid.title}
                    className="video-thumb-img"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://i.ytimg.com/vi/tVzUXW6siu0/hqdefault.jpg';
                    }}
                  />
                  <div className="play-badge">▶</div>
                </Link>
                <div className="video-info" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div className="video-meta">
                    <span>{vid.category}</span>
                    <span style={{ color: 'var(--muted)' }}>{vid.level}</span>
                  </div>
                  <h3 style={{ fontSize: '14px', lineHeight: 1.3, margin: '6px 0' }}>
                    <Link to={'/video/' + vid.id} style={{ color: 'inherit', textDecoration: 'none' }}>
                      {vid.title}
                    </Link>
                  </h3>
                  <small style={{ color: 'var(--muted)', fontWeight: 700, marginBottom: '10px', marginTop: 'auto', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="4" width="20" height="15" rx="2" />
                      <polygon points="10 9 15 11.5 10 14 10 9" fill="currentColor" />
                    </svg>
                    <span>Channel: {vid.channel}</span>
                  </small>
                  <Link to={'/video/' + vid.id} className="hero-link" style={{ textAlign: 'center', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px', padding: '8px 12px', minHeight: '40px' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    <span>Start Video Course</span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Home({ saved, toggle, recentIds }) {
  const { user, isLoggedIn } = useAuth();

  const recentItems = useMemo(
    () => recentIds.map((id) => items.find((x) => x.id === id)).filter(Boolean),
    [recentIds],
  );

  const featuredVideos = useMemo(() => educationalVideos.slice(0, 8), []);
  const ncertFeatured = useMemo(() => ncertBooks.slice(0, 15), []);
  const openStaxFeatured = useMemo(() => items.filter((x) => x.source === 'OpenStax'), []);
  const techFeatured = useMemo(
    () => items.filter((x) => x.category === 'Computer Science & IT' || x.category === 'Engineering'),
    [],
  );

  return (
    <>
      <section className="hero">
        <div className="hero-container">
          {/* Left Text Content Column */}
          <div>
            <p className="eyebrow">OPEN EDUCATION & FREE VIDEO HUB</p>

            <h1 style={{ fontSize: 'clamp(36px, 4.5vw, 54px)', lineHeight: 1.15 }}>
              Your trusted library
              <br />
              for <span className="highlight-text">textbooks &amp; video masterclasses.</span>
            </h1>
            <p className="intro">
              {ncertBooks.length}+ official NCERT textbooks (Classes I–XII), OpenStax college series, plus curated video course playlists from CodeWithHarry, Apna College, and Physics Wallah.
            </p>
            <div className="hero-cta-group" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '16px' }}>
              <Link className="hero-link" to="/library">
                Explore Open Textbooks →
              </Link>
              <Link className="hero-link" style={{ background: 'var(--p)' }} to="/videos">
                Watch Video Playlists →
              </Link>
            </div>
            <p className="safe">
              ✓ Legal source material only · Rights-cleared video playlists & textbooks
            </p>
          </div>

          {/* Right Column: Animated Educational Hub Graphic */}
          <div className="hero-graphic-wrap">
            {/* Top Left Floating Glass Card */}
            <div className="hero-float-card hero-float-1">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--p)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 800 }}>200+ Open Books</div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>NCERT & OpenStax Series</div>
              </div>
            </div>

            {/* Main Interactive Showcase Card */}
            <div className="hero-main-card">
              <div className="hero-card-preview">
                <img
                  src="https://img.youtube.com/vi/tVzUXW6siu0/hqdefault.jpg"
                  alt="Featured Video Course"
                />
                <Link to="/video/cwh-c" className="hero-play-pulse" title="Play Featured Masterclass">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </Link>
              </div>
              <div style={{ marginTop: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', background: '#ccfbf1', color: 'var(--p-dark)' }}>
                    FEATURED MASTERCLASS
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--p)', fontWeight: 800 }}>
                    76 Video Lessons
                  </span>
                </div>
                <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '6px 0', color: 'var(--ink)' }}>
                  C Language Complete Course In Hindi
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0 }}>
                  CodeWithHarry · Beginner to Advanced
                </p>
                <div className="hero-subject-chips">
                  <span className="hero-chip">Programming</span>
                  <span className="hero-chip">Class 1-12</span>
                  <span className="hero-chip">Physics & Math</span>
                </div>
              </div>
            </div>

            {/* Bottom Right Floating Glass Card */}
            <div className="hero-float-card hero-float-2">
              <div className="pulse-dot" />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--ink)' }}>100% Free & Verified</div>
                <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 700 }}>✓ Zero Ads or Paywalls</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reusable Lazy-Loaded Educational Video Gallery Component */}
      <section className="page" style={{ paddingTop: '20px', minHeight: 'auto' }}>
        <VideoGallery
          videos={educationalGalleryData}
          title="Featured Educational Channels & Masterclasses"
          subtitle="Direct playlists from top educators: Flutter Official, Career Definer, freeCodeCamp.org, Feel Free to Learn, and English Connection."
          showFilters={true}
          columns={3}
        />
      </section>

      {/* Featured Educational Videos Carousel */}
      <section className="page" style={{ paddingTop: '0px', minHeight: 'auto' }}>
        <VideoCarousel title="Featured Video Masterclasses & Playlists" videosList={featuredVideos} />
      </section>

      {recentItems.length > 0 && (
        <section className="page" style={{ paddingTop: '10px', minHeight: 'auto' }}>
          <p className="eyebrow">CONTINUE READING</p>
          <h2>Recently Visited</h2>
          <Cards list={recentItems} saved={saved} toggle={toggle} />
        </section>
      )}

      {/* Horizontal Scroll Book Showcase Rails */}
      <section className="page" style={{ paddingTop: '10px' }}>
        <BookCarousel title="Official NCERT Textbooks (Classes 1–12)" itemsList={ncertFeatured} saved={saved} toggle={toggle} />
        <BookCarousel title="OpenStax Peer-Reviewed College Series" itemsList={openStaxFeatured} saved={saved} toggle={toggle} />
        <BookCarousel title="Computer Science, Tech & Engineering Books" itemsList={techFeatured} saved={saved} toggle={toggle} />
      </section>
    </>
  );
}

export default Home;

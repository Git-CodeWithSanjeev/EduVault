import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { items } from '../data/openItems';
import { ncertBooks } from '../data/ncertBooksData';
import { Cards } from '../components/ResourceGrid';
import { BookCarousel } from '../components/BookCarousel';
import { VideoGallery } from '../components/VideoGallery';
import { educationalGalleryData } from '../data/educationalGalleryData';
import { useAuth } from '../context/AuthContext';

export function Home({ saved = [], toggle = () => {}, recentIds = [] }) {
  const { user, isLoggedIn } = useAuth();

  const recentItems = useMemo(
    () => (Array.isArray(recentIds) ? recentIds : []).map((id) => items.find((x) => x.id === id)).filter(Boolean),
    [recentIds],
  );

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
                  alt="Sigma Web Development Masterclass"
                />
                <Link to="/video/cwh-sigma-webdev" className="hero-play-pulse" title="Play Sigma Web Development Masterclass">
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
                    139 Video Lessons
                  </span>
                </div>
                <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '6px 0', color: 'var(--ink)' }}>
                  Sigma Web Development Course (HTML, CSS, JS, React)
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0 }}>
                  CodeWithHarry · Full-Stack Web Development
                </p>
                <div className="hero-subject-chips">
                  <span className="hero-chip">Web Development</span>
                  <span className="hero-chip">Full-Stack</span>
                  <span className="hero-chip">React & Node.js</span>
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

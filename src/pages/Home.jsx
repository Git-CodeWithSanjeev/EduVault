import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { items } from '../data/openItems';
import { ncertBooks } from '../ncertBooks';
import { educationalVideos } from '../data/educationalVideos';
import { Cards } from '../components/Cards';
import { BookCarousel } from '../components/BookCarousel';
import { VideoGallery } from '../components/VideoGallery';
import { educationalGalleryData } from '../data/educationalGalleryData';

export function VideoCarousel({ title, videosList }) {
  if (!videosList || videosList.length === 0) return null;

  return (
    <div className="carousel-section" style={{ marginBottom: '32px' }}>
      <div className="carousel-header">
        <h2>{title}</h2>
        <Link to="/videos" className="pdf-btn secondary" style={{ fontSize: '11px', textDecoration: 'none' }}>
          View All Videos →
        </Link>
      </div>
      <div className="carousel-track-wrapper">
        <div className="carousel-track">
          {videosList.map((vid) => (
            <div key={vid.id} className="carousel-item" style={{ minWidth: '300px' }}>
              <div className="video-card" style={{ height: '100%' }}>
                <div className="video-thumb-wrap">
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
                </div>
                <div className="video-info">
                  <div className="video-meta">
                    <span>{vid.category}</span>
                    <span style={{ color: 'var(--muted)' }}>{vid.level}</span>
                  </div>
                  <h3 style={{ fontSize: '14px', lineHeight: 1.3 }}>{vid.title}</h3>
                  <small style={{ color: 'var(--muted)', fontWeight: 700, marginBottom: '10px', marginTop: 'auto' }}>
                    📺 Channel: {vid.channel}
                  </small>
                  <Link to={'/video/' + vid.id} className="hero-link" style={{ textAlign: 'center', display: 'block', fontSize: '12px', padding: '6px 12px' }}>
                    ▶ Watch Course Playlist
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
        <div>
          <p className="eyebrow">OPEN EDUCATION & FREE VIDEO HUB</p>
          <h1>
            Your trusted library
            <br />
            for <span className="highlight-text">textbooks &amp; video masterclasses.</span>
          </h1>
          <p className="intro">
            {ncertBooks.length}+ official NCERT textbooks (Classes I–XII), OpenStax college series, plus curated video course playlists from CodeWithHarry, Apna College, and Physics Wallah.
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link className="hero-link" to="/library">
              Explore Open Textbooks →
            </Link>
            <Link className="hero-link" style={{ background: '#4c34af' }} to="/videos">
              ▶ Watch Video Playlists →
            </Link>
          </div>
          <p className="safe">
            ✓ Legal source material only · Rights-cleared video playlists & textbooks
          </p>
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
      <section className="page" style={{ paddingTop: '10px', minHeight: 'auto' }}>
        <p className="eyebrow">FREE VIDEO HUB SHOWCASE</p>
        <VideoCarousel title="🎥 Featured Video Masterclasses & Playlists" videosList={featuredVideos} />
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
        <p className="eyebrow">FEATURED OPEN COLLECTIONS</p>
        <BookCarousel title="📖 Official NCERT Textbooks (Classes 1–12)" itemsList={ncertFeatured} saved={saved} toggle={toggle} />
        <BookCarousel title="🧪 OpenStax Peer-Reviewed College Series" itemsList={openStaxFeatured} saved={saved} toggle={toggle} />
        <BookCarousel title="💻 Computer Science, Tech & Engineering Books" itemsList={techFeatured} saved={saved} toggle={toggle} />
      </section>
    </>
  );
}

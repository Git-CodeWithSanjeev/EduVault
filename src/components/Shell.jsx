import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { items } from '../data/openItems';
import { educationalVideos } from '../data/educationalVideos';
import { educationalGalleryData } from '../data/educationalGalleryData';

export function Shell({ children, welcomeMsg }) {
  const { user, isLoggedIn, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [authPrompt, setAuthPrompt] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTab, setSearchTab] = useState('all'); // 'all', 'books', 'videos', 'ncert'
  const [activeIndex, setActiveIndex] = useState(0);
  const location = useLocation();
  const userMenuRef = useRef(null);

  // Close user dropdown menu when tapping/clicking anywhere outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuOpen && userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [menuOpen]);

  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const saved = localStorage.getItem('eduvault_recent_searches');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const saveRecentSearch = (term) => {
    if (!term || !term.trim()) return;
    const clean = term.trim();
    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s.toLowerCase() !== clean.toLowerCase());
      const updated = [clean, ...filtered].slice(0, 6);
      try {
        localStorage.setItem('eduvault_recent_searches', JSON.stringify(updated));
      } catch (err) {
        console.error(err);
      }
      return updated;
    });
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem('eduvault_recent_searches');
    } catch (err) {
      console.error(err);
    }
  };

  const closeDrawer = () => setDrawerOpen(false);
  const isReaderRoute = location.pathname.startsWith('/read/');

  // Global listeners (Keyboard shortcut Ctrl+K/Cmd+K, Escape to close, open-search-modal, open-auth-prompt)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSearchModalOpen(false);
        setDrawerOpen(false);
        setAuthPrompt(null);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      }
    };
    const handleCustomOpen = () => setSearchModalOpen(true);
    const handleAuthPrompt = (e) => setAuthPrompt(e.detail || {});

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-search-modal', handleCustomOpen);
    window.addEventListener('open-auth-prompt', handleAuthPrompt);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-search-modal', handleCustomOpen);
      window.removeEventListener('open-auth-prompt', handleAuthPrompt);
    };
  }, []);

  const rawSearchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();

    // 1. Textbooks & open reading resources
    const books = items
      .filter((b) => {
        const fullText = [
          b.title,
          b.subject,
          b.author,
          b.authors,
          b.level,
          b.grade ? `class ${b.grade}` : '',
          b.classNum ? `class ${b.classNum}` : '',
          b.source,
          b.category,
          b.description,
          b.chapters ? b.chapters.join(' ') : ''
        ].filter(Boolean).join(' ').toLowerCase();
        return fullText.includes(q);
      })
      .map((b) => ({
        type: b.source === 'NCERT' ? 'ncert' : 'book',
        id: b.id,
        title: b.title,
        meta: `${b.subject || 'Textbook'} · ${b.level || (b.grade ? `Class ${b.grade}` : 'Open Resource')} ${b.source ? `· ${b.source}` : ''}`,
        url: (b.source === 'NCERT' || b.source === 'OpenStax' || b.cloudUrl || b.pdfUrl) ? `/read/${b.id}` : `/resource/${b.id}`,
        icon: b.source === 'NCERT' ? '🎓' : '📚',
        badge: b.source === 'NCERT' ? 'NCERT' : (b.source || 'Book'),
      }));

    // 2. Video courses and masterclasses
    const allVideos = [...educationalVideos, ...(educationalGalleryData || [])];
    const uniqueVideos = [];
    const seenVideoIds = new Set();
    for (const v of allVideos) {
      const vidKey = v.id || v.videoId || v.playlistId;
      if (vidKey && !seenVideoIds.has(vidKey)) {
        seenVideoIds.add(vidKey);
        uniqueVideos.push(v);
      }
    }

    const videos = uniqueVideos
      .filter((v) => {
        const fullText = [
          v.title,
          v.channel,
          v.category,
          v.subject,
          v.description
        ].filter(Boolean).join(' ').toLowerCase();
        return fullText.includes(q);
      })
      .map((v) => ({
        type: 'video',
        id: v.id || v.videoId,
        title: v.title,
        meta: `Video Course · ${v.channel || 'EduVault'} · ${v.category || v.subject || 'Educational'}`,
        url: `/video/${v.id || v.videoId}`,
        icon: '🎬',
        badge: 'Video',
      }));

    return [...books, ...videos];
  }, [searchQuery]);

  const searchResults = useMemo(() => {
    if (searchTab === 'books') return rawSearchResults.filter((r) => r.type === 'book' || r.type === 'ncert').slice(0, 16);
    if (searchTab === 'videos') return rawSearchResults.filter((r) => r.type === 'video').slice(0, 16);
    if (searchTab === 'ncert') return rawSearchResults.filter((r) => r.type === 'ncert').slice(0, 16);
    return rawSearchResults.slice(0, 20);
  }, [rawSearchResults, searchTab]);

  useEffect(() => {
    setActiveIndex(0);
  }, [searchQuery, searchTab]);

  // Handle arrow key navigation in search modal
  const handleModalKeyDown = (e) => {
    if (!searchModalOpen || searchResults.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % searchResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + searchResults.length) % searchResults.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = searchResults[activeIndex];
      if (selected) {
        saveRecentSearch(searchQuery);
        setSearchModalOpen(false);
        navigate(selected.url);
      }
    }
  };

  return (
    <>
      {isReaderRoute ? (
        <main className="reader-page-main" style={{ height: '100dvh', overflow: 'hidden' }}>
          {children}
        </main>
      ) : (
        <div className="app-canvas-wrap">
          <div className="app-viewport-card">
            {/* Decorative floating mint dots matching the reference UI */}
            <div className="deco-dots-wrapper" aria-hidden="true" style={{ position: 'absolute', top: 0, right: 0, width: '200px', height: '120px', pointerEvents: 'none', zIndex: 0, overflow: 'visible' }}>
              <svg width="200" height="120" viewBox="0 0 200 120" fill="none" style={{ position: 'absolute', top: 0, right: 0 }}>
                <circle cx="160" cy="20" r="5" fill="#b8e4d6" opacity="0.7" />
                <circle cx="140" cy="45" r="3.5" fill="#c4ebe0" opacity="0.55" />
                <circle cx="180" cy="55" r="4" fill="#a7dece" opacity="0.65" />
                <circle cx="120" cy="30" r="2.5" fill="#d1f0e6" opacity="0.5" />
                <circle cx="170" cy="80" r="3" fill="#b8e4d6" opacity="0.45" />
                <circle cx="150" cy="70" r="6" fill="#c4ebe0" opacity="0.35" />
              </svg>
            </div>
            {/* ─── 1. MAIN WEBSITE HEADER ─── */}
            <header>
              <Link className="logo" to="/" aria-label="EduVault Home">
                <img src="/logo.png" alt="EduVault" className="brand-logo-img" />
              </Link>

              {/* Desktop Navigation in soft floating pill container */}
              <nav className="nav-pill-group">
                <NavLink to="/library" className={({ isActive }) => (isActive || location.pathname === '/' ? 'active' : '')}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                  <span>Library</span>
                </NavLink>
                <NavLink to="/categories">Categories</NavLink>
                <NavLink to="/videos">Videos</NavLink>
                <NavLink to="/saved">My Library</NavLink>
              </nav>

              <div className="head-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto' }}>
                {/* Circular Search Icon Button (matching the mockup) */}
                <button
                  type="button"
                  className="nav-search-circle-btn"
                  onClick={() => setSearchModalOpen(true)}
                  title="Search resources... (Ctrl+K)"
                  aria-label="Search resources"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </button>

                {/* Desktop & Tablet Auth Actions */}
                <div className="desktop-auth-group">
                  {loading ? (
                    <div className="auth-nav-skeleton" style={{ width: '80px', height: '36px', borderRadius: '8px', background: '#E6F4F1', opacity: 0.7 }} />
                  ) : isLoggedIn ? (
                    <div className="user-menu-wrap" ref={userMenuRef} style={{ position: 'relative' }}>
                      <button
                        className="user-profile-btn"
                        onClick={() => setMenuOpen(!menuOpen)}
                        aria-label="User Profile Menu"
                      >
                        {user.avatar && typeof user.avatar === 'string' && user.avatar.startsWith('http') ? (
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="user-avatar-img"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span className="user-avatar-icon">{user.avatar || '🎓'}</span>
                        )}
                        <strong className="user-name-label">{user.name}</strong>
                        <svg className="user-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>

                      {menuOpen && (
                        <>
                          <div
                            className="user-dropdown-backdrop"
                            onClick={() => setMenuOpen(false)}
                            style={{
                              position: 'fixed',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              zIndex: 290,
                              cursor: 'default',
                              background: 'transparent',
                            }}
                          />
                          <div className="user-dropdown" onClick={() => setMenuOpen(false)} style={{ zIndex: 300 }}>
                            <div className="user-dropdown-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '14px 16px 10px' }}>
                              {user.avatar && typeof user.avatar === 'string' && user.avatar.startsWith('http') ? (
                                <img
                                  src={user.avatar}
                                  alt={user.name}
                                  className="user-avatar-img"
                                  style={{ width: '42px', height: '42px', borderRadius: '50%', marginBottom: '8px', objectFit: 'cover', border: '1.5px solid var(--p)' }}
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <span style={{ fontSize: '30px', marginBottom: '6px' }}>{user.avatar || '🎓'}</span>
                              )}
                              <div style={{ textAlign: 'center', width: '100%' }}>
                                <p style={{ margin: '0 0 2px', fontSize: '14px', fontWeight: 800, color: 'var(--ink)' }}>{user.name}</p>
                                <small style={{ fontSize: '11px', color: 'var(--muted)', wordBreak: 'break-all' }}>{user.email}</small>
                              </div>
                            </div>
                            <div className="user-dropdown-body" style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '6px 0', alignItems: 'center', textAlign: 'center' }}>
                              <Link to="/profile" className="user-dropdown-item" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', textAlign: 'center', width: '100%' }}>
                                Account &amp; Profile
                              </Link>
                              <Link to="/saved" className="user-dropdown-item" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', textAlign: 'center', width: '100%' }}>
                                Saved Wishlist
                              </Link>
                              <Link to="/upload" className="user-dropdown-item" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', textAlign: 'center', width: '100%' }}>
                                Contribute Books
                              </Link>
                              <Link to="/admin" className="user-dropdown-item" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', textAlign: 'center', width: '100%', color: 'var(--primary)', fontWeight: '600' }}>
                                🛡️ Admin Console
                              </Link>
                              <button className="user-dropdown-item logout" onClick={logout} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', textAlign: 'center', width: '100%' }}>
                                Sign Out
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <Link to="/login" className="nav-login-link">
                        Log in
                      </Link>
                      <Link to="/register" className="nav-signup-btn">
                        Sign Up
                      </Link>
                    </div>
                  )}
                </div>

                {/* Hamburger Menu Toggle Button for Mobile & Tablet (<1024px) */}
                <button
                  type="button"
                  className="mobile-nav-toggle"
                  onClick={() => setDrawerOpen(true)}
                  aria-label="Open Mobile Navigation Menu"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '38px',
                    height: '38px',
                    background: '#E6F4F1',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#0F5E53',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0F5E53" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="4" y1="7" x2="20" y2="7" />
                    <line x1="4" y1="12" x2="20" y2="12" />
                    <line x1="4" y1="17" x2="20" y2="17" />
                  </svg>
                </button>
              </div>
            </header>

            {welcomeMsg && <div className="welcome-back">{welcomeMsg}</div>}
            
            <main style={{ minHeight: 'calc(100vh - 160px)', height: 'auto', overflow: 'visible' }}>
              {children}
            </main>

            {/* Footer inside viewport card */}
            <footer className="main-site-footer">
              <div style={{ fontSize: '13px', color: '#475569', fontWeight: 600 }}>
                <span style={{ fontWeight: 800, color: '#0f172a' }}>EduVault</span>
                <span style={{ margin: '0 8px', color: '#94a3b8' }}>·</span>
                <span>Learn openly. Share responsibly.</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '22px', fontSize: '13px' }}>
                <Link to="/about" style={{ color: '#475569', textDecoration: 'none', fontWeight: 600 }}>About</Link>
                <Link to="/privacy" style={{ color: '#475569', textDecoration: 'none', fontWeight: 600 }}>Privacy</Link>
                <Link to="/terms" style={{ color: '#475569', textDecoration: 'none', fontWeight: 600 }}>Terms</Link>
                <Link to="/contact" style={{ color: '#475569', textDecoration: 'none', fontWeight: 600 }}>Contact</Link>
              </div>
            </footer>
          </div>

          {/* Mobile Bottom Navigation Bar (< 768px) */}
          <div className="mobile-bottom-nav">
            <NavLink to="/" className={`bottom-nav-item ${location.pathname === '/' ? 'active' : ''}`}>
              <span className="nav-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </span>
              <span>Home</span>
            </NavLink>
            <NavLink to="/library" className={`bottom-nav-item ${location.pathname === '/library' ? 'active' : ''}`}>
              <span className="nav-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  <line x1="9" y1="7" x2="15" y2="7" />
                  <line x1="9" y1="11" x2="13" y2="11" />
                </svg>
              </span>
              <span>Library</span>
            </NavLink>
            <NavLink to="/videos" className={`bottom-nav-item ${location.pathname.startsWith('/video') ? 'active' : ''}`}>
              <span className="nav-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="18" rx="4" />
                  <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none" />
                </svg>
              </span>
              <span>Videos</span>
            </NavLink>
            <NavLink to="/categories" className={`bottom-nav-item ${location.pathname.startsWith('/category') || location.pathname === '/categories' ? 'active' : ''}`}>
              <span className="nav-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" rx="2" />
                  <rect x="14" y="3" width="7" height="7" rx="2" />
                  <rect x="14" y="14" width="7" height="7" rx="2" />
                  <rect x="3" y="14" width="7" height="7" rx="2" />
                </svg>
              </span>
              <span>Categories</span>
            </NavLink>
            <NavLink to={isLoggedIn ? "/profile" : "/login"} className={`bottom-nav-item ${location.pathname === '/profile' || location.pathname === '/login' ? 'active' : ''}`}>
              <span className="nav-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </span>
              <span>Profile</span>
            </NavLink>
          </div>
        </div>
      )}

      {/* ─── 4. MOBILE NAVIGATION DRAWER (Slide-out menu for mobile & tablet) ─── */}
      {drawerOpen && (
        <>
          <div className="mobile-drawer-overlay" onClick={closeDrawer} />
          <aside className="mobile-drawer" role="dialog" aria-modal="true" aria-label="Mobile Navigation Menu">
            <div className="mobile-drawer-header">
              <Link className="logo" to="/" onClick={closeDrawer} aria-label="EduVault Home">
                <img src="/logo.png" alt="EduVault" className="brand-logo-img" />
              </Link>
              <button
                type="button"
                onClick={closeDrawer}
                style={{
                  background: 'transparent',
                  border: 0,
                  fontSize: '18px',
                  cursor: 'pointer',
                  color: 'var(--ink)',
                  minHeight: '44px',
                  minWidth: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                aria-label="Close Mobile Navigation Menu"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="mobile-drawer-nav" role="navigation">
              <NavLink to="/" onClick={closeDrawer}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                <span>Home</span>
              </NavLink>
              <NavLink to="/library" onClick={closeDrawer}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  <line x1="9" y1="7" x2="15" y2="7" />
                  <line x1="9" y1="11" x2="13" y2="11" />
                </svg>
                <span>Library</span>
              </NavLink>
              <NavLink to="/videos" onClick={closeDrawer}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="18" rx="4" />
                  <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none" />
                </svg>
                <span>Videos</span>
              </NavLink>
              <NavLink to="/categories" onClick={closeDrawer}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" rx="1.5" />
                  <rect x="14" y="3" width="7" height="7" rx="1.5" />
                  <rect x="14" y="14" width="7" height="7" rx="1.5" />
                  <rect x="3" y="14" width="7" height="7" rx="1.5" />
                </svg>
                <span>Categories</span>
              </NavLink>
              <NavLink to="/saved" onClick={closeDrawer}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
                <span>My Library</span>
              </NavLink>

              <button
                type="button"
                onClick={() => {
                  closeDrawer();
                  setSearchModalOpen(true);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md, 12px)',
                  fontWeight: 600,
                  fontSize: '14px',
                  color: '#334155',
                  background: '#F1F5F9',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  marginTop: '4px',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <span>Search Books & Videos</span>
              </button>

              {isLoggedIn ? (
                <>
                  <NavLink to="/profile" onClick={closeDrawer} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {user.avatar && typeof user.avatar === 'string' && user.avatar.startsWith('http') ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="user-avatar-img"
                        style={{ width: '22px', height: '22px' }}
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    )}
                    <span>Account &amp; Profile ({user.name})</span>
                  </NavLink>
                  <button
                    onClick={() => {
                      logout();
                      closeDrawer();
                    }}
                    style={{
                      background: 'rgba(220, 38, 38, 0.1)',
                      color: 'var(--error, #ef4444)',
                      border: '1px solid rgba(220, 38, 38, 0.2)',
                      padding: '12px',
                      borderRadius: '8px',
                      fontWeight: '700',
                      marginTop: '12px',
                      cursor: 'pointer',
                      width: '100%',
                    }}
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
                  <Link
                    className="auth-submit-btn"
                    to="/login"
                    onClick={closeDrawer}
                  >
                    Sign In
                  </Link>
                  <Link
                    className="auth-submit-btn secondary"
                    to="/register"
                    onClick={closeDrawer}
                  >
                    Create Account
                  </Link>
                </div>
              )}
            </div>
          </aside>
        </>
      )}

      {/* ─── 5. GLOBAL SPOTLIGHT SEARCH MODAL OVERLAY ─── */}
      {searchModalOpen && (
        <div className="global-search-modal-overlay" onClick={() => setSearchModalOpen(false)}>
          <div
            className="global-search-modal-card"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleModalKeyDown}
          >
            <div className="global-search-modal-header">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                className="global-search-modal-input"
                placeholder="Search textbooks, NCERT classes, video courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  className="search-input-clear-btn"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear Search Input"
                  title="Clear text"
                >
                  ✕
                </button>
              )}
              <button
                type="button"
                className="global-search-modal-close"
                onClick={() => setSearchModalOpen(false)}
                aria-label="Close Modal"
                title="Close (Esc)"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Filter Category Tabs */}
            <div className="global-search-tabs">
              <button
                type="button"
                className={`global-search-tab-btn ${searchTab === 'all' ? 'active' : ''}`}
                onClick={() => setSearchTab('all')}
              >
                All
              </button>
              <button
                type="button"
                className={`global-search-tab-btn ${searchTab === 'books' ? 'active' : ''}`}
                onClick={() => setSearchTab('books')}
              >
                📚 Books
              </button>
              <button
                type="button"
                className={`global-search-tab-btn ${searchTab === 'videos' ? 'active' : ''}`}
                onClick={() => setSearchTab('videos')}
              >
                🎬 Video Courses
              </button>
              <button
                type="button"
                className={`global-search-tab-btn ${searchTab === 'ncert' ? 'active' : ''}`}
                onClick={() => setSearchTab('ncert')}
              >
                🎓 NCERT
              </button>
            </div>

            <div className="global-search-modal-body">
              {!searchQuery && (
                <div>
                  {recentSearches.length > 0 && (
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--muted)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                          RECENT SEARCHES
                        </span>
                        <button
                          type="button"
                          onClick={clearRecentSearches}
                          style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                        >
                          Clear History
                        </button>
                      </div>
                      <div className="global-search-chip-group" style={{ marginBottom: '12px' }}>
                        {recentSearches.map((term) => (
                          <button
                            key={term}
                            className="global-search-chip"
                            onClick={() => setSearchQuery(term)}
                          >
                            🕒 {term}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--muted)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>
                    POPULAR TRENDING SEARCHES
                  </div>
                  <div className="global-search-chip-group">
                    {['Class 12 Physics', 'Chemistry NCERT', 'Mathematics', 'Biology', 'Python Programming', 'CodeWithHarry', 'Class 10 Science'].map((term) => (
                      <button
                        key={term}
                        className="global-search-chip"
                        onClick={() => setSearchQuery(term)}
                      >
                        🔥 {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {searchQuery && searchResults.length === 0 && (
                <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--muted)' }}>
                  <span style={{ fontSize: '36px', display: 'block', marginBottom: '8px' }}>🔎</span>
                  <div style={{ fontWeight: 700, color: 'var(--ink)', fontSize: '15px' }}>No matching resources found</div>
                  <small style={{ fontSize: '13px', marginTop: '4px', display: 'block' }}>Try searching for "Physics", "Class 12", "NCERT", or "Python"</small>
                </div>
              )}

              {searchResults.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--muted)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '6px' }}>
                    SEARCH RESULTS ({searchResults.length})
                  </div>
                  {searchResults.map((item, idx) => (
                    <Link
                      key={item.type + '-' + item.id}
                      to={item.url}
                      className={`global-search-result-item ${activeIndex === idx ? 'active' : ''}`}
                      onClick={() => {
                        saveRecentSearch(searchQuery);
                        setSearchModalOpen(false);
                      }}
                      onMouseEnter={() => setActiveIndex(idx)}
                    >
                      <span className="global-search-result-badge">{item.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 700, fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.title}
                          </span>
                          <span style={{ fontSize: '10px', fontWeight: 800, background: 'var(--bg)', color: 'var(--p)', padding: '2px 6px', borderRadius: '6px', border: '1px solid var(--line)' }}>
                            {item.badge}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600, marginTop: '2px' }}>
                          {item.meta}
                        </div>
                      </div>
                      <span style={{ fontSize: '13px', color: 'var(--p)', fontWeight: 700 }}>
                        {activeIndex === idx ? '↵ Select' : '→'}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Keyboard Shortcuts Footer Bar */}
            <div className="search-modal-footer-hints">
              <span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>
              <span><kbd>↵</kbd> Select</span>
              <span><kbd>Esc</kbd> Exit</span>
            </div>
          </div>
        </div>
      )}

      {/* ─── 6. GLOBAL AUTHENTICATION GATE PROMPT MODAL ─── */}
      {authPrompt && (
        <div className="auth-gate-modal-overlay" onClick={() => setAuthPrompt(null)}>
          <div
            className="auth-gate-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-gate-title"
          >
            <button
              type="button"
              className="auth-gate-modal-close"
              onClick={() => setAuthPrompt(null)}
              aria-label="Close dialog"
            >
              ✕
            </button>

            <div className="auth-gate-icon-circle">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0F5E53" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>

            <span className="auth-gate-feature-pill">
              🔒 {authPrompt.feature || 'Account Feature'}
            </span>

            <h3 id="auth-gate-title" className="auth-gate-title">
              {authPrompt.title || 'Sign In Required'}
            </h3>

            <p className="auth-gate-message">
              {authPrompt.message || 'Please sign in or create an account to access this feature and sync across all your devices.'}
            </p>

            <div className="auth-gate-actions">
              <Link
                to="/login"
                state={{ from: authPrompt.from || location.pathname, notice: authPrompt.message }}
                className="auth-gate-btn-primary"
                onClick={() => setAuthPrompt(null)}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                state={{ from: authPrompt.from || location.pathname }}
                className="auth-gate-btn-secondary"
                onClick={() => setAuthPrompt(null)}
              >
                Create Free Account
              </Link>
            </div>

            <button
              type="button"
              className="auth-gate-btn-dismiss"
              onClick={() => setAuthPrompt(null)}
            >
              Continue Browsing as Guest
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default Shell;

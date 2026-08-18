import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { items } from '../data/openItems';
import { educationalVideos } from '../data/educationalVideos';

export function Shell({ children, welcomeMsg }) {
  const { user, isLoggedIn, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
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
      return saved ? JSON.parse(saved) : ['Class 12 Physics', 'Chemistry NCERT', 'Python Programming', 'Calculus'];
    } catch {
      return ['Class 12 Physics', 'Chemistry NCERT', 'Python Programming', 'Calculus'];
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

  // Keyboard shortcut listener (Ctrl+K or Cmd+K to toggle search, Escape to close, Arrow keys & Enter to navigate)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSearchModalOpen(false);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const rawSearchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    const books = items
      .filter((b) => (b.title + ' ' + (b.subject || '') + ' ' + (b.author || '') + ' ' + (b.level || '') + ' ' + (b.source || '')).toLowerCase().includes(q))
      .map((b) => ({
        type: b.source === 'NCERT' ? 'ncert' : 'book',
        id: b.id,
        title: b.title,
        meta: `${b.subject || 'Textbook'} · ${b.level || 'Open Resource'}`,
        url: b.source === 'NCERT' ? `/read/${b.id}` : `/resource/${b.id}`,
        icon: b.source === 'NCERT' ? '🎓' : '📚',
        badge: b.source === 'NCERT' ? 'NCERT' : 'Book',
      }));

    const videos = educationalVideos
      .filter((v) => (v.title + ' ' + (v.channel || '') + ' ' + (v.category || '')).toLowerCase().includes(q))
      .map((v) => ({
        type: 'video',
        id: v.id,
        title: v.title,
        meta: `Video Course · ${v.channel}`,
        url: `/video/${v.id}`,
        icon: '🎬',
        badge: 'Video',
      }));

    return [...books, ...videos];
  }, [searchQuery]);

  const searchResults = useMemo(() => {
    if (searchTab === 'books') return rawSearchResults.filter((r) => r.type === 'book').slice(0, 8);
    if (searchTab === 'videos') return rawSearchResults.filter((r) => r.type === 'video').slice(0, 8);
    if (searchTab === 'ncert') return rawSearchResults.filter((r) => r.type === 'ncert').slice(0, 8);
    return rawSearchResults.slice(0, 10);
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
      {/* ─── 1. MAIN WEBSITE HEADER ─── */}
      {/* ─── 1. MAIN WEBSITE HEADER ─── */}
      <header>
        <Link className="logo" to="/">
          <img src="/logo.png" alt="EduVault" className="brand-logo-img" />
          <span>Edu<span className="logo-highlight">Vault</span></span>
        </Link>

        {/* Desktop Navigation */}
        <nav>
          <NavLink to="/library">Library</NavLink>
          <NavLink to="/categories">Categories</NavLink>
          <NavLink to="/videos">Videos</NavLink>
          <NavLink to="/saved">My library</NavLink>
        </nav>

        <div className="head-actions">
          {loading ? (
            <div className="auth-nav-skeleton" style={{ width: '80px', height: '36px', borderRadius: '8px', background: 'var(--line)', opacity: 0.5 }} />
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
                      <button className="user-dropdown-item logout" onClick={logout} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', textAlign: 'center', width: '100%' }}>
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <Link className="auth-nav-btn" to="/login">
                Log In
              </Link>
              <Link className="auth-nav-btn primary" to="/register">
                Sign Up
              </Link>
            </div>
          )}

          {/* Desktop Command-K Search Trigger */}
          <button
            type="button"
            className="desktop-search-trigger"
            onClick={() => setSearchModalOpen(true)}
            title="Search books, NCERT, video courses (Ctrl+K)"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <span>Search resources...</span>
            <kbd className="search-kbd-shortcut">Ctrl K</kbd>
          </button>

          <Link className="outline" to="/upload">
            Contribute
          </Link>

          {/* Hamburger Menu Toggle Button for Mobile (<768px) */}
          <button
            type="button"
            className="mobile-nav-toggle"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open Mobile Navigation Menu"
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </header>

      {/* Slide-out Mobile Drawer */}
      {drawerOpen && (
        <>
          <div className="mobile-drawer-overlay" onClick={closeDrawer} />
          <aside className="mobile-drawer">
            <div className="mobile-drawer-header">
              <Link className="logo" to="/" onClick={closeDrawer}>
                <img src="/logo.png" alt="EduVault" className="brand-logo-img" />
                <span>Edu<span className="logo-highlight">Vault</span></span>
              </Link>
              <button
                type="button"
                onClick={closeDrawer}
                style={{
                  background: 'transparent',
                  border: 0,
                  fontSize: '22px',
                  cursor: 'pointer',
                  color: 'var(--ink)',
                  minHeight: '44px',
                  minWidth: '44px',
                }}
                aria-label="Close Mobile Navigation Menu"
              >
                ✕
              </button>
            </div>
            <nav className="mobile-drawer-nav">
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
                <span>Textbook Library</span>
              </NavLink>
              <NavLink to="/videos" onClick={closeDrawer}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="18" rx="4" />
                  <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none" />
                </svg>
                <span>Video Courses</span>
              </NavLink>
              <NavLink to="/categories" onClick={closeDrawer}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" rx="1.5" />
                  <rect x="14" y="3" width="7" height="7" rx="1.5" />
                  <rect x="14" y="14" width="7" height="7" rx="1.5" />
                  <rect x="3" y="14" width="7" height="7" rx="1.5" />
                </svg>
                <span>Categories &amp; Subjects</span>
              </NavLink>
              <NavLink to="/saved" onClick={closeDrawer}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
                <span>My Saved List</span>
              </NavLink>

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
                      color: 'var(--error)',
                      border: '1px solid rgba(220, 38, 38, 0.2)',
                      padding: '12px',
                      borderRadius: '8px',
                      fontWeight: '700',
                      marginTop: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
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
            </nav>
          </aside>
        </>
      )}

      {welcomeMsg && <div className="welcome-back">{welcomeMsg}</div>}
      
      <main
        className={isReaderRoute ? 'reader-page-main' : ''}
        style={{
          minHeight: isReaderRoute ? 'calc(100dvh - 56px)' : 'calc(100vh - 140px)',
          height: isReaderRoute ? 'calc(100dvh - 56px)' : 'auto',
          overflow: isReaderRoute ? 'hidden' : 'visible',
        }}
      >
        {children}
      </main>

      {!isReaderRoute && (
        <>
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
                {isLoggedIn ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                    <polyline points="10 17 15 12 10 7" />
                    <line x1="15" y1="12" x2="3" y2="12" />
                  </svg>
                )}
              </span>
              <span>{isLoggedIn ? 'Profile' : 'Sign In'}</span>
            </NavLink>
          </div>

          <footer>
            <b>
              ◈ Edu<span>Vault</span>
            </b>
            <span>Learn openly. Share responsibly.</span>
            <Link to="/copyright">Copyright &amp; takedown</Link>
          </footer>
        </>
      )}

      {/* ─── 4. GLOBAL SPOTLIGHT SEARCH MODAL OVERLAY ─── */}
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
                ✕
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
    </>
  );
}

export default Shell;

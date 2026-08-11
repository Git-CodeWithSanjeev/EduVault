import React, { useState, useMemo, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { items } from '../data/openItems';
import { educationalVideos } from '../data/educationalVideos';

export function Shell({ children, welcomeMsg }) {
  const { user, isLoggedIn, loading, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();

  const closeDrawer = () => setDrawerOpen(false);
  const isReaderRoute = location.pathname.startsWith('/read/');

  // Keyboard shortcut (Escape to close search)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSearchModalOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    const books = items
      .filter((b) => (b.title + ' ' + (b.subject || '') + ' ' + (b.author || '') + ' ' + (b.level || '')).toLowerCase().includes(q))
      .slice(0, 5)
      .map((b) => ({ type: 'book', id: b.id, title: b.title, meta: `${b.subject || 'Textbook'} · ${b.level || 'NCERT'}`, url: b.source === 'NCERT' ? `/read/${b.id}` : `/resource/${b.id}`, icon: '📚' }));

    const videos = educationalVideos
      .filter((v) => (v.title + ' ' + (v.channel || '') + ' ' + (v.category || '')).toLowerCase().includes(q))
      .slice(0, 5)
      .map((v) => ({ type: 'video', id: v.id, title: v.title, meta: `Video Course · ${v.channel}`, url: `/video/${v.id}`, icon: '🎬' }));

    return [...books, ...videos];
  }, [searchQuery]);

  return (
    <>
      {/* ─── 1. MAIN WEBSITE HEADER ─── */}
      <header>
        <Link className="logo" to="/">
          ◈ Edu<span>Vault</span>
        </Link>

        {/* Desktop Navigation */}
        <nav>
          <NavLink to="/library">Library</NavLink>
          <NavLink to="/categories">Categories</NavLink>
          <NavLink to="/videos">Videos</NavLink>
          <NavLink to="/saved">My library</NavLink>
        </nav>

        <div className="head-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {loading ? (
            <div className="auth-nav-skeleton" style={{ width: '80px', height: '36px', borderRadius: '8px', background: 'var(--line)', opacity: 0.5 }} />
          ) : isLoggedIn ? (
            <div className="user-menu-wrap" style={{ position: 'relative' }}>
              <button
                className="user-profile-btn"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="User Profile Menu"
              >
                <span>{user.avatar || '🎓'}</span>
                <strong>{user.name}</strong>
                <span style={{ fontSize: '10px', opacity: 0.6 }}>▼</span>
              </button>

              {menuOpen && (
                <div className="user-dropdown" onClick={() => setMenuOpen(false)}>
                  <div className="user-dropdown-header">
                    <p>{user.name}</p>
                    <small>{user.email}</small>
                  </div>
                  <Link to="/profile" className="user-dropdown-item">
                    Account &amp; Profile
                  </Link>
                  <Link to="/saved" className="user-dropdown-item">
                    Saved Wishlist
                  </Link>
                  <Link to="/upload" className="user-dropdown-item">
                    Contribute Books
                  </Link>
                  <button className="user-dropdown-item logout" onClick={logout}>
                    Sign Out
                  </button>
                </div>
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

          <Link className="outline" to="/upload">
            Contribute
          </Link>

          {/* Premium Mobile & Global Search Button */}
          <button
            type="button"
            className="mobile-search-btn"
            onClick={() => setSearchModalOpen(true)}
            aria-label="Search EduVault"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>

          {/* Hamburger Menu Toggle Button for Mobile (<768px) */}
          <button
            type="button"
            className="mobile-nav-toggle"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open Mobile Navigation Menu"
          >
            ☰
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
                ◈ Edu<span>Vault</span>
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
                  <NavLink to="/profile" onClick={closeDrawer}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
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
          <div className="global-search-modal-card" onClick={(e) => e.stopPropagation()}>
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
              {searchQuery ? (
                <button
                  className="global-search-modal-close"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear Search"
                  style={{ width: '28px', height: '28px', fontSize: '13px' }}
                >
                  ✕
                </button>
              ) : null}
              <button
                className="global-search-modal-close"
                onClick={() => setSearchModalOpen(false)}
                aria-label="Close Modal"
              >
                ✕
              </button>
            </div>

            <div className="global-search-modal-body">
              {!searchQuery && (
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--muted)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '10px' }}>
                    POPULAR SEARCHES
                  </div>
                  <div className="global-search-chip-group">
                    {['Class 12 Physics', 'Chemistry NCERT', 'Mathematics', 'Biology', 'Python Programming', 'CodeWithHarry', 'Class 10 Science'].map((term) => (
                      <button
                        key={term}
                        className="global-search-chip"
                        onClick={() => setSearchQuery(term)}
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {searchQuery && searchResults.length === 0 && (
                <div style={{ textAlign: 'center', padding: '30px 16px', color: 'var(--muted)' }}>
                  <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>🔎</span>
                  <div style={{ fontWeight: 700, color: 'var(--ink)', fontSize: '15px' }}>No matching resources found</div>
                  <small style={{ fontSize: '13px' }}>Try searching for "Physics", "Class 12", "NCERT", or "Python"</small>
                </div>
              )}

              {searchResults.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--muted)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '6px' }}>
                    SEARCH RESULTS ({searchResults.length})
                  </div>
                  {searchResults.map((item) => (
                    <Link
                      key={item.type + '-' + item.id}
                      to={item.url}
                      className="global-search-result-item"
                      onClick={() => setSearchModalOpen(false)}
                    >
                      <span className="global-search-result-badge">{item.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>
                          {item.meta}
                        </div>
                      </div>
                      <span style={{ fontSize: '14px', color: 'var(--p)', fontWeight: 700 }}>→</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Shell;

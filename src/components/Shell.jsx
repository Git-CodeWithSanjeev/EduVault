import React, { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Shell({ children, welcomeMsg }) {
  const { user, isLoggedIn, loading, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();

  const closeDrawer = () => setDrawerOpen(false);
  const isReaderRoute = location.pathname.startsWith('/read/');

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
                🏠 Home
              </NavLink>
              <NavLink to="/videos" onClick={closeDrawer}>
                🎬 Video Courses
              </NavLink>
              <NavLink to="/library" onClick={closeDrawer}>
                📚 Textbook Library
              </NavLink>
              <NavLink to="/categories" onClick={closeDrawer}>
                🏷️ Categories &amp; Subjects
              </NavLink>
              <NavLink to="/saved" onClick={closeDrawer}>
                🔖 My Saved List
              </NavLink>

              {isLoggedIn ? (
                <>
                  <NavLink to="/profile" onClick={closeDrawer}>
                    👤 Account &amp; Profile ({user.name})
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
          minHeight: isReaderRoute ? 'calc(100dvh - 66px)' : 'calc(100vh - 140px)',
          height: isReaderRoute ? 'calc(100dvh - 66px)' : 'auto',
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
              <span className="nav-icon">🏠</span>
              <span>Home</span>
            </NavLink>
            <NavLink to="/videos" className={`bottom-nav-item ${location.pathname.startsWith('/video') ? 'active' : ''}`}>
              <span className="nav-icon">🎬</span>
              <span>Videos</span>
            </NavLink>
            <NavLink to="/library" className={`bottom-nav-item ${location.pathname === '/library' ? 'active' : ''}`}>
              <span className="nav-icon">📚</span>
              <span>Library</span>
            </NavLink>
            <NavLink to={isLoggedIn ? "/profile" : "/login"} className={`bottom-nav-item ${location.pathname === '/profile' || location.pathname === '/login' ? 'active' : ''}`}>
              <span className="nav-icon">{isLoggedIn ? '👤' : '🔑'}</span>
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
    </>
  );
}

export default Shell;

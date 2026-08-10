import React, { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoginModal } from './LoginModal';

export function Shell({ children, welcomeMsg }) {
  const { user, isLoggedIn, logout, openAuthModal } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();

  const closeDrawer = () => setDrawerOpen(false);

  return (
    <>
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
          {isLoggedIn ? (
            <div className="user-menu-wrap">
              <button
                className="user-profile-btn"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="User Profile Menu"
              >
                <span>{user.avatar || '👤'}</span>
                <strong>{user.name}</strong>
                <span style={{ fontSize: '10px', opacity: 0.6 }}>▼</span>
              </button>

              {menuOpen && (
                <div className="user-dropdown" onClick={() => setMenuOpen(false)}>
                  <div className="user-dropdown-header">
                    <p>{user.name}</p>
                    <small>{user.email}</small>
                  </div>
                  <Link to="/saved" className="user-dropdown-item">
                    ★ My Saved Wishlist
                  </Link>
                  <Link to="/upload" className="user-dropdown-item">
                    📤 Contribute Books
                  </Link>
                  <button className="user-dropdown-item logout" onClick={logout}>
                    🚪 Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button className="auth-nav-btn" onClick={openAuthModal}>
              🔑 Log In
            </button>
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
                🏷️ Categories & Subjects
              </NavLink>
              <NavLink to="/saved" onClick={closeDrawer}>
                🔖 My Saved List
              </NavLink>
              <NavLink to="/upload" onClick={closeDrawer}>
                📤 Contribute Resource
              </NavLink>
            </nav>
          </aside>
        </>
      )}

      {welcomeMsg && <div className="welcome-back">{welcomeMsg}</div>}
      
      <main style={{ minHeight: 'calc(100vh - 140px)' }}>{children}</main>

      <LoginModal />

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
        <NavLink to="/saved" className={`bottom-nav-item ${location.pathname === '/saved' ? 'active' : ''}`}>
          <span className="nav-icon">🔖</span>
          <span>Saved</span>
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
  );
}

export default Shell;

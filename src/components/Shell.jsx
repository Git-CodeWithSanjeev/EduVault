import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoginModal } from './LoginModal';

export function Shell({ children, welcomeMsg }) {
  const { user, isLoggedIn, logout, openAuthModal } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header>
        <Link className="logo" to="/">
          ◈ Edu<span>Vault</span>
        </Link>
        <nav>
          <NavLink to="/library">Library</NavLink>
          <NavLink to="/categories">Categories</NavLink>
          <NavLink to="/videos">Videos</NavLink>
          <NavLink to="/saved">My library</NavLink>
        </nav>
        <div className="head-actions">
          {isLoggedIn ? (
            <div className="user-menu-wrap">
              <button
                className="user-profile-btn"
                onClick={() => setMenuOpen(!menuOpen)}
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
        </div>
      </header>

      {welcomeMsg && <div className="welcome-back">{welcomeMsg}</div>}
      {children}
      <LoginModal />

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

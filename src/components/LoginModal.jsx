import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export function LoginModal() {
  const { isAuthModalOpen, closeAuthModal, login } = useAuth();
  const [tab, setTab] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  if (!isAuthModalOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    setError('');
    login(email, name);
  };

  const handleQuickDemo = () => {
    setError('');
    login('alex.student@eduvault.org', 'Alex Johnson');
  };

  return (
    <div className="auth-overlay" onClick={closeAuthModal}>
      <div className="auth-card" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="auth-close" onClick={closeAuthModal}>✕</button>

        {/* Modal Header */}
        <div className="auth-header">
          <div className="auth-logo-badge">◈ EduVault Account</div>
          <h2>{tab === 'login' ? 'Welcome Back!' : 'Create Your Free Account'}</h2>
          <p>Sign in to save books, build custom wishlists, and sync study progress.</p>
        </div>

        {/* Tab Switcher */}
        <div className="auth-tabs">
          <button
            className={`auth-tab ${tab === 'login' ? 'active' : ''}`}
            onClick={() => { setTab('login'); setError(''); }}
          >
            Sign In
          </button>
          <button
            className={`auth-tab ${tab === 'signup' ? 'active' : ''}`}
            onClick={() => { setTab('signup'); setError(''); }}
          >
            Create Account
          </button>
        </div>

        {/* Quick Demo Login */}
        <div className="auth-demo-box">
          <button type="button" className="auth-demo-btn" onClick={handleQuickDemo}>
            ⚡ 1-Click Quick Demo Sign In
          </button>
          <small>Instant sign-in as Alex Johnson (Student)</small>
        </div>

        <div className="auth-divider">
          <span>OR CONTINUE WITH EMAIL</span>
        </div>

        {/* Error message */}
        {error && <div className="auth-error">{error}</div>}

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          {tab === 'signup' && (
            <div className="auth-field">
              <label>Full Name</label>
              <input
                type="text"
                placeholder="e.g. Alex Johnson"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}

          <div className="auth-field">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="auth-field">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="auth-submit-btn">
            {tab === 'login' ? 'Sign In →' : 'Create Free Account →'}
          </button>
        </form>
      </div>
    </div>
  );
}

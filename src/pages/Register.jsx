import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Register() {
  const { register, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isLoggedIn) {
    navigate('/', { replace: true });
  }

  // Password requirements checks
  const passLength = password.length >= 8;
  const passHasNumber = /\d/.test(password);
  const passMatch = password && password === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || name.trim().length < 2) {
      setError('Full Name must be at least 2 characters long');
      return;
    }
    if (!email || !email.includes('@') || !email.includes('.')) {
      setError('Please enter a valid email address');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const res = await register(name, email, password);
      if (res?.autoConfirmed) {
        navigate('/', { replace: true });
      } else {
        navigate('/verify-email', { state: { email: res.email } });
      }
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-page-card">
        <div className="auth-header">
          <h2>Create Account</h2>
          <p>Join EduVault to access legal education, textbooks, and open resources.</p>
        </div>

        {error && <div className="auth-error" role="alert">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {/* STEP 1: Full Name */}
          <div className="auth-field">
            <label htmlFor="reg-name">Full Name</label>
            <input
              id="reg-name"
              type="text"
              placeholder="e.g. Alex Johnson"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              required
              autoFocus
            />
          </div>

          {/* Email Address */}
          <div className="auth-field">
            <label htmlFor="reg-email">Email Address</label>
            <input
              id="reg-email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
              autoComplete="email"
            />
          </div>

          {/* Password */}
          <div className="auth-field">
            <label htmlFor="reg-password">Password</label>
            <div className="password-input-wrapper">
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>

            {/* Password Validation Requirements */}
            <div className="password-hints">
              <span className={passLength ? 'valid' : ''}>
                {passLength ? '✓' : '•'} At least 8 characters
              </span>
              <span className={passHasNumber ? 'valid' : ''}>
                {passHasNumber ? '✓' : '•'} Contains a number
              </span>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="auth-field">
            <label htmlFor="reg-confirm-password">Confirm Password</label>
            <div className="password-input-wrapper">
              <input
                id="reg-confirm-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                required
                autoComplete="new-password"
              />
            </div>
            {confirmPassword && (
              <small className={`confirm-hint ${passMatch ? 'valid' : 'invalid'}`}>
                {passMatch ? '✓ Passwords match' : '✕ Passwords do not match'}
              </small>
            )}
          </div>

          {/* Submit Button */}
          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? 'Creating Account…' : 'Create Account / Next →'}
          </button>
        </form>

        <div className="auth-page-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}

export default Register;

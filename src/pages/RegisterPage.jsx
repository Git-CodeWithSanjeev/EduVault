import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PasswordInput, AuthAlert, GoogleAuthButton, AuthDivider } from '../components/FormElements';
import { isValidEmail, isValidName, getPasswordRequirements } from '../utils/validation';
import { triggerDirectGoogleLogin } from '../utils/googleAuth';

export function Register() {
  const { register, loginWithGoogle, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [honeypot, setHoneypot] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  if (isLoggedIn) {
    navigate('/', { replace: true });
  }

  // Password requirements checks
  const { passLength, passHasNumber } = getPasswordRequirements(password);
  const passMatch = password && password === confirmPassword;

  const handleGoogleSignup = async () => {
    setError('');
    setGoogleLoading(true);

    try {
      const googleProfile = await triggerDirectGoogleLogin();
      await loginWithGoogle(googleProfile);
      navigate('/', { replace: true });
    } catch (err) {
      if (!err.message?.includes('popup_closed') && !err.message?.includes('user_closed')) {
        setError(err.message || 'Google sign-up failed. Please try again.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isValidName(name)) {
      setError('Full Name must be at least 2 characters long');
      return;
    }
    if (!isValidEmail(email)) {
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
      const res = await register(name, email, password, honeypot);
      navigate('/verify-email', { state: { email: res.email || email.trim() } });
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-page-card">
        <div className="auth-header" style={{ textAlign: 'center' }}>
          <Link to="/" style={{ display: 'inline-block', marginBottom: '12px' }}>
            <img src="/logo.png" alt="EduVault" style={{ height: '42px', width: 'auto', objectFit: 'contain' }} />
          </Link>
          <h2>Create Account</h2>
          <p>Join EduVault to access legal education, textbooks, and open resources.</p>
        </div>

        <AuthAlert type="error" message={error} />

        {/* 1-Click Google OAuth Sign Up */}
        <GoogleAuthButton
          onClick={handleGoogleSignup}
          loading={googleLoading}
          disabled={loading || googleLoading}
          text="Sign up with Google"
        />

        <AuthDivider text="or register with email" />

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {/* Invisible Anti-Bot Honeypot Field */}
          <div style={{ display: 'none', opacity: 0, position: 'absolute', left: '-9999px' }} aria-hidden="true">
            <input
              type="text"
              name="website_url_hp"
              tabIndex="-1"
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>
          {/* STEP 1: Full Name */}
          <div className="auth-field">
            <label htmlFor="reg-name">Full Name</label>
            <input
              id="reg-name"
              type="text"
              placeholder="e.g. Sanjeev Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading || googleLoading}
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
              disabled={loading || googleLoading}
              required
              autoComplete="email"
            />
          </div>

          {/* Password */}
          <div className="auth-field">
            <label htmlFor="reg-password">Password</label>
            <PasswordInput
              id="reg-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading || googleLoading}
              required
              autoComplete="new-password"
            />

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
            <PasswordInput
              id="reg-confirm-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading || googleLoading}
              required
              autoComplete="new-password"
            />
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

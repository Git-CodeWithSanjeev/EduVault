import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PasswordInput, AuthAlert, GoogleAuthButton, AuthDivider } from '../components/FormElements';
import { isValidEmail } from '../utils/validation';
import { triggerDirectGoogleLogin } from '../utils/googleAuth';

export function Login() {
  const { login, loginWithGoogle, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  if (isLoggedIn) {
    navigate(from, { replace: true });
  }

  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);

    try {
      const googleProfile = await triggerDirectGoogleLogin();
      await loginWithGoogle(googleProfile);
      navigate(from, { replace: true });
    } catch (err) {
      console.warn('[Google Login Warning]:', err.message);
      if (err.message === 'GOOGLE_ORIGIN_BLOCKED' || err.message?.includes('invalid_client')) {
        setError('Google Sign-In: Domain not authorized in Google Cloud Console. You can sign in with your email/password below.');
      } else if (!err.message?.includes('popup_closed') && !err.message?.includes('user_closed')) {
        setError(err.message || 'Google sign-in was interrupted. Please try again or use email sign-in.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanInput = email.trim().toLowerCase();

    if (!cleanInput) {
      setError('Please enter your email address');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);

    // Support Master Admin ID login from the main login form
    if (cleanInput === 'admin') {
      try {
        const adminRes = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: cleanInput, password: password.trim() }),
        });
        const adminData = await adminRes.json();
        if (adminRes.ok && adminData.success) {
          if (adminData.token) {
            sessionStorage.setItem('eduvault_admin_token', adminData.token);
          }
          sessionStorage.setItem('eduvault_admin_auth', 'true');
          navigate('/admin');
          return;
        } else {
          setError(adminData.error || 'Invalid Admin ID or Password');
          setLoading(false);
          return;
        }
      } catch (adminErr) {
        console.error('[Admin Login Attempt Error]:', adminErr);
      }
    }

    if (!isValidEmail(cleanInput)) {
      setError('Please enter a valid email address (e.g. name@example.com)');
      setLoading(false);
      return;
    }

    try {
      await login(cleanInput, password, honeypot);
      navigate(from, { replace: true });
    } catch (err) {
      if (err.message === 'UNVERIFIED_EMAIL') {
        navigate('/verify-email', { state: { email: cleanInput } });
      } else {
        setError(err.message || 'Authentication failed');
      }
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
          <h2>Sign In to EduVault</h2>
          <p>Choose your preferred sign-in method to access your account.</p>
        </div>

        <AuthAlert type="error" message={error} />

        {/* 1-Click Google OAuth Sign In */}
        <GoogleAuthButton
          onClick={handleGoogleLogin}
          loading={googleLoading}
          disabled={loading || googleLoading}
          text="Continue with Google"
        />

        <AuthDivider text="or sign in with email" />

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
          <div className="auth-field">
            <label htmlFor="login-email">Email Address or Admin ID</label>
            <input
              id="login-email"
              type="text"
              placeholder="name@example.com or admin"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
              autoFocus
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <div className="label-row">
              <label htmlFor="login-password">Password</label>
              <Link to="/reset-password" className="auth-forgot-link">
                Forgot password?
              </Link>
            </div>
            <PasswordInput
              id="login-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? 'Signing In…' : 'Sign In →'}
          </button>
        </form>

        <div className="auth-page-footer">
          Don't have an account? <Link to="/register">Create an account</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;

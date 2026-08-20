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
      if (err.message === 'GOOGLE_ORIGIN_BLOCKED' || err.message?.includes('invalid_client')) {
        setError('Google blocked this request because of client configuration or missing origin in Google Cloud console.');
      } else if (!err.message?.includes('popup_closed') && !err.message?.includes('user_closed')) {
        setError(err.message || 'Google sign-in failed. Please try again.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      if (err.message === 'UNVERIFIED_EMAIL') {
        navigate('/verify-email', { state: { email } });
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
          <div className="auth-field">
            <label htmlFor="login-email">Email Address</label>
            <input
              id="login-email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading || googleLoading}
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
              disabled={loading || googleLoading}
              required
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading || googleLoading}>
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

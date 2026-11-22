import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function AuthCallback() {
  const navigate = useNavigate();
  const { loginWithGoogle, isLoggedIn, user, setIsAuthLoading } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function handleOAuthCallback() {
      if (typeof setIsAuthLoading === 'function') {
        setIsAuthLoading(true);
      }

      try {
        // 1. If user is already authenticated, redirect immediately
        if (isLoggedIn && user) {
          const dest = sessionStorage.getItem('eduvault-redirect-after-auth') || '/';
          sessionStorage.removeItem('eduvault-redirect-after-auth');
          navigate(dest, { replace: true });
          return;
        }

        // 2. Parse OAuth tokens from URL hash or query search parameters
        const rawHash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash;
        const hashParams = new URLSearchParams(rawHash);
        const searchParams = new URLSearchParams(window.location.search);

        const credential = hashParams.get('credential') || searchParams.get('credential');
        const idToken = hashParams.get('id_token') || searchParams.get('id_token');
        const accessToken = hashParams.get('access_token') || searchParams.get('access_token');
        const token = searchParams.get('token');

        if (credential || idToken) {
          await loginWithGoogle(credential || idToken);
        } else if (accessToken) {
          // Fetch Google User Profile using Access Token
          const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (!userInfoRes.ok) throw new Error('Could not fetch user profile from Google.');
          const profile = await userInfoRes.json();
          await loginWithGoogle({
            email: profile.email,
            name: profile.name || profile.given_name || profile.email.split('@')[0],
            avatar: profile.picture || '🎓',
            googleId: profile.sub,
            accessToken,
          });
        } else if (token) {
          await loginWithGoogle({ token });
        } else {
          // Check if session was already set in localStorage
          const stored = localStorage.getItem('eduvault_auth_user');
          if (!stored) {
            navigate('/login', { replace: true, state: { notice: 'No active Google session found. Please sign in below.' } });
            return;
          }
        }

        const dest = sessionStorage.getItem('eduvault-redirect-after-auth') || '/';
        sessionStorage.removeItem('eduvault-redirect-after-auth');
        navigate(dest, { replace: true });
      } catch (err) {
        console.error('[OAuth Callback Resolution Error]:', err);
        if (active) {
          setError(err.message || 'Google authentication resolution encountered an error.');
          if (typeof setIsAuthLoading === 'function') {
            setIsAuthLoading(false);
          }
        }
      }
    }

    handleOAuthCallback();

    return () => {
      active = false;
    };
  }, [navigate, loginWithGoogle, isLoggedIn, user, setIsAuthLoading]);

  if (error) {
    return (
      <div className="auth-page-container">
        <div className="auth-page-card" style={{ textAlign: 'center', padding: '36px 24px' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚠️</div>
          <h3 style={{ fontSize: '18px', color: '#b91c1c', marginBottom: '10px' }}>Authentication Error</h3>
          <p style={{ fontSize: '13.5px', color: '#475569', marginBottom: '20px', lineHeight: 1.5 }}>{error}</p>
          <Link
            to="/login"
            style={{
              display: 'inline-block',
              padding: '10px 24px',
              borderRadius: '10px',
              background: '#0F5E53',
              color: '#ffffff',
              fontWeight: 700,
              textDecoration: 'none',
              fontSize: '13px',
            }}
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page-container">
      <div className="auth-page-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
        <div className="nav-skeleton-spinner" style={{ width: '32px', height: '32px', margin: '0 auto 16px', borderWidth: '3px' }} />
        <h3 style={{ fontSize: '17px', color: '#0F5E53', marginBottom: '8px', fontWeight: 700 }}>
          Synchronizing Your Session…
        </h3>
        <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
          Authenticating with Google and taking you to your destination.
        </p>
      </div>
    </div>
  );
}

export default AuthCallback;

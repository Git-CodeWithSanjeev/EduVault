import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const redirectTo = sessionStorage.getItem('eduvault-redirect-after-auth') || '/';
    sessionStorage.removeItem('eduvault-redirect-after-auth');
    navigate(redirectTo, { replace: true });
  }, [navigate]);

  return (
    <div className="auth-page-container">
      <div className="auth-page-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
        <div className="auth-loading-spinner" style={{ margin: '0 auto 20px' }} />
        <h3 style={{ fontSize: '18px', color: 'var(--ink)', marginBottom: '8px' }}>
          Redirecting…
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0 }}>
          Taking you to your destination.
        </p>
      </div>
    </div>
  );
}

export default AuthCallback;

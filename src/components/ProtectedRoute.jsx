import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children }) {
  const { isLoggedIn, loading, isAuthLoading } = useAuth();
  const location = useLocation();
  const authBusy = isAuthLoading ?? loading;

  if (authBusy) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-loading-spinner" />
        <p>Verifying secure session…</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    const isLibrary = location.pathname.includes('saved') || location.pathname.includes('library');
    const noticeMessage = isLibrary
      ? 'Please sign in to access your saved library and personal bookmarks.'
      : 'Please sign in to access this feature.';
    return <Navigate to="/login" state={{ from: location, notice: noticeMessage }} replace />;
  }

  return children;
}

export default ProtectedRoute;

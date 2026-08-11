import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Profile() {
  const { user, logout, updatePassword, resendVerificationEmail } = useAuth();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  if (!user) {
    return (
      <div className="profile-container" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <h2>Not Authenticated</h2>
        <p>Please log in to view your profile and account settings.</p>
        <Link to="/login" className="auth-submit-btn" style={{ display: 'inline-block', width: 'auto', padding: '10px 24px', marginTop: '16px' }}>
          Log In Now →
        </Link>
      </div>
    );
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await updatePassword(newPassword);
      setSuccess('Your password has been updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (resendCooldown > 0) return;
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await resendVerificationEmail(user.email);
      setSuccess('Verification email sent! Please check your inbox.');
      setResendCooldown(60);
    } catch (err) {
      setError(err.message || 'Could not send verification email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-header-card">
        <div className="profile-avatar-large">
          <span>{user.avatar || '🎓'}</span>
        </div>
        <div className="profile-header-info">
          <div className="profile-name-row">
            <h2>{user.name}</h2>
            <span className={`verification-badge ${user.isVerified ? 'verified' : 'unverified'}`}>
              {user.isVerified ? '✓ Email Verified' : '⚠️ Email Unverified'}
            </span>
          </div>
          <p className="profile-email">{user.email}</p>
          <small className="profile-joined">Member since {user.joinedDate}</small>
        </div>
        <button className="profile-logout-btn" onClick={logout}>
          🚪 Sign Out
        </button>
      </div>

      {!user.isVerified && (
        <div className="unverified-banner">
          <div className="banner-content">
            <h4>Email Verification Required</h4>
            <p>Your email address has not been verified yet. Please check your inbox for the activation email.</p>
          </div>
          <button
            className="resend-btn"
            onClick={handleResendEmail}
            disabled={loading || resendCooldown > 0}
          >
            {resendCooldown > 0
              ? `Resend in ${resendCooldown}s`
              : loading
              ? 'Sending…'
              : 'Resend Verification Email'}
          </button>
        </div>
      )}

      {error && <div className="auth-error" role="alert">{error}</div>}
      {success && <div className="auth-success" role="status">{success}</div>}

      <div className="profile-grid">
        {/* Account Details */}
        <div className="profile-card">
          <h3>Account Information</h3>
          <div className="profile-detail-row">
            <strong>Full Name:</strong>
            <span>{user.name}</span>
          </div>
          <div className="profile-detail-row">
            <strong>Email Address:</strong>
            <span>{user.email}</span>
          </div>
          <div className="profile-detail-row">
            <strong>Account ID:</strong>
            <span style={{ fontSize: '11px', fontFamily: 'monospace' }}>{user.id}</span>
          </div>
          <div className="profile-detail-row">
            <strong>Verification Status:</strong>
            <span>{user.isVerified ? 'Verified' : 'Pending Email Confirmation'}</span>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="profile-card">
          <h3>Security & Password</h3>
          <form onSubmit={handlePasswordChange} className="auth-form" noValidate>
            <div className="auth-field">
              <label htmlFor="new-password">New Password</label>
              <div className="password-input-wrapper">
                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '👁️' : '🙈'}
                </button>
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="confirm-new-password">Confirm New Password</label>
              <input
                id="confirm-new-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? 'Updating Password…' : 'Update Password →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Profile;

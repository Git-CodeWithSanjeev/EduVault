import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PasswordInput, AuthAlert, GoogleIcon } from '../components/FormElements';

export function Profile() {
  const { user, logout, updatePassword, updateProfile, resendVerificationEmail } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || '🎓');
  const [grade, setGrade] = useState(user?.grade || 'Class 12 Student');
  const [bio, setBio] = useState(user?.bio || '');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const AVATAR_OPTIONS = ['🎓', '📚', '🚀', '💻', '🔬', '🎨', '🌟', '🦉', '⚛️', '🏆'];

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setAvatar(user.avatar || '🎓');
      setGrade(user.grade || 'Class 12 Student');
      setBio(user.bio || '');
    }
  }, [user]);

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

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim()) {
      setError('Name cannot be empty.');
      return;
    }

    setProfileLoading(true);
    try {
      if (typeof updateProfile === 'function') {
        await updateProfile({ name: name.trim(), avatar, bio, grade });
      }
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      if (typeof updatePassword === 'function') {
        await updatePassword(newPassword);
      }
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
      if (typeof resendVerificationEmail === 'function') {
        await resendVerificationEmail(user.email);
      }
      setSuccess('Verification email sent! Please check your inbox.');
      setResendCooldown(60);
    } catch (err) {
      setError(err.message || 'Could not send verification email.');
    } finally {
      setLoading(false);
    }
  };

  const isGoogleUser = user.isGoogle || user.provider === 'google';

  return (
    <div className="profile-container">
      <div className="profile-header-card">
        <div className="profile-avatar-large">
          {avatar && typeof avatar === 'string' && avatar.startsWith('http') ? (
            <img
              src={avatar}
              alt={user.name}
              className="profile-avatar-img"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span>{avatar || '🎓'}</span>
          )}
        </div>
        <div className="profile-header-info">
          <div className="profile-name-row">
            <h2>{user.name}</h2>
            <span className={`verification-badge ${user.isVerified ? 'verified' : 'unverified'}`}>
              {user.isVerified ? '✓ Verified Account' : '⚠️ Email Unverified'}
            </span>
          </div>
          <p className="profile-email">{user.email}</p>
          <small className="profile-joined">Member since {user.joinedDate || 'Recently'}</small>
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

      <AuthAlert type="error" message={error} />
      <AuthAlert type="success" message={success} />

      <div className="profile-grid">
        {/* Edit Profile Options */}
        <div className="profile-card">
          <h3>✏️ Edit Profile Settings</h3>
          <form onSubmit={handleProfileSave} className="auth-form" noValidate>
            <div className="auth-field">
              <label htmlFor="edit-name">Display Name</label>
              <input
                id="edit-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="auth-field">
              <label>Choose Avatar Icon</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                {AVATAR_OPTIONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setAvatar(icon)}
                    style={{
                      fontSize: '22px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: avatar === icon ? '2px solid #008080' : '1px solid #ddd',
                      background: avatar === icon ? '#e6f4f4' : '#fff',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="edit-grade">Education Level / Grade</label>
              <select
                id="edit-grade"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #ccc',
                  fontSize: '14px',
                }}
              >
                <option value="Class 9 Student">Class 9 Student</option>
                <option value="Class 10 Student">Class 10 Student</option>
                <option value="Class 11 Student">Class 11 Student</option>
                <option value="Class 12 Student">Class 12 Student</option>
                <option value="Undergraduate / College">Undergraduate / College</option>
                <option value="Postgraduate">Postgraduate</option>
                <option value="Educator / Teacher">Educator / Teacher</option>
                <option value="Lifelong Learner">Lifelong Learner</option>
              </select>
            </div>

            <div className="auth-field">
              <label htmlFor="edit-bio">Learning Goal / Bio</label>
              <textarea
                id="edit-bio"
                rows="3"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share your study goals or subjects of interest..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #ccc',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
            </div>

            <button type="submit" className="auth-submit-btn" disabled={profileLoading}>
              {profileLoading ? 'Saving Profile…' : '💾 Save Profile Changes'}
            </button>
          </form>
        </div>

        {/* Security & Password Card */}
        <div className="profile-card">
          <h3>🔐 Account Security</h3>
          {isGoogleUser ? (
            <div className="oauth-security-notice">
              <div className="oauth-notice-icon">
                <GoogleIcon size={28} />
              </div>
              <div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', color: 'var(--ink)' }}>
                  Managed via Google
                </h4>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)', lineHeight: '1.5' }}>
                  Your account is secured through Google Authentication. Your password and login credentials are protected by Google.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handlePasswordChange} className="auth-form" noValidate>
              <div className="auth-field">
                <label htmlFor="new-password">New Password</label>
                <PasswordInput
                  id="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                  required
                  toggleVariant="emoji"
                />
              </div>

              <div className="auth-field">
                <label htmlFor="confirm-new-password">Confirm New Password</label>
                <input
                  id="confirm-new-password"
                  type="password"
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
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;

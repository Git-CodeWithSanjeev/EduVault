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

  const AVATAR_OPTIONS = [
    // ── Ultra-Clean Minimal 3D Student Avatars ──
    { id: '3d-scholar-boy', type: 'img', url: 'https://api.dicebear.com/7.x/notionists-neutral/svg?seed=Aiden&backgroundColor=b6e3f4', label: 'Scholar Boy' },
    { id: '3d-scholar-girl', type: 'img', url: 'https://api.dicebear.com/7.x/notionists-neutral/svg?seed=Sophia&backgroundColor=ffd5dc', label: 'Scholar Girl' },
    { id: '3d-coder', type: 'img', url: 'https://api.dicebear.com/7.x/notionists-neutral/svg?seed=Alex&backgroundColor=c0aede', label: 'Developer' },
    { id: '3d-scientist', type: 'img', url: 'https://api.dicebear.com/7.x/notionists-neutral/svg?seed=Emma&backgroundColor=d1d4f9', label: 'Scientist' },
    { id: '3d-thinker', type: 'img', url: 'https://api.dicebear.com/7.x/notionists-neutral/svg?seed=Oliver&backgroundColor=ffdfbf', label: 'Thinker' },
    { id: '3d-creative', type: 'img', url: 'https://api.dicebear.com/7.x/notionists-neutral/svg?seed=Maya&backgroundColor=ffd5dc', label: 'Creative Designer' },
    { id: '3d-ai-bot', type: 'img', url: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=EduVaultBot&backgroundColor=b6e3f4', label: 'AI Tutor' },
    { id: '3d-cyber-bot', type: 'img', url: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Quantum&backgroundColor=c0aede', label: 'Cyber Bot' },
    { id: '3d-adventurer-1', type: 'img', url: 'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Lucas&backgroundColor=b6e3f4', label: 'Explorer' },
    { id: '3d-adventurer-2', type: 'img', url: 'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Chloe&backgroundColor=ffd5dc', label: 'Researcher' },
    { id: '3d-lorelei-1', type: 'img', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Leo&backgroundColor=ffdfbf', label: 'High Achiever' },
    { id: '3d-lorelei-2', type: 'img', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Zoe&backgroundColor=d1d4f9', label: 'Medic Scholar' },
    { id: '3d-lorelei-3', type: 'img', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Felix&backgroundColor=c0aede', label: 'Professor' },
    { id: '3d-lorelei-4', type: 'img', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Luna&backgroundColor=b6e3f4', label: 'Fast Learner' },
    { id: '3d-notion-math', type: 'img', url: 'https://api.dicebear.com/7.x/notionists-neutral/svg?seed=Max&backgroundColor=ffd5dc', label: 'Math Genius' },
    { id: '3d-notion-leader', type: 'img', url: 'https://api.dicebear.com/7.x/notionists-neutral/svg?seed=Elena&backgroundColor=b6e3f4', label: 'Young Leader' },

    // ── Classic Student Icons ──
    { id: 'em-grad', type: 'emoji', value: '🎓', label: 'Graduate' },
    { id: 'em-books', type: 'emoji', value: '📚', label: 'Books' },
    { id: 'em-rocket', type: 'emoji', value: '🚀', label: 'Rocket' },
    { id: 'em-laptop', type: 'emoji', value: '💻', label: 'Laptop' },
    { id: 'em-micro', type: 'emoji', value: '🔬', label: 'Science' },
    { id: 'em-art', type: 'emoji', value: '🎨', label: 'Art' },
    { id: 'em-star', type: 'emoji', value: '🌟', label: 'Star' },
    { id: 'em-owl', type: 'emoji', value: '🦉', label: 'Owl' },
    { id: 'em-atom', type: 'emoji', value: '⚛️', label: 'Physics' },
    { id: 'em-trophy', type: 'emoji', value: '🏆', label: 'Trophy' },
  ];

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

  return (
    <div className="profile-container" style={{ maxWidth: '780px', margin: '0 auto' }}>
      <div className="profile-header-card">
        <div className="profile-avatar-large">
          {avatar && typeof avatar === 'string' && avatar.startsWith('http') ? (
            <img
              src={avatar}
              alt={user.name}
              className="profile-avatar-img"
              style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
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

      <div className="profile-grid" style={{ gridTemplateColumns: '1fr' }}>
        {/* Edit Profile Options */}
        <div className="profile-card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>✏️</span> Edit Profile & 3D Avatars
          </h3>
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
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Choose 3D Avatar or Icon</span>
                <span style={{ fontSize: '11px', color: 'var(--p)', fontWeight: 700 }}>
                  Selected: {avatar.startsWith('http') ? '3D Avatar' : avatar}
                </span>
              </label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(56px, 1fr))',
                  gap: '12px',
                  marginTop: '10px',
                  padding: '16px',
                  background: 'var(--bg)',
                  borderRadius: '18px',
                  border: '1px solid var(--line)',
                }}
              >
                {AVATAR_OPTIONS.map((opt) => {
                  const isSelected = opt.type === 'img' ? avatar === opt.url : avatar === opt.value;
                  const targetVal = opt.type === 'img' ? opt.url : opt.value;

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setAvatar(targetVal)}
                      title={opt.label}
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        border: isSelected ? '2.5px solid var(--p)' : '1.5px solid var(--line)',
                        background: isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.85)',
                        boxShadow: isSelected
                          ? '0 0 0 3px rgba(13, 148, 136, 0.25), 0 4px 14px rgba(13, 148, 136, 0.2)'
                          : '0 2px 6px rgba(0, 0, 0, 0.04)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                        padding: '3px',
                        transform: isSelected ? 'scale(1.08)' : 'scale(1)',
                        boxSizing: 'border-box',
                      }}
                    >
                      {opt.type === 'img' ? (
                        <img
                          src={opt.url}
                          alt={opt.label}
                          style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            display: 'block',
                          }}
                        />
                      ) : (
                        <span style={{ fontSize: '24px' }}>{opt.value}</span>
                      )}
                    </button>
                  );
                })}
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
                  border: '1px solid var(--line)',
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
                  border: '1px solid var(--line)',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
            </div>

            <button type="submit" className="auth-submit-btn" disabled={profileLoading} style={{ marginTop: '10px' }}>
              {profileLoading ? 'Saving Profile…' : '💾 Save Profile Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Profile;

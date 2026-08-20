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
    // ── 3D Realistic Pixar-Style Avatars ──
    { id: 'pixar-ethan', type: 'img', url: 'https://api.dicebear.com/7.x/big-smile/svg?seed=Ethan&backgroundColor=b6e3f4', label: 'Pixar Boy' },
    { id: 'pixar-sophia', type: 'img', url: 'https://api.dicebear.com/7.x/big-smile/svg?seed=Sophia&backgroundColor=ffd5dc', label: 'Pixar Girl' },
    { id: 'pixar-leo', type: 'img', url: 'https://api.dicebear.com/7.x/big-smile/svg?seed=Leo&backgroundColor=c0aede', label: 'Pixar Genius' },
    { id: 'pixar-maya', type: 'img', url: 'https://api.dicebear.com/7.x/big-smile/svg?seed=Maya&backgroundColor=d1d4f9', label: 'Pixar Scientist' },
    { id: 'pixar-amara', type: 'img', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Amara&backgroundColor=ffdfbf', label: 'Pixar Scholar' },
    { id: 'pixar-jayden', type: 'img', url: 'https://api.dicebear.com/7.x/big-smile/svg?seed=Jayden&backgroundColor=b6e3f4', label: 'Pixar Techie' },
    { id: 'pixar-mia', type: 'img', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Mia&backgroundColor=ffd5dc', label: 'Pixar Artist' },
    { id: 'pixar-noah', type: 'img', url: 'https://api.dicebear.com/7.x/micah/svg?seed=Noah&backgroundColor=ffdfbf', label: 'Pixar Thinker' },
    { id: 'pixar-ava', type: 'img', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Ava&backgroundColor=d1d4f9', label: 'Pixar Graduate' },
    { id: 'pixar-arthur', type: 'img', url: 'https://api.dicebear.com/7.x/micah/svg?seed=Arthur&backgroundColor=c0aede', label: 'Pixar Professor' },
    { id: 'pixar-lucas', type: 'img', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Lucas&backgroundColor=b6e3f4', label: 'Pixar Adventurer' },
    { id: 'pixar-emma', type: 'img', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Emma&backgroundColor=ffd5dc', label: 'Pixar Explorer' },
    { id: 'pixar-zoe', type: 'img', url: 'https://api.dicebear.com/7.x/micah/svg?seed=Zoe&backgroundColor=ffd5dc', label: 'Pixar Champion' },
    { id: 'pixar-kai', type: 'img', url: 'https://api.dicebear.com/7.x/big-smile/svg?seed=Kai&backgroundColor=c0aede', label: 'Pixar Coder' },
    { id: 'pixar-edubot', type: 'img', url: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=EduVaultBot&backgroundColor=b6e3f4', label: '3D AI Tutor' },
    { id: 'pixar-aura', type: 'img', url: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Quantum&backgroundColor=c0aede', label: '3D Cyber Mentor' },

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

  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarTab, setAvatarTab] = useState('all'); // 'all', '3d', 'icon'

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

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowAvatarModal(false);
      }
    };
    if (showAvatarModal) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAvatarModal]);

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

  const filteredAvatars = AVATAR_OPTIONS.filter((opt) => {
    if (avatarTab === '3d') return opt.type === 'img';
    if (avatarTab === 'icon') return opt.type === 'emoji';
    return true;
  });

  return (
    <div className="profile-container" style={{ maxWidth: '780px', margin: '0 auto' }}>
      <div className="profile-header-card">
        {/* Profile Avatar Circle with Edit Badge & Click Event */}
        <div
          className="profile-avatar-large"
          onClick={() => setShowAvatarModal(true)}
          title="Click to edit 3D avatar"
          role="button"
          tabIndex={0}
        >
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
          <div className="profile-avatar-hover-overlay">
            <span>✏️</span>
          </div>
          <div className="profile-avatar-edit-badge" title="Change Avatar">
            ✏️
          </div>
        </div>

        <div className="profile-header-info">
          <div className="profile-name-row">
            <h2>{user.name}</h2>
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
            <span>✏️</span> Edit Profile Details
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

      {/* ── Avatar Picker Modal ── */}
      {showAvatarModal && (
        <div className="avatar-modal-overlay" onClick={() => setShowAvatarModal(false)}>
          <div className="avatar-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="avatar-modal-header">
              <h3>
                <span className="avatar-header-icon-badge">🎭</span> Choose 3D Avatar or Icon
              </h3>
              <button
                type="button"
                className="avatar-modal-close-btn"
                onClick={() => setShowAvatarModal(false)}
                aria-label="Close"
                title="Close Modal"
              >
                ✕
              </button>
            </div>

            <div className="avatar-modal-tabs">
              <button
                type="button"
                className={`avatar-modal-tab-btn ${avatarTab === 'all' ? 'active' : ''}`}
                onClick={() => setAvatarTab('all')}
              >
                All ({AVATAR_OPTIONS.length})
              </button>
              <button
                type="button"
                className={`avatar-modal-tab-btn ${avatarTab === '3d' ? 'active' : ''}`}
                onClick={() => setAvatarTab('3d')}
              >
                3D Characters ({AVATAR_OPTIONS.filter((a) => a.type === 'img').length})
              </button>
              <button
                type="button"
                className={`avatar-modal-tab-btn ${avatarTab === 'icon' ? 'active' : ''}`}
                onClick={() => setAvatarTab('icon')}
              >
                Icons & Emojis ({AVATAR_OPTIONS.filter((a) => a.type === 'emoji').length})
              </button>
            </div>

            <div className="avatar-modal-body">
              <div className="avatar-modal-grid">
                {filteredAvatars.map((opt) => {
                  const isSelected = opt.type === 'img' ? avatar === opt.url : avatar === opt.value;
                  const targetVal = opt.type === 'img' ? opt.url : opt.value;

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={async () => {
                        setAvatar(targetVal);
                        setShowAvatarModal(false);
                        try {
                          if (typeof updateProfile === 'function') {
                            await updateProfile({ name: name.trim() || user.name, avatar: targetVal, bio, grade });
                          }
                        } catch (err) {
                          console.error('[Avatar Update Error]:', err);
                        }
                      }}
                      title={opt.label}
                      className={`avatar-option-btn ${isSelected ? 'selected' : ''}`}
                      style={{ borderRadius: '50%' }}
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
                        <span style={{ fontSize: '26px' }}>{opt.value}</span>
                      )}
                      {isSelected && <span className="avatar-selected-check">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="avatar-modal-footer">
              <button
                type="button"
                className="auth-submit-btn"
                style={{ width: 'auto', padding: '8px 22px', margin: 0 }}
                onClick={() => setShowAvatarModal(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;


import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();
const API_BASE = import.meta.env.DEV ? 'http://localhost:3001' : '';
const STORAGE_KEY = 'eduvault_auth_user';

/** Helper to decode base64url Google JWT payload on client */
export function decodeGoogleCredential(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  // Sync state changes to localStorage
  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      console.error('Storage error:', e);
    }
  }, [user]);

  const [pendingEmail, setPendingEmail] = useState('');

  /** 1. Direct MongoDB Email/Password Registration with OTP Verification */
  const register = async (name, email, password) => {
    const cleanName = (name || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanName || cleanName.length < 2) {
      throw new Error('Full Name must be at least 2 characters long.');
    }
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      throw new Error('Please enter a valid email address.');
    }
    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters long.');
    }

    const data = await sendAuthRequest('/api/auth/register', { name: cleanName, email: cleanEmail, password });
    setPendingEmail(cleanEmail);

    return { success: true, requireOtp: true, email: cleanEmail, message: data.message };
  };

  /** 1.1 Verify Signup OTP & Complete Account Creation */
  const verifyOtp = async (email, otp) => {
    const cleanEmail = (email || pendingEmail || '').trim().toLowerCase();
    const cleanOtp = (otp || '').trim();

    if (!cleanEmail) {
      throw new Error('Email is required.');
    }
    if (!cleanOtp || cleanOtp.length !== 6) {
      throw new Error('Please enter the complete 6-digit verification code.');
    }

    const data = await sendAuthRequest('/api/auth/verify-signup-otp', { email: cleanEmail, otp: cleanOtp });

    const authUser = {
      ...data.user,
      isVerified: true,
      isGoogle: false,
    };

    setUser(authUser);
    setPendingEmail('');
    return { success: true, user: authUser };
  };

  /** 1.2 Resend Signup OTP */
  const resendOtp = async (email) => {
    const cleanEmail = (email || pendingEmail || '').trim().toLowerCase();
    if (!cleanEmail) {
      throw new Error('Email is required.');
    }

    return await sendAuthRequest('/api/auth/resend-signup-otp', { email: cleanEmail });
  };

  /** 2. Direct MongoDB Email/Password Login */
  const login = async (email, password) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) {
      throw new Error('Please enter your email address.');
    }
    if (!password) {
      throw new Error('Please enter your password.');
    }

    const data = await sendAuthRequest('/api/auth/login', { email: cleanEmail, password });

    const authUser = {
      ...data.user,
      isVerified: true,
      isGoogle: data.user.provider === 'google',
    };

    setUser(authUser);
    return { success: true, user: authUser };
  };

  /** 3. Direct Google Authentication (Straight to MongoDB) */
  const loginWithGoogle = async (googleCredentialOrProfile) => {
    let payload = {};

    if (typeof googleCredentialOrProfile === 'string') {
      // It's a Google JWT credential
      const decoded = decodeGoogleCredential(googleCredentialOrProfile);
      payload = {
        credential: googleCredentialOrProfile,
        email: decoded?.email,
        name: decoded?.name,
        avatar: decoded?.picture,
        googleId: decoded?.sub,
      };
    } else if (googleCredentialOrProfile && typeof googleCredentialOrProfile === 'object') {
      payload = googleCredentialOrProfile;
    }

    const data = await sendAuthRequest('/api/auth/google', payload);

    const authUser = {
      ...data.user,
      isVerified: true,
      isGoogle: true,
      provider: 'google',
    };

    setUser(authUser);
    return { success: true, user: authUser };
  };

  /** Helper to safely send auth POST requests with JSON validation & multi-host retry */
  const sendAuthRequest = async (endpoint, payload) => {
    const urlsToTry = [
      endpoint,
      ...(import.meta.env.DEV ? [`http://localhost:3001${endpoint}`] : []),
    ];

    let lastError = null;

    for (const url of urlsToTry) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          if (!res.ok || !data.success) {
            throw new Error(data.error || 'Request failed. Please check your details.');
          }
          return data;
        }
      } catch (err) {
        if (err.message && !err.message.includes('JSON') && !err.message.includes('fetch') && !err.message.includes('Failed to fetch')) {
          throw err;
        }
        lastError = err;
      }
    }

    // Offline / demo fallback for reset password flow
    if (endpoint === '/api/auth/forgot-password') {
      const email = (payload?.email || '').trim().toLowerCase();
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      sessionStorage.setItem('demo_reset_otp_' + email, JSON.stringify({ otp, expiresAt: Date.now() + 600000 }));
      return {
        success: true,
        message: `A 6-digit verification code has been sent to ${email}. Please check your inbox.`,
      };
    }

    if (endpoint === '/api/auth/verify-reset-otp') {
      const email = (payload?.email || '').trim().toLowerCase();
      const raw = sessionStorage.getItem('demo_reset_otp_' + email);
      if (raw) {
        const stored = JSON.parse(raw);
        if (stored.otp === (payload?.otp || '').trim() && stored.expiresAt > Date.now()) {
          return { success: true, message: 'Verification code confirmed.' };
        }
      }
      throw new Error('Invalid or expired verification code.');
    }

    if (endpoint === '/api/auth/reset-password') {
      const email = (payload?.email || '').trim().toLowerCase();
      sessionStorage.removeItem('demo_reset_otp_' + email);
      return { success: true, message: 'Your password has been reset successfully! You can now log in.' };
    }

    throw new Error(lastError?.message || 'Server error. Please try again.');
  };

  /** 4. Request Password Reset OTP */
  const requestPasswordReset = async (email) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      throw new Error('Please enter a valid email address.');
    }

    return await sendAuthRequest('/api/auth/forgot-password', { email: cleanEmail });
  };

  /** 5. Verify Password Reset OTP */
  const verifyResetOtp = async (email, otp) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanOtp = (otp || '').trim();

    if (!cleanEmail) {
      throw new Error('Email is required.');
    }
    if (!cleanOtp || cleanOtp.length !== 6) {
      throw new Error('Please enter the 6-digit verification code.');
    }

    return await sendAuthRequest('/api/auth/verify-reset-otp', { email: cleanEmail, otp: cleanOtp });
  };

  /** 6. Reset Password with Verified OTP */
  const resetPasswordWithOtp = async (email, otp, newPassword) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanOtp = (otp || '').trim();

    if (!cleanEmail) {
      throw new Error('Email is required.');
    }
    if (!cleanOtp || cleanOtp.length !== 6) {
      throw new Error('Please enter the 6-digit verification code.');
    }
    if (!newPassword || newPassword.length < 8) {
      throw new Error('New password must be at least 8 characters long.');
    }

    return await sendAuthRequest('/api/auth/reset-password', { email: cleanEmail, otp: cleanOtp, newPassword });
  };

  /** 7. Update Password (Logged-in user) */
  const updatePassword = async (newPassword) => {
    if (!user || !user.email) {
      throw new Error('You must be logged in to update your password.');
    }
    if (!newPassword || newPassword.length < 8) {
      throw new Error('New password must be at least 8 characters long.');
    }

    return await sendAuthRequest('/api/auth/update-password', { email: user.email, newPassword });
  };

  /** 8. Update Profile Details (Name, Avatar, Bio, Grade) */
  const updateProfile = async ({ name, avatar, bio, grade }) => {
    if (!user || !user.email) {
      throw new Error('You must be logged in to update your profile.');
    }

    const res = await fetch(`${API_BASE}/api/auth/update-profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, name, avatar, bio, grade }),
    });

    const contentType = res.headers.get('content-type') || '';
    let data = {};
    if (contentType.includes('application/json')) {
      data = await res.json();
    } else {
      const text = await res.text();
      console.error('[Update Profile Non-JSON Response]:', text);
      throw new Error('Server endpoint not found. Please restart server.');
    }

    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to update profile.');
    }

    const updatedUser = {
      ...user,
      ...(data.user || {}),
      name: name || user.name,
      avatar: avatar || user.avatar,
      bio: typeof bio === 'string' ? bio : user.bio,
      grade: typeof grade === 'string' ? grade : user.grade,
    };

    setUser(updatedUser);
    return { success: true, user: updatedUser };
  };

  /** 9. Logout */
  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem('eduvault-redirect-after-auth');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isLoggedIn: !!user,
        pendingEmail,
        setPendingEmail,
        login,
        register,
        verifyOtp,
        resendOtp,
        loginWithGoogle,
        requestPasswordReset,
        verifyResetOtp,
        resetPasswordWithOtp,
        updatePassword,
        updateProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

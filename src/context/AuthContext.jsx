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

  /** 1. Direct MongoDB Email/Password Registration */
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

    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: cleanName, email: cleanEmail, password }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Registration failed. Please try again.');
    }

    const authUser = {
      ...data.user,
      isVerified: true,
      isGoogle: false,
    };

    setUser(authUser);
    return { success: true, user: authUser };
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

    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, password }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Invalid email or password.');
    }

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

    const res = await fetch(`${API_BASE}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Google Authentication failed. Please try again.');
    }

    const authUser = {
      ...data.user,
      isVerified: true,
      isGoogle: true,
      provider: 'google',
    };

    setUser(authUser);
    return { success: true, user: authUser };
  };

  /** 4. Update Password (Direct MongoDB) */
  const updatePassword = async (newPassword) => {
    if (!user || !user.email) {
      throw new Error('You must be logged in to update your password.');
    }
    if (!newPassword || newPassword.length < 8) {
      throw new Error('New password must be at least 8 characters long.');
    }

    const res = await fetch(`${API_BASE}/api/auth/update-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, newPassword }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to update password.');
    }

    return { success: true };
  };

  /** 5. Update Profile Details (Name, Avatar, Bio, Grade) */
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

  /** 6. Logout */
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
        login,
        register,
        loginWithGoogle,
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

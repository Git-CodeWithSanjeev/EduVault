import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();
const API_BASE = import.meta.env.DEV ? 'http://localhost:3001' : '';

/** Format Supabase User into consistent app user format */
const formatUser = (supabaseUser) => {
  if (!supabaseUser) return null;
  const metadata = supabaseUser.user_metadata || {};
  const fullName =
    metadata.full_name ||
    metadata.name ||
    supabaseUser.email?.split('@')[0] ||
    'Learner';
  const joinedDate = supabaseUser.created_at
    ? new Date(supabaseUser.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : 'Recently';

  const isVerified = !!supabaseUser.email_confirmed_at;

  return {
    id: supabaseUser.id,
    email: supabaseUser.email?.toLowerCase() || '',
    name: fullName,
    avatar: metadata.avatar_url || '🎓',
    joinedDate,
    isVerified,
    raw: supabaseUser,
  };
};

/** Map raw auth errors to user-friendly messages */
const mapAuthError = (err) => {
  if (!err) return 'An unexpected error occurred.';
  const msg = typeof err === 'string' ? err : err.message || '';

  if (msg.includes('Invalid login credentials')) {
    return 'Invalid email or password. Please check your details.';
  }
  if (msg.includes('Email not confirmed')) {
    return 'Your email address has not been verified yet. Please enter the verification code.';
  }
  if (msg.includes('User already registered') || msg.includes('already exists')) {
    return 'An account with this email address already exists. Please sign in instead.';
  }
  if (msg.includes('Password should be at least')) {
    return 'Password must be at least 8 characters long.';
  }
  if (msg.includes('Token has expired') || msg.includes('expired')) {
    return 'This verification code has expired. Please request a new code.';
  }
  if (msg.includes('Invalid token') || msg.includes('otp')) {
    return 'Invalid verification code. Please try again.';
  }
  if (msg.includes('Error sending confirmation email') || msg.includes('confirmation email')) {
    return 'Unable to send confirmation email. Supabase email rate limit reached (max 3/hour on free tier). Please wait a few minutes, or set up Custom SMTP in Supabase.';
  }
  if (msg.includes('Rate limit') || msg.includes('magic link')) {
    return 'Email rate limit reached. Please wait a few minutes before trying again.';
  }
  return msg;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingEmail, setPendingEmail] = useState(() => {
    return sessionStorage.getItem('eduvault-pending-email') || '';
  });

  useEffect(() => {
    if (pendingEmail) {
      sessionStorage.setItem('eduvault-pending-email', pendingEmail);
    } else {
      sessionStorage.removeItem('eduvault-pending-email');
    }
  }, [pendingEmail]);

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user && session.user.email_confirmed_at) {
        setUser(formatUser(session.user));
      } else {
        setUser(null);
      }
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });

    // 2. Listen to real-time auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user && session.user.email_confirmed_at) {
        setUser(formatUser(session.user));
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  /** Register user and trigger Email OTP */
  const register = async (name, email, password) => {
    const cleanName = name?.trim();
    const cleanEmail = email?.trim().toLowerCase();

    if (!cleanName || cleanName.length < 2) {
      throw new Error('Full Name must be at least 2 characters long.');
    }
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      throw new Error('Please enter a valid email address.');
    }
    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters long.');
    }

    // Create Account in Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: { full_name: cleanName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      throw new Error(mapAuthError(error));
    }

    if (data.user && data.user.identities && data.user.identities.length === 0) {
      throw new Error('An account with this email already exists. Please sign in instead.');
    }

    // Sync to MongoDB Atlas
    fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: cleanName, email: cleanEmail, password }),
    }).catch(() => {});

    // If "Confirm email" is disabled in Supabase, data.session will be returned immediately
    if (data.session && data.user) {
      const formatted = formatUser(data.user);
      setUser(formatted);
      setSession(data.session);

      try {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          full_name: cleanName,
          email: cleanEmail,
          updated_at: new Date().toISOString(),
        });
      } catch {}

      return {
        success: true,
        autoConfirmed: true,
        user: formatted,
      };
    }

    setPendingEmail(cleanEmail);

    return {
      success: true,
      email: cleanEmail,
      userId: data.user?.id,
    };
  };

  /** Verify 6-digit OTP code & Create User Profile */
  const verifyOtp = async (email, token) => {
    const cleanEmail = (email || pendingEmail)?.trim().toLowerCase();
    const cleanToken = token?.trim();

    if (!cleanEmail) {
      throw new Error('Email address is required.');
    }
    if (!cleanToken || cleanToken.length !== 6) {
      throw new Error('Please enter the full 6-digit verification code.');
    }

    let result = await supabase.auth.verifyOtp({
      email: cleanEmail,
      token: cleanToken,
      type: 'signup',
    });

    if (result.error) {
      result = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanToken,
        type: 'email',
      });
    }

    if (result.error) {
      throw new Error(mapAuthError(result.error));
    }

    const authUser = result.data?.user;
    if (!authUser) {
      throw new Error('Verification failed. Could not retrieve user profile.');
    }

    const formatted = formatUser(authUser);

    // Create/Update Profile in Supabase 'profiles' table
    try {
      await supabase.from('profiles').upsert({
        id: authUser.id,
        full_name: formatted.name,
        email: cleanEmail,
        updated_at: new Date().toISOString(),
      });
    } catch {
      // Ignore if table RLS or schema is pending
    }

    setUser(formatted);
    setSession(result.data.session);
    setPendingEmail('');

    return {
      success: true,
      user: formatted,
    };
  };

  /** Resend Email OTP */
  const resendOtp = async (email) => {
    const targetEmail = (email || pendingEmail)?.trim().toLowerCase();
    if (!targetEmail) {
      throw new Error('Email address is required.');
    }

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: targetEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      throw new Error(mapAuthError(error));
    }

    return { success: true };
  };

  /** Login with Email & Password */
  const login = async (email, password) => {
    const cleanEmail = email?.trim().toLowerCase();
    if (!cleanEmail) {
      throw new Error('Please enter your email address.');
    }
    if (!password) {
      throw new Error('Please enter your password.');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      throw new Error(mapAuthError(error));
    }

    if (data.user && !data.user.email_confirmed_at) {
      setPendingEmail(cleanEmail);
      throw new Error('UNVERIFIED_EMAIL');
    }

    const formatted = formatUser(data.user);
    setUser(formatted);
    setSession(data.session);

    return {
      success: true,
      user: formatted,
    };
  };

  /** Real Logout Function */
  const logout = async () => {
    await supabase.auth.signOut().catch(() => {});
    setUser(null);
    setSession(null);
    setPendingEmail('');
    sessionStorage.removeItem('eduvault-pending-email');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isLoggedIn: !!user && !!user.isVerified,
        pendingEmail,
        setPendingEmail,
        register,
        verifyOtp,
        resendOtp,
        login,
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

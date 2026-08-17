import React, { useState } from 'react';

/**
 * Reusable Password Field with Show/Hide toggle button
 */
export function PasswordInput({
  id,
  value,
  onChange,
  placeholder = '••••••••',
  disabled = false,
  required = false,
  autoComplete,
  className = '',
  toggleVariant = 'text', // 'text' (Hide/Show) or 'emoji' (👁️/🙈)
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className={`password-input-wrapper ${className}`}>
      <input
        id={id}
        type={showPassword ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        autoComplete={autoComplete}
      />
      <button
        type="button"
        className="password-toggle-btn"
        onClick={() => setShowPassword(!showPassword)}
        aria-label="Toggle password visibility"
      >
        {toggleVariant === 'emoji'
          ? (showPassword ? '👁️' : '🙈')
          : (showPassword ? 'Hide' : 'Show')}
      </button>
    </div>
  );
}

/**
 * Reusable Auth Alert Banner for errors and success messages
 */
export function AuthAlert({ type = 'error', message }) {
  if (!message) return null;
  const isError = type === 'error';
  return (
    <div
      className={isError ? 'auth-error' : 'auth-success'}
      role={isError ? 'alert' : 'status'}
    >
      {message}
    </div>
  );
}

/**
 * High-definition Google multicolored SVG icon
 */
export function GoogleIcon({ className = '', size = 18 }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </svg>
  );
}

/**
 * Reusable Google OAuth Authentication Button
 */
export function GoogleAuthButton({
  onClick,
  loading = false,
  disabled = false,
  text = 'Continue with Google',
  className = '',
}) {
  return (
    <button
      type="button"
      className={`google-auth-btn ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={text}
    >
      {loading ? (
        <span className="google-btn-spinner" />
      ) : (
        <GoogleIcon className="google-icon" size={18} />
      )}
      <span>{loading ? 'Connecting to Google…' : text}</span>
    </button>
  );
}

/**
 * Reusable Auth Divider for separating Social Auth from Email Form
 */
export function AuthDivider({ text = 'or continue with email' }) {
  return (
    <div className="auth-divider">
      <span>{text}</span>
    </div>
  );
}

/**
 * Reusable Toast Popup Notification
 */
export function ToastNotification({ message }) {
  if (!message) return null;
  return <div className="toast-notification">{message}</div>;
}

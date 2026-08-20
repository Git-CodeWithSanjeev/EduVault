import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PasswordInput, AuthAlert } from '../components/FormElements';
import { OtpInput } from '../components/OtpInput';
import { isValidEmail } from '../utils/validation';

export function ResetPassword() {
  const { requestPasswordReset, verifyResetOtp, resetPasswordWithOtp, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  // Multi-step state: 'email' | 'otp' | 'password' | 'success'
  const [step, setStep] = useState('email');

  // Form fields
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI state
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (isLoggedIn) {
      navigate('/', { replace: true });
    }
  }, [isLoggedIn, navigate]);

  // Resend cooldown timer
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // STEP 1: Request Password Reset OTP
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const cleanEmail = email.trim();
    if (!isValidEmail(cleanEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const res = await requestPasswordReset(cleanEmail);
      setSuccess(res.message || `A 6-digit verification code has been sent to your email (${cleanEmail})`);
      setResendCooldown(60);
      setStep('otp');
    } catch (err) {
      setError(err.message || 'Failed to send recovery code. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Verify OTP
  // STEP 2: Verify OTP
  const handleOtpSubmit = async (customOtpOrEvent) => {
    if (customOtpOrEvent && typeof customOtpOrEvent === 'object' && customOtpOrEvent.preventDefault) {
      customOtpOrEvent.preventDefault();
    }
    setError('');
    setSuccess('');

    const tokenToVerify = (typeof customOtpOrEvent === 'string' ? customOtpOrEvent : otp).trim();

    if (!tokenToVerify || tokenToVerify.length !== 6) {
      setError('Please enter the complete 6-digit verification code');
      return;
    }

    setLoading(true);
    try {
      await verifyResetOtp(email.trim(), tokenToVerify);
      setSuccess('Code verified! Please create your new password.');
      setStep('password');
    } catch (err) {
      setError(err.message || 'Invalid or expired verification code');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || !email) return;
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await requestPasswordReset(email.trim());
      setSuccess(res.message || `A new 6-digit recovery code has been sent to your email (${email})`);
      setResendCooldown(60);
    } catch (err) {
      setError(err.message || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  // STEP 3: Reset Password with OTP
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await resetPasswordWithOtp(email.trim(), otp, password);
      setStep('success');
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2500);
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-page-card">
        {/* Step Indicator Header */}
        <div className="auth-recovery-stepper" aria-label="Password recovery steps">
          <div className={`recovery-step-pill ${step === 'email' ? 'active' : step !== 'email' ? 'completed' : ''}`}>
            <span className="step-num">1</span>
            <span className="step-text">Email</span>
          </div>
          <div className="recovery-step-divider" />
          <div className={`recovery-step-pill ${step === 'otp' ? 'active' : ['password', 'success'].includes(step) ? 'completed' : ''}`}>
            <span className="step-num">2</span>
            <span className="step-text">Verify</span>
          </div>
          <div className="recovery-step-divider" />
          <div className={`recovery-step-pill ${['password', 'success'].includes(step) ? 'active' : ''}`}>
            <span className="step-num">3</span>
            <span className="step-text">Reset</span>
          </div>
        </div>

        {/* STEP 1: Enter Email */}
        {step === 'email' && (
          <>
            <div className="auth-header">
              <h2>Forgot Password?</h2>
              <p>Enter your registered account email and we'll send you a 6-digit recovery code.</p>
            </div>

            <AuthAlert type="error" message={error} />
            <AuthAlert type="success" message={success} />

            <form onSubmit={handleEmailSubmit} className="auth-form" noValidate>
              <div className="auth-field">
                <label htmlFor="reset-email">Email Address</label>
                <input
                  id="reset-email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  disabled={loading}
                  required
                  autoFocus
                  autoComplete="email"
                />
              </div>

              <button type="submit" className="auth-submit-btn" disabled={loading || !email.trim()}>
                {loading ? 'Sending Code…' : 'Send Recovery Code →'}
              </button>
            </form>

            <div className="auth-page-footer">
              <Link to="/login">← Return to Sign In</Link>
            </div>
          </>
        )}

        {/* STEP 2: Enter Verification Code */}
        {step === 'otp' && (
          <>
            <div className="auth-header" style={{ textAlign: 'center' }}>
              <h2>Verify Recovery Code</h2>
              <p>
                We sent a 6-digit code to{' '}
                <strong style={{ color: 'var(--ink)' }}>{email}</strong>
                <button
                  type="button"
                  className="auth-link-btn"
                  style={{ display: 'inline', marginLeft: '8px', padding: '0 4px', fontSize: '13px' }}
                  onClick={() => {
                    setError('');
                    setSuccess('');
                    setStep('email');
                  }}
                >
                  (Change)
                </button>
              </p>
            </div>

            <AuthAlert type="error" message={error} />
            <AuthAlert type="success" message={success} />

            <form onSubmit={(e) => { e.preventDefault(); handleOtpSubmit(otp); }} className="auth-form" noValidate>
              <div className="auth-field" style={{ alignItems: 'center' }}>
                <OtpInput
                  value={otp}
                  onChange={(val) => {
                    setOtp(val);
                    if (error) setError('');
                    if (val && val.length === 6) {
                      handleOtpSubmit(val);
                    }
                  }}
                  disabled={loading}
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="auth-submit-btn"
                disabled={loading || otp.length !== 6}
              >
                {loading ? 'Verifying…' : 'Verify Code →'}
              </button>
            </form>

            <div className="otp-resend-box" style={{ marginTop: '20px', textAlign: 'center' }}>
              <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '0 0 6px 0' }}>
                Didn't receive the code?
              </p>
              <button
                type="button"
                className="auth-link-btn"
                onClick={handleResendOtp}
                disabled={loading || resendCooldown > 0}
              >
                {resendCooldown > 0
                  ? `Resend Code in ${resendCooldown}s`
                  : loading
                  ? 'Sending Code…'
                  : 'Resend Code'}
              </button>
            </div>

            <div className="auth-page-footer" style={{ marginTop: '16px' }}>
              <Link to="/login">← Return to Sign In</Link>
            </div>
          </>
        )}

        {/* STEP 3: Enter New Password */}
        {step === 'password' && (
          <>
            <div className="auth-header">
              <h2>Set New Password</h2>
              <p>Create a new strong password (at least 8 characters) for <strong>{email}</strong>.</p>
            </div>

            <AuthAlert type="error" message={error} />
            <AuthAlert type="success" message={success} />

            <form onSubmit={handlePasswordSubmit} className="auth-form" noValidate>
              <div className="auth-field">
                <label htmlFor="reset-new-password">New Password</label>
                <PasswordInput
                  id="reset-new-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  disabled={loading}
                  required
                  autoFocus
                  toggleVariant="emoji"
                />
              </div>

              <div className="auth-field">
                <label htmlFor="reset-confirm-password">Confirm New Password</label>
                <input
                  id="reset-confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (error) setError('');
                  }}
                  disabled={loading}
                  required
                />
              </div>

              {/* Password Requirement Checklist */}
              <div className="password-checklist" style={{ fontSize: '12px', margin: '4px 0 12px 0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ color: password.length >= 8 ? '#10b981' : 'var(--muted)' }}>
                  {password.length >= 8 ? '✓' : '○'} At least 8 characters
                </span>
                <span style={{ color: password && confirmPassword && password === confirmPassword ? '#10b981' : 'var(--muted)' }}>
                  {password && confirmPassword && password === confirmPassword ? '✓' : '○'} Passwords match
                </span>
              </div>

              <button
                type="submit"
                className="auth-submit-btn"
                disabled={loading || password.length < 8 || password !== confirmPassword}
              >
                {loading ? 'Updating Password…' : 'Save New Password & Sign In →'}
              </button>
            </form>

            <div className="auth-page-footer">
              <Link to="/login">← Return to Sign In</Link>
            </div>
          </>
        )}

        {/* STEP 4: Success Message */}
        {step === 'success' && (
          <div className="auth-success-view" style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', animation: 'bounce 0.5s' }}>
              ✅
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '8px', color: 'var(--ink)' }}>
              Password Reset Complete!
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '24px' }}>
              Your password has been updated successfully. Redirecting you to sign in...
            </p>
            <button
              type="button"
              className="auth-submit-btn"
              onClick={() => navigate('/login', { replace: true })}
            >
              Sign In Now →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ResetPassword;

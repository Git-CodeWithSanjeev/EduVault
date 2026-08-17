import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { OtpInput } from '../components/OtpInput';
import { AuthAlert } from '../components/FormElements';

export function VerifyEmailPage() {
  const { verifyOtp, resendOtp, pendingEmail, setPendingEmail, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email || pendingEmail || '';

  const [otpToken, setOtpToken] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);

  useEffect(() => {
    if (isLoggedIn) {
      navigate('/', { replace: true });
    }
  }, [isLoggedIn, navigate]);

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleVerify = async (e) => {
    e?.preventDefault();
    if (!otpToken || otpToken.length !== 6) {
      setError('Please enter the full 6-digit verification code');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await verifyOtp(email, otpToken);
      setSuccess('Verification successful! Redirecting to Home…');
      setTimeout(() => navigate('/', { replace: true }), 800);
    } catch (err) {
      setError(err.message || 'Invalid verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || !email) return;
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await resendOtp(email);
      setSuccess(`A new 6-digit code has been sent to ${email}.`);
      setResendCooldown(60);
    } catch (err) {
      setError(err.message || 'Could not resend verification code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-page-card">
        <div className="auth-header" style={{ textAlign: 'center' }}>
          <h2>Verify your email</h2>
          <p>
            We sent a 6-digit verification code to
            <br />
            <strong>{email || 'your email'}</strong>
          </p>
        </div>

        <AuthAlert type="error" message={error} />
        <AuthAlert type="success" message={success} />

        <form onSubmit={handleVerify} className="auth-form" noValidate>
          <div className="auth-field" style={{ alignItems: 'center' }}>
            <OtpInput
              value={otpToken}
              onChange={(val) => {
                setOtpToken(val);
                if (error) setError('');
              }}
              disabled={loading}
              autoFocus
            />
          </div>

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading || otpToken.length !== 6}
          >
            {loading ? 'Verifying Code…' : 'Verify & Continue →'}
          </button>
        </form>

        <div className="otp-resend-box" style={{ marginTop: '24px', textAlign: 'center' }}>
          <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '0 0 8px 0' }}>
            Didn't receive the code?
          </p>
          <button
            type="button"
            className="auth-link-btn"
            onClick={handleResend}
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
          <Link to="/register" onClick={() => setPendingEmail('')}>
            ← Change email or sign up again
          </Link>
        </div>
      </div>
    </div>
  );
}

export default VerifyEmailPage;

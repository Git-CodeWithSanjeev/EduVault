import { connectToDatabase, User, ResetOtp } from '../_db.js';
import bcrypt from 'bcryptjs';
import {
  sanitizeEmail,
  sanitizeInput,
  timingSafeMatch,
  checkRateLimit,
  sanitizeNoSql,
  validatePasswordStrength,
  clearFailedLogins,
} from '../../services/security.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const rawBody = sanitizeNoSql(req.body || {});
    const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
    const rateCheck = await checkRateLimit(`reset_pw:${clientIp}`, 10, 60);
    res.setHeader('X-RateLimit-Remaining', rateCheck.remaining);
    if (!rateCheck.allowed) {
      return res.status(429).json({ error: `Too many password reset attempts. Please wait ${rateCheck.resetIn} seconds.` });
    }

    const { email: rawEmail, otp: rawOtp, newPassword: rawPassword } = rawBody;
    const email = sanitizeEmail(rawEmail);
    const otp = sanitizeInput(rawOtp, 10);
    const newPassword = sanitizeInput(rawPassword, 128);

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, verification code, and new password are required' });
    }

    // Password Complexity Validation
    const pwValidation = validatePasswordStrength(newPassword);
    if (!pwValidation.valid) {
      return res.status(400).json({ error: pwValidation.error });
    }

    await connectToDatabase();

    const stored = await ResetOtp.findOne({ email });

    if (!stored) {
      return res.status(400).json({ error: 'Verification session expired. Please request a new code.' });
    }

    if (!timingSafeMatch(String(stored.otp).trim(), otp)) {
      return res.status(400).json({ error: 'Invalid verification code.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    if (user.provider === 'google' && !user.password) {
      user.provider = 'both';
    }
    await user.save();

    // Invalidate OTP & Reset any account lockouts
    await ResetOtp.deleteOne({ email });
    clearFailedLogins(email);

    return res.status(200).json({
      success: true,
      message: 'Your password has been reset successfully! You can now log in with your new password.',
    });
  } catch (err) {
    console.error('[Vercel Auth Reset Password Error]:', err);
    return res.status(500).json({ error: 'Failed to reset password' });
  }
}

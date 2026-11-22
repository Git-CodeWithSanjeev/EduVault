import { connectToDatabase, ResetOtp } from '../_db.js';
import { sanitizeEmail, sanitizeInput, timingSafeMatch, checkRateLimit } from '../../services/security.js';

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
    const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
    const rateCheck = await checkRateLimit(`verify_reset:${clientIp}`, 15, 60);
    res.setHeader('X-RateLimit-Remaining', rateCheck.remaining);
    if (!rateCheck.allowed) {
      return res.status(429).json({ error: `Too many verification attempts. Please wait ${rateCheck.resetIn} seconds.` });
    }

    const { email: rawEmail, otp: rawOtp } = req.body || {};
    const email = sanitizeEmail(rawEmail);
    const otp = sanitizeInput(rawOtp, 10);

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and verification code are required' });
    }

    await connectToDatabase();

    const stored = await ResetOtp.findOne({ email });

    if (!stored) {
      return res.status(400).json({ error: 'Verification code has expired or was not requested. Please request a new code.' });
    }

    if (!timingSafeMatch(String(stored.otp).trim(), otp)) {
      return res.status(400).json({ error: 'Invalid verification code. Please check and try again.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Verification code confirmed successfully.',
    });
  } catch (err) {
    console.error('[Vercel Auth Verify Reset OTP Error]:', err);
    return res.status(500).json({ error: 'Failed to verify reset code' });
  }
}

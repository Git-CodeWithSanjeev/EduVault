import { connectToDatabase, PendingSignup } from '../_db.js';
import { sendSignupOtpEmail } from '../../services/email.js';
import {
  sanitizeEmail,
  checkRateLimit,
  generateSecureOtp,
  sanitizeNoSql,
  checkEmailCooldown,
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
    const rateCheck = await checkRateLimit(`resend_signup:${clientIp}`, 4, 60);
    res.setHeader('X-RateLimit-Remaining', rateCheck.remaining);
    if (!rateCheck.allowed) {
      return res.status(429).json({ error: `Too many resend requests. Please wait ${rateCheck.resetIn} seconds.` });
    }

    const { email: rawEmail } = rawBody;
    const email = sanitizeEmail(rawEmail);

    if (!email) {
      return res.status(400).json({ error: 'A valid email address is required' });
    }

    // Email Anti-Bombing Cooldown
    const emailCooldown = checkEmailCooldown(email);
    if (!emailCooldown.allowed) {
      return res.status(429).json({ error: emailCooldown.error });
    }

    await connectToDatabase();

    const pending = await PendingSignup.findOne({ email });

    if (!pending) {
      return res.status(400).json({ error: 'No pending registration found. Please sign up again.' });
    }

    const newOtp = generateSecureOtp();
    pending.otp = newOtp;
    pending.createdAt = new Date();
    await pending.save();

    const emailResult = await sendSignupOtpEmail(email, newOtp, pending.name);
    if (!emailResult.sent && emailResult.reason === 'NO_SMTP_CONFIG') {
      return res.status(500).json({
        error: 'Email service is not configured on the server. Please check SMTP credentials in Vercel Environment Variables.',
      });
    }

    return res.status(200).json({
      success: true,
      message: `A new 6-digit confirmation code has been sent to ${email}.`,
    });
  } catch (err) {
    console.error('[Vercel Auth Resend Signup OTP Error]:', err);
    return res.status(500).json({ error: 'Failed to resend verification code' });
  }
}

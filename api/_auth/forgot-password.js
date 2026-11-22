import { connectToDatabase, User, ResetOtp } from '../_db.js';
import { sendPasswordResetEmail } from '../../services/email.js';
import {
  sanitizeEmail,
  checkRateLimit,
  generateSecureOtp,
  checkHoneypot,
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

    // Honeypot Bot Trap
    if (checkHoneypot(rawBody)) {
      return res.status(200).json({
        success: true,
        message: 'A verification code has been dispatched.',
      });
    }

    const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
    const rateCheck = await checkRateLimit(`forgot_pw:${clientIp}`, 5, 60);
    res.setHeader('X-RateLimit-Remaining', rateCheck.remaining);
    if (!rateCheck.allowed) {
      return res.status(429).json({ error: `Too many password reset attempts. Please wait ${rateCheck.resetIn} seconds.` });
    }

    const { email: rawEmail } = rawBody;
    const email = sanitizeEmail(rawEmail);

    if (!email) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    // Per-Email Anti-Bombing Cooldown (60s cooldown, max 5/hr)
    const emailCooldown = checkEmailCooldown(email);
    if (!emailCooldown.allowed) {
      return res.status(429).json({ error: emailCooldown.error });
    }

    await connectToDatabase();

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'No account found with this email address. Please check and try again.' });
    }
    if (!user.password && user.provider === 'google') {
      return res.status(400).json({ error: 'This account was created with Google Sign-In. Please sign in with Google.' });
    }

    const otp = generateSecureOtp();

    // Persist OTP in MongoDB with 10-minute expiry
    await ResetOtp.findOneAndUpdate(
      { email },
      { email, otp, createdAt: new Date() },
      { upsert: true, new: true }
    );

    // Await email delivery
    const emailResult = await sendPasswordResetEmail(email, otp);
    if (!emailResult.sent && emailResult.reason === 'NO_SMTP_CONFIG') {
      return res.status(500).json({
        error: 'Email service is not configured on the server. Please check SMTP credentials in Vercel Environment Variables.',
      });
    }

    return res.status(200).json({
      success: true,
      message: `A 6-digit verification code has been sent to ${email}. Please check your inbox.`,
    });
  } catch (err) {
    console.error('[Vercel Auth Forgot Password Error]:', err);
    return res.status(500).json({ error: 'Failed to request password reset. Please try again later.' });
  }
}

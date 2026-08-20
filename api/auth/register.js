import { connectToDatabase, User, PendingSignup } from '../_db.js';
import bcrypt from 'bcryptjs';
import { sendSignupOtpEmail } from '../../services/email.js';
import {
  sanitizeEmail,
  sanitizeInput,
  checkRateLimit,
  generateSecureOtp,
  checkHoneypot,
  sanitizeNoSql,
  validatePasswordStrength,
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

    // Honeypot Bot Trap: silently reject automated bots
    if (checkHoneypot(rawBody)) {
      return res.status(200).json({
        success: true,
        requireOtp: true,
        message: 'A verification code has been dispatched.',
      });
    }

    const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
    const rateCheck = await checkRateLimit(`register:${clientIp}`, 8, 60);
    res.setHeader('X-RateLimit-Remaining', rateCheck.remaining);
    if (!rateCheck.allowed) {
      return res.status(429).json({ error: `Too many registration attempts. Please wait ${rateCheck.resetIn} seconds.` });
    }

    const { name: rawName, email: rawEmail, password: rawPassword } = rawBody;
    const name = sanitizeInput(rawName, 60);
    const email = sanitizeEmail(rawEmail);
    const password = sanitizeInput(rawPassword, 128);

    if (!email) {
      return res.status(400).json({ error: 'A valid email address is required' });
    }
    if (!name || name.length < 2) {
      return res.status(400).json({ error: 'Full Name must be at least 2 characters' });
    }

    // Password Complexity & Common Password Check
    const pwValidation = validatePasswordStrength(password);
    if (!pwValidation.valid) {
      return res.status(400).json({ error: pwValidation.error });
    }

    // Email Anti-Bombing Cooldown (60s cooldown & 5 max/hour)
    const emailCooldown = checkEmailCooldown(email);
    if (!emailCooldown.allowed) {
      return res.status(429).json({ error: emailCooldown.error });
    }

    await connectToDatabase();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email address already exists. Please sign in.' });
    }

    // Cryptographically secure OTP
    const otp = generateSecureOtp();
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save pending registration in MongoDB with 10-minute expiry
    await PendingSignup.findOneAndUpdate(
      { email },
      {
        name,
        email,
        password: hashedPassword,
        otp,
        createdAt: new Date(),
      },
      { upsert: true, new: true }
    );

    // Await email delivery
    const emailResult = await sendSignupOtpEmail(email, otp, name);
    if (!emailResult.sent && emailResult.reason === 'NO_SMTP_CONFIG') {
      return res.status(500).json({
        error: 'Email service is not configured on the server. Please check SMTP credentials in Vercel Environment Variables.',
      });
    }

    return res.status(200).json({
      success: true,
      requireOtp: true,
      email,
      message: `A 6-digit confirmation code has been sent to ${email}. Please check your inbox.`,
    });
  } catch (err) {
    console.error('[Vercel Auth Register Error]:', err);
    return res.status(500).json({ error: 'Registration failed. Please try again later.' });
  }
}

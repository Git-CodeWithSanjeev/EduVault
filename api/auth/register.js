import { connectToDatabase, User } from '../_db.js';
import bcrypt from 'bcryptjs';
import { sendSignupOtpEmail } from '../../services/email.js';

const globalPendingSignups = global.pendingSignupsMap || (global.pendingSignupsMap = new Map());

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanName = (name || '').trim();
    const cleanEmail = email.toLowerCase().trim();

    if (cleanName.length < 2) {
      return res.status(400).json({ error: 'Full Name must be at least 2 characters' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    try {
      await connectToDatabase();
      const existingUser = await User.findOne({ email: cleanEmail });
      if (existingUser) {
        return res.status(400).json({ error: 'An account with this email address already exists. Please sign in.' });
      }
    } catch (dbErr) {
      console.warn('[Register DB Check Warning]:', dbErr.message);
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedPassword = await bcrypt.hash(password, 10);

    globalPendingSignups.set(cleanEmail, {
      name: cleanName,
      email: cleanEmail,
      hashedPassword,
      otp,
      expiresAt: Date.now() + 600000,
    });

    // Send Real Verification OTP Email in background
    sendSignupOtpEmail(cleanEmail, otp, cleanName).catch((mailErr) => {
      console.warn('[Vercel Signup Email Error]:', mailErr.message);
    });

    return res.status(200).json({
      success: true,
      requireOtp: true,
      email: cleanEmail,
      message: `A 6-digit confirmation code has been sent to ${cleanEmail}. Please check your inbox.`,
    });
  } catch (err) {
    console.error('[Vercel Auth Register Error]:', err);
    return res.status(500).json({ error: err.message || 'Registration failed' });
  }
}

import { connectToDatabase, User, PendingSignup } from '../_db.js';
import bcrypt from 'bcryptjs';
import { sendSignupOtpEmail } from '../../services/email.js';

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

    await connectToDatabase();

    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email address already exists. Please sign in.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save pending registration in MongoDB with 10-minute expiry
    await PendingSignup.findOneAndUpdate(
      { email: cleanEmail },
      {
        name: cleanName || cleanEmail.split('@')[0],
        email: cleanEmail,
        password: hashedPassword,
        otp,
        createdAt: new Date(),
      },
      { upsert: true, new: true }
    );

    // Await email delivery so serverless does not terminate prematurely
    const emailResult = await sendSignupOtpEmail(cleanEmail, otp, cleanName);
    if (!emailResult.sent && emailResult.reason === 'NO_SMTP_CONFIG') {
      return res.status(500).json({
        error: 'Email service is not configured on the server. Please add SMTP_USER and SMTP_PASS to Vercel Environment Variables.',
      });
    }

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

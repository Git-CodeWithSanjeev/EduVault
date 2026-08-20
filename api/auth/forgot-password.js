import { connectToDatabase, User } from '../_db.js';
import { sendPasswordResetEmail } from '../../services/email.js';

// Serverless memory store for OTPs (with TTL)
const globalOtpMap = global.resetOtpMap || (global.resetOtpMap = new Map());

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
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ error: 'Please enter your email address' });
    }

    const cleanEmail = email.toLowerCase().trim();

    try {
      await connectToDatabase();
      const user = await User.findOne({ email: cleanEmail });
      if (!user) {
        return res.status(404).json({ error: 'No account found with this email address. Please check and try again.' });
      }
      if (!user.password && user.provider === 'google') {
        return res.status(400).json({ error: 'This account uses Google Sign-In. Please sign in with Google.' });
      }
    } catch (dbErr) {
      console.warn('[Forgot Password DB Warning]:', dbErr.message);
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    globalOtpMap.set(cleanEmail, { otp, expiresAt: Date.now() + 600000 });

    // Send Real OTP Email in background
    sendPasswordResetEmail(cleanEmail, otp).catch((mailErr) => {
      console.warn('[Vercel Reset Email Error]:', mailErr.message);
    });

    return res.status(200).json({
      success: true,
      message: `A 6-digit verification code has been sent to ${cleanEmail}. Please check your inbox.`,
    });
  } catch (err) {
    console.error('[Vercel Auth Forgot Password Error]:', err);
    return res.status(500).json({ error: err.message || 'Failed to request password reset' });
  }
}

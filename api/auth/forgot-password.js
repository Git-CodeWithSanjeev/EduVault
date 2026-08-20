import { connectToDatabase, User, ResetOtp } from '../_db.js';
import { sendPasswordResetEmail } from '../../services/email.js';

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

    await connectToDatabase();

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(404).json({ error: 'No account found with this email address. Please check and try again.' });
    }
    if (!user.password && user.provider === 'google') {
      return res.status(400).json({ error: 'This account was created with Google Sign-In. Please sign in with Google.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Persist OTP in MongoDB with 10-minute expiry
    await ResetOtp.findOneAndUpdate(
      { email: cleanEmail },
      { email: cleanEmail, otp, createdAt: new Date() },
      { upsert: true, new: true }
    );

    // Explicitly await email dispatch so Vercel does not terminate early
    const emailResult = await sendPasswordResetEmail(cleanEmail, otp);
    if (!emailResult.sent && emailResult.reason === 'NO_SMTP_CONFIG') {
      return res.status(500).json({
        error: 'Email service is not configured on the server. Please add SMTP_USER and SMTP_PASS to Vercel Environment Variables.',
      });
    }

    return res.status(200).json({
      success: true,
      message: `A 6-digit verification code has been sent to ${cleanEmail}. Please check your inbox.`,
    });
  } catch (err) {
    console.error('[Vercel Auth Forgot Password Error]:', err);
    return res.status(500).json({ error: err.message || 'Failed to request password reset' });
  }
}

import { connectToDatabase, PendingSignup } from '../_db.js';
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
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const cleanEmail = email.toLowerCase().trim();

    await connectToDatabase();

    const pending = await PendingSignup.findOne({ email: cleanEmail });

    if (!pending) {
      return res.status(400).json({ error: 'No pending registration found. Please sign up again.' });
    }

    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    pending.otp = newOtp;
    pending.createdAt = new Date();
    await pending.save();

    const emailResult = await sendSignupOtpEmail(cleanEmail, newOtp, pending.name);
    if (!emailResult.sent && emailResult.reason === 'NO_SMTP_CONFIG') {
      return res.status(500).json({
        error: 'Email service is not configured on the server. Please add SMTP_USER and SMTP_PASS to Vercel Environment Variables.',
      });
    }

    return res.status(200).json({
      success: true,
      message: `A new 6-digit confirmation code has been sent to ${cleanEmail}.`,
    });
  } catch (err) {
    console.error('[Vercel Auth Resend Signup OTP Error]:', err);
    return res.status(500).json({ error: err.message || 'Failed to resend code' });
  }
}

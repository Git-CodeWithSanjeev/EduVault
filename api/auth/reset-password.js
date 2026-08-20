import { connectToDatabase, User } from '../_db.js';
import bcrypt from 'bcryptjs';

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
    const { email, otp, newPassword } = req.body || {};
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, verification code, and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const stored = globalOtpMap.get(cleanEmail);

    if (!stored || stored.expiresAt < Date.now()) {
      return res.status(400).json({ error: 'Verification session expired. Please request a new code.' });
    }

    if (String(stored.otp).trim() !== String(otp).trim()) {
      return res.status(400).json({ error: 'Invalid verification code.' });
    }

    await connectToDatabase();

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    // Invalidate OTP
    globalOtpMap.delete(cleanEmail);

    console.log(`✅ [MongoDB Vercel] Password reset completed for: ${cleanEmail}`);

    return res.status(200).json({
      success: true,
      message: 'Your password has been reset successfully! You can now log in with your new password.',
    });
  } catch (err) {
    console.error('[Vercel Auth Reset Password Error]:', err);
    return res.status(500).json({ error: err.message || 'Failed to reset password' });
  }
}

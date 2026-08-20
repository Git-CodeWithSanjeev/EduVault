import { connectToDatabase, User } from '../_db.js';
import bcrypt from 'bcryptjs';
import {
  sanitizeEmail,
  sanitizeInput,
  sanitizeNoSql,
  getBearerToken,
  verifyAuthToken,
  validatePasswordStrength,
  checkRateLimit,
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
    const rateCheck = await checkRateLimit(`update_pw:${clientIp}`, 6, 60);
    res.setHeader('X-RateLimit-Remaining', rateCheck.remaining);
    if (!rateCheck.allowed) {
      return res.status(429).json({ error: `Too many password update requests. Please wait ${rateCheck.resetIn} seconds.` });
    }

    const { email: rawEmail, newPassword: rawPassword } = rawBody;
    const email = sanitizeEmail(rawEmail);
    const newPassword = sanitizeInput(rawPassword, 128);

    if (!email || !newPassword) {
      return res.status(400).json({ error: 'Email and new password are required' });
    }

    // Mandatory Bearer token verification (Prevents unauthorized password change)
    const token = getBearerToken(req);
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: Authentication token is required.' });
    }
    const decoded = verifyAuthToken(token);
    if (!decoded || !decoded.email || decoded.email.toLowerCase() !== email.toLowerCase()) {
      return res.status(403).json({ error: 'Forbidden: You can only change your own password.' });
    }

    // Password Complexity Validation
    const pwValidation = validatePasswordStrength(newPassword);
    if (!pwValidation.valid) {
      return res.status(400).json({ error: pwValidation.error });
    }

    await connectToDatabase();

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    if (user.provider === 'google' && !user.password) {
      user.provider = 'both';
    }
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password updated successfully!',
    });
  } catch (err) {
    console.error('[Vercel Auth Update Password Error]:', err);
    return res.status(500).json({ error: 'Failed to update password' });
  }
}

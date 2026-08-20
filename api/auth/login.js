import { connectToDatabase, User } from '../_db.js';
import bcrypt from 'bcryptjs';
import {
  sanitizeEmail,
  sanitizeInput,
  checkRateLimit,
  signAuthToken,
  checkHoneypot,
  sanitizeNoSql,
  checkAccountLockout,
  recordFailedLogin,
  clearFailedLogins,
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
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
    const rateCheck = await checkRateLimit(`login:${clientIp}`, 10, 60);
    res.setHeader('X-RateLimit-Remaining', rateCheck.remaining);
    if (!rateCheck.allowed) {
      return res.status(429).json({ error: `Too many login attempts. Please wait ${rateCheck.resetIn} seconds.` });
    }

    const { email: rawEmail, password: rawPassword } = rawBody;
    const email = sanitizeEmail(rawEmail);
    const password = sanitizeInput(rawPassword, 128);

    if (!email) {
      return res.status(400).json({ error: 'A valid email address is required' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    // Account Lockout check (blocks after 5 consecutive failed logins)
    const lockout = checkAccountLockout(email);
    if (lockout.locked) {
      return res.status(423).json({ error: lockout.error });
    }

    await connectToDatabase();

    const user = await User.findOne({ email });
    if (!user) {
      recordFailedLogin(email);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Google-only account protection
    if (user.provider === 'google' && !user.password) {
      return res.status(400).json({
        error: 'This account is registered using Google Sign-In. Please sign in with Google.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password || '');
    if (!isMatch) {
      const failStatus = recordFailedLogin(email);
      if (failStatus && failStatus.locked) {
        return res.status(423).json({
          error: 'Too many failed login attempts. Your account is temporarily locked for 15 minutes for your security.',
        });
      }
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Successful login: reset failed login counter
    clearFailedLogins(email);

    // Issue signed HMAC token
    const token = signAuthToken({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
    });

    user.lastLogin = new Date();
    await user.save();

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        avatar: user.avatar || '🎓',
        bio: user.bio || '',
        grade: user.grade || 'Student',
        provider: user.provider || 'email',
        isVerified: true,
        savedBooks: user.savedBooks || [],
        joinedDate: user.createdAt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      },
    });
  } catch (err) {
    console.error('[Vercel Auth Login Error]:', err);
    return res.status(500).json({ error: 'Login failed. Please try again later.' });
  }
}

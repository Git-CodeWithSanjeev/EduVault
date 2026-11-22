import { connectToDatabase, User, PendingSignup } from '../_db.js';
import { sanitizeEmail, sanitizeInput, timingSafeMatch, checkRateLimit, signAuthToken } from '../../services/security.js';

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
    const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
    const rateCheck = await checkRateLimit(`verify_signup:${clientIp}`, 15, 60);
    res.setHeader('X-RateLimit-Remaining', rateCheck.remaining);
    if (!rateCheck.allowed) {
      return res.status(429).json({ error: `Too many verification attempts. Please wait ${rateCheck.resetIn} seconds.` });
    }

    const { email: rawEmail, otp: rawOtp } = req.body || {};
    const email = sanitizeEmail(rawEmail);
    const otp = sanitizeInput(rawOtp, 10);

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and verification code are required' });
    }

    await connectToDatabase();

    const pending = await PendingSignup.findOne({ email });

    if (!pending) {
      return res.status(400).json({ error: 'Verification code has expired or was not found. Please sign up again.' });
    }

    // Timing-safe constant-time OTP check
    if (!timingSafeMatch(String(pending.otp).trim(), otp)) {
      return res.status(400).json({ error: 'Invalid verification code. Please check and try again.' });
    }

    const newUser = await User.create({
      name: pending.name || email.split('@')[0],
      email,
      password: pending.password,
      avatar: '🎓',
      bio: '',
      grade: 'Student',
      provider: 'email',
      isVerified: true,
      savedBooks: [],
      createdAt: new Date(),
      lastLogin: new Date(),
    });

    await PendingSignup.deleteOne({ email });

    const token = signAuthToken({
      userId: newUser._id.toString(),
      email: newUser.email,
      name: newUser.name,
    });

    return res.status(201).json({
      success: true,
      message: 'Account verified successfully!',
      token,
      user: {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        avatar: newUser.avatar,
        bio: newUser.bio || '',
        grade: newUser.grade || 'Student',
        provider: 'email',
        isVerified: true,
        savedBooks: [],
        joinedDate: newUser.createdAt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      },
    });
  } catch (err) {
    console.error('[Vercel Auth Verify Signup Error]:', err);
    return res.status(500).json({ error: 'Verification failed. Please try again.' });
  }
}

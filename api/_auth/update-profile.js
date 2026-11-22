import { connectToDatabase, User } from '../_db.js';
import {
  sanitizeEmail,
  sanitizeInput,
  sanitizeNoSql,
  getBearerToken,
  verifyAuthToken,
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
    const rateCheck = await checkRateLimit(`profile:${clientIp}`, 15, 60);
    res.setHeader('X-RateLimit-Remaining', rateCheck.remaining);
    if (!rateCheck.allowed) {
      return res.status(429).json({ error: `Too many requests. Please wait ${rateCheck.resetIn} seconds.` });
    }

    const { email: rawEmail, name: rawName, avatar: rawAvatar, bio: rawBio, grade: rawGrade } = rawBody;
    const email = sanitizeEmail(rawEmail);

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Mandatory Bearer token authorization verification (Prevents IDOR)
    const token = getBearerToken(req);
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: Authentication token is required.' });
    }
    const decoded = verifyAuthToken(token);
    if (!decoded || !decoded.email || decoded.email.toLowerCase() !== email.toLowerCase()) {
      return res.status(403).json({ error: 'Forbidden: You can only update your own profile.' });
    }

    const name = sanitizeInput(rawName, 60);
    const avatar = sanitizeInput(rawAvatar, 500);
    const bio = sanitizeInput(rawBio, 500);
    const grade = sanitizeInput(rawGrade, 50);

    await connectToDatabase();

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (name) user.name = name;
    if (avatar) user.avatar = avatar;
    if (typeof rawBio === 'string') user.bio = bio;
    if (typeof rawGrade === 'string') user.grade = grade;

    await user.save();

    return res.status(200).json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        grade: user.grade,
        provider: user.provider,
        isVerified: true,
        savedBooks: user.savedBooks || [],
        joinedDate: user.createdAt ? user.createdAt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Recently',
      },
    });
  } catch (err) {
    console.error('[Vercel Auth Update Profile Error]:', err);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
}

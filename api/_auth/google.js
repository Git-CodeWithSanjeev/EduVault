import { connectToDatabase, User } from '../_db.js';
import { sanitizeEmail, sanitizeInput, signAuthToken } from '../../services/security.js';

function decodeGoogleJwt(jwt) {
  try {
    const parts = jwt.split('.');
    if (parts.length !== 3) return null;
    const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonStr = Buffer.from(payloadBase64, 'base64').toString('utf8');
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

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
    const { credential, email: rawEmail, name: rawName, avatar: rawAvatar, googleId: rawGoogleId } = req.body || {};

    let email = sanitizeEmail(rawEmail);
    let name = sanitizeInput(rawName, 60);
    let avatar = sanitizeInput(rawAvatar, 500);
    let googleId = sanitizeInput(rawGoogleId, 100);

    if (credential && typeof credential === 'string') {
      const decoded = decodeGoogleJwt(credential);
      if (decoded && decoded.email) {
        email = sanitizeEmail(decoded.email);
        name = sanitizeInput(decoded.name || decoded.given_name || email.split('@')[0], 60);
        avatar = sanitizeInput(decoded.picture || avatar || '🎓', 500);
        googleId = sanitizeInput(decoded.sub || googleId, 100);
      }
    }

    if (!email) {
      return res.status(400).json({ error: 'Valid Google email is required' });
    }

    await connectToDatabase();

    let user = await User.findOne({ email });

    if (user) {
      user.name = name || user.name;
      user.avatar = user.avatar || avatar || '🎓';
      user.provider = user.provider === 'email' ? 'both' : 'google';
      if (googleId) user.googleId = googleId;
      user.lastLogin = new Date();
      await user.save();
    } else {
      user = await User.create({
        name: name || email.split('@')[0],
        email,
        password: '',
        avatar: avatar || '🎓',
        bio: '',
        grade: 'Student',
        provider: 'google',
        googleId: googleId || '',
        lastLogin: new Date(),
      });
    }

    const token = signAuthToken({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
    });

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio || '',
        grade: user.grade || 'Student',
        provider: user.provider,
        isVerified: true,
        savedBooks: user.savedBooks || [],
        joinedDate: user.createdAt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      },
    });
  } catch (err) {
    console.error('[Vercel Google Auth Error]:', err);
    return res.status(500).json({ error: 'Google authentication failed' });
  }
}

import { connectToDatabase, User } from '../_db.js';

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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { credential, email: rawEmail, name: rawName, avatar: rawAvatar, googleId: rawGoogleId } = req.body || {};

    let email = rawEmail;
    let name = rawName;
    let avatar = rawAvatar;
    let googleId = rawGoogleId;

    if (credential) {
      const decoded = decodeGoogleJwt(credential);
      if (decoded && decoded.email) {
        email = decoded.email;
        name = decoded.name || decoded.given_name || email.split('@')[0];
        avatar = decoded.picture || avatar || '🎓';
        googleId = decoded.sub || googleId;
      }
    }

    if (!email) {
      return res.status(400).json({ error: 'Valid Google email is required' });
    }

    const cleanEmail = email.toLowerCase().trim();

    await connectToDatabase();

    let user = await User.findOne({ email: cleanEmail });

    if (user) {
      user.name = name || user.name;
      user.avatar = user.avatar || avatar || '🎓';
      user.provider = 'google';
      if (googleId) user.googleId = googleId;
      user.lastLogin = new Date();
      await user.save();
    } else {
      user = await User.create({
        name: name || cleanEmail.split('@')[0],
        email: cleanEmail,
        password: '',
        avatar: avatar || '🎓',
        provider: 'google',
        googleId: googleId || '',
        lastLogin: new Date(),
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        provider: 'google',
        isVerified: true,
        savedBooks: user.savedBooks || [],
        joinedDate: user.createdAt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      },
    });
  } catch (err) {
    console.error('[Vercel Google Auth Error]:', err);
    return res.status(500).json({ error: err.message || 'Google authentication failed' });
  }
}

import { connectToDatabase, User } from '../_db.js';

const globalPendingSignups = global.pendingSignupsMap || (global.pendingSignupsMap = new Map());

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
    const { email, otp } = req.body || {};
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and verification code are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const pending = globalPendingSignups.get(cleanEmail);

    if (!pending || pending.expiresAt < Date.now()) {
      return res.status(400).json({ error: 'Verification code has expired. Please sign up again.' });
    }

    if (String(pending.otp).trim() !== String(otp).trim()) {
      return res.status(400).json({ error: 'Invalid verification code. Please check and try again.' });
    }

    await connectToDatabase();

    const newUser = await User.create({
      name: pending.name || cleanEmail.split('@')[0],
      email: cleanEmail,
      password: pending.hashedPassword,
      avatar: '🎓',
      provider: 'email',
      isVerified: true,
      savedBooks: [],
    });

    globalPendingSignups.delete(cleanEmail);

    return res.status(201).json({
      success: true,
      message: 'Account verified successfully!',
      user: {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        avatar: newUser.avatar,
        provider: 'email',
        isVerified: true,
        savedBooks: [],
        joinedDate: newUser.createdAt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      },
    });
  } catch (err) {
    console.error('[Vercel Auth Verify Signup Error]:', err);
    return res.status(500).json({ error: err.message || 'Verification failed' });
  }
}

import { connectToDatabase, User } from '../_db.js';

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
    const { email, name, avatar, bio, grade } = req.body || {};
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    await connectToDatabase();

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (name) user.name = name.trim();
    if (avatar) user.avatar = avatar;
    if (typeof bio === 'string') user.bio = bio;
    if (typeof grade === 'string') user.grade = grade;

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
    return res.status(500).json({ error: err.message || 'Failed to update profile' });
  }
}

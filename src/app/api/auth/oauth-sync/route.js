import { NextResponse } from 'next/server';
import { connectToDatabase, User } from '@/lib/mongodb';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, name, avatar, googleId } = body || {};

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    await connectToDatabase();

    let user = await User.findOne({ email: cleanEmail });
    if (!user) {
      user = await User.create({
        name: name || cleanEmail.split('@')[0],
        email: cleanEmail,
        avatar: avatar || '🎓',
        provider: 'google',
        googleId: googleId || '',
        lastLogin: new Date(),
      });
    } else {
      user.name = name || user.name;
      user.avatar = user.avatar || avatar || '🎓';
      user.lastLogin = new Date();
      await user.save();
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        provider: 'google',
        isVerified: true,
        savedBooks: user.savedBooks || [],
        joinedDate: user.createdAt
          ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
          : 'Recently',
      },
    });
  } catch (err) {
    console.error('[Next.js OAuth Sync Error]:', err);
    return NextResponse.json({ error: err.message || 'OAuth sync failed' }, { status: 500 });
  }
}

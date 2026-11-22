import { NextResponse } from 'next/server';
import { connectToDatabase, User } from '@/lib/mongodb';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, name, avatar, bio, grade, savedBooks } = body || {};

    if (!email) {
      return NextResponse.json({ error: 'User email is required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    await connectToDatabase();

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (name) user.name = name.trim();
    if (avatar) user.avatar = avatar;
    if (bio !== undefined) user.bio = bio;
    if (grade) user.grade = grade;
    if (Array.isArray(savedBooks)) user.savedBooks = savedBooks;

    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio || '',
        grade: user.grade || 'Student',
        provider: user.provider || 'email',
        isVerified: true,
        savedBooks: user.savedBooks || [],
        joinedDate: user.createdAt
          ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
          : 'Recently',
      },
    });
  } catch (err) {
    console.error('[Next.js Update Profile Error]:', err);
    return NextResponse.json({ error: err.message || 'Failed to update profile' }, { status: 500 });
  }
}

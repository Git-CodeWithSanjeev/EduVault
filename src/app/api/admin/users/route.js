import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { connectMongo, User } from '@/lib/mongodb';

export async function GET(request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    await connectMongo();
    const dbUsers = await User.find({}).sort({ createdAt: -1 }).lean();
    const usersList = dbUsers.map((u) => ({
      id: u._id.toString(),
      name: u.name || 'Anonymous User',
      email: u.email,
      avatar: u.avatar || '',
      provider: u.provider || (u.googleId ? 'google' : 'email'),
      role: u.role || 'student',
      isVerified: u.isVerified !== false,
      savedBooksCount: (u.savedBooks || []).length,
      createdAt: u.createdAt || new Date(),
      lastLogin: u.lastLogin || u.updatedAt || u.createdAt,
    }));

    return NextResponse.json({
      success: true,
      count: usersList.length,
      users: usersList,
    });
  } catch (err) {
    console.error('[Admin Users List Error]:', err);
    return NextResponse.json({ error: err.message || 'Failed to load users' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase, User } from '@/lib/mongodb';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, currentPassword, newPassword } = body || {};

    if (!email || !newPassword) {
      return NextResponse.json({ error: 'Email and new password are required' }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'New password must be at least 8 characters long' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    await connectToDatabase();

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return NextResponse.json({ error: 'User account not found' }, { status: 404 });
    }

    if (user.password) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Current password is required to update password' }, { status: 400 });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return NextResponse.json({ error: 'Current password does not match' }, { status: 401 });
      }
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.provider = 'email';
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully.',
    });
  } catch (err) {
    console.error('[Next.js Update Password Error]:', err);
    return NextResponse.json({ error: err.message || 'Failed to update password' }, { status: 500 });
  }
}

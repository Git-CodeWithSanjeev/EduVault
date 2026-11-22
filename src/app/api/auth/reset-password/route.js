import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase, User } from '@/lib/mongodb';
import { redisGet, redisDel } from '@/lib/redis';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, otp, newPassword } = body || {};
    if (!email || !otp || !newPassword) {
      return NextResponse.json({ error: 'Email, verification code, and new password are required' }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'New password must be at least 8 characters long' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const stored = await redisGet(`reset_otp:${cleanEmail}`);

    if (!stored || !stored.otp) {
      return NextResponse.json({ error: 'Verification session expired. Please request a new code.' }, { status: 400 });
    }

    if (String(stored.otp).trim() !== String(otp).trim()) {
      return NextResponse.json({ error: 'Invalid verification code.' }, { status: 400 });
    }

    await connectToDatabase();
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return NextResponse.json({ error: 'User account not found.' }, { status: 404 });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.provider = 'email';
    await user.save();

    await redisDel(`reset_otp:${cleanEmail}`);

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully! You can now sign in with your new password.',
    });
  } catch (err) {
    console.error('[Next.js Reset Password Error]:', err);
    return NextResponse.json({ error: err.message || 'Failed to reset password' }, { status: 500 });
  }
}

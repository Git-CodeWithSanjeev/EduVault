import { NextResponse } from 'next/server';
import { connectToDatabase, User } from '@/lib/mongodb';
import { redisGet, redisDel } from '@/lib/redis';
import {
  sanitizeEmail,
  sanitizeInput,
  timingSafeMatch,
  signAuthToken,
} from '@/lib/security';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, otp } = body || {};
    const cleanEmail = sanitizeEmail(email);
    const cleanOtp = sanitizeInput(otp, 10);

    if (!cleanEmail || !cleanOtp) {
      return NextResponse.json({ error: 'Email and verification code are required' }, { status: 400 });
    }

    const pending = await redisGet(`signup_otp:${cleanEmail}`);

    if (!pending || (pending.expiresAt && pending.expiresAt < Date.now())) {
      return NextResponse.json({ error: 'Verification code has expired. Please sign up again.' }, { status: 400 });
    }

    if (!timingSafeMatch(String(pending.otp).trim(), cleanOtp)) {
      return NextResponse.json({ error: 'Invalid verification code. Please check your email and try again.' }, { status: 400 });
    }

    await connectToDatabase();
    const newUser = await User.create({
      name: pending.name || cleanEmail.split('@')[0],
      email: cleanEmail,
      password: pending.hashedPassword,
      avatar: '🎓',
      bio: '',
      grade: 'Student',
      provider: 'email',
      isVerified: true,
      savedBooks: [],
    });

    await redisDel(`signup_otp:${cleanEmail}`);

    const token = signAuthToken({
      userId: newUser._id.toString(),
      email: newUser.email,
      name: newUser.name,
    });

    return NextResponse.json(
      {
        success: true,
        token,
        message: 'Account verified successfully!',
        user: {
          id: newUser._id.toString(),
          name: newUser.name,
          email: newUser.email,
          avatar: newUser.avatar,
          bio: newUser.bio || '',
          grade: newUser.grade || 'Student',
          provider: 'email',
          isVerified: true,
          savedBooks: newUser.savedBooks || [],
          joinedDate: newUser.createdAt
            ? new Date(newUser.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
            : 'Recently',
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('[Next.js Verify Signup OTP Error]:', err);
    return NextResponse.json({ error: err.message || 'Verification failed' }, { status: 500 });
  }
}

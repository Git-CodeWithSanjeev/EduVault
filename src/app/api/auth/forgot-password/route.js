import { NextResponse } from 'next/server';
import { connectToDatabase, User } from '@/lib/mongodb';
import { redisSet } from '@/lib/redis';
import { sendPasswordResetEmail } from '@/lib/email';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email } = body || {};
    if (!email) {
      return NextResponse.json({ error: 'Please enter your email address' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    await connectToDatabase();

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return NextResponse.json({ error: 'No account found with this email address. Please register.' }, { status: 404 });
    }
    if (!user.password && user.provider === 'google') {
      return NextResponse.json({ error: 'This account uses Google Sign-In. Please sign in with Google.' }, { status: 400 });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await redisSet(`reset_otp:${cleanEmail}`, { otp, timestamp: Date.now() }, 600);

    await sendPasswordResetEmail(cleanEmail, otp);

    return NextResponse.json({
      success: true,
      message: `A 6-digit verification code has been sent to ${cleanEmail}. Please check your inbox.`,
    });
  } catch (err) {
    console.error('[Next.js Forgot Password Error]:', err);
    return NextResponse.json({ error: err.message || 'Failed to process password reset request' }, { status: 500 });
  }
}

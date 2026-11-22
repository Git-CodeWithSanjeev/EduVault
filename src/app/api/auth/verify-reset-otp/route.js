import { NextResponse } from 'next/server';
import { redisGet } from '@/lib/redis';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, otp } = body || {};
    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and 6-digit verification code are required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const stored = await redisGet(`reset_otp:${cleanEmail}`);

    if (!stored || !stored.otp) {
      return NextResponse.json(
        { error: 'Verification code has expired or was not requested. Please request a new code.' },
        { status: 400 }
      );
    }

    if (String(stored.otp).trim() !== String(otp).trim()) {
      return NextResponse.json({ error: 'Invalid verification code. Please check and try again.' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Verification code confirmed successfully.',
    });
  } catch (err) {
    console.error('[Next.js Verify Reset OTP Error]:', err);
    return NextResponse.json({ error: err.message || 'Failed to verify reset code' }, { status: 500 });
  }
}

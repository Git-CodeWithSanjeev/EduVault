import { NextResponse } from 'next/server';
import { redisGet, redisSet } from '@/lib/redis';
import { sendSignupOtpEmail } from '@/lib/email';
import {
  sanitizeEmail,
  checkEmailCooldown,
  generateSecureOtp,
} from '@/lib/security';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email } = body || {};
    const cleanEmail = sanitizeEmail(email);
    if (!cleanEmail) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    const cooldown = checkEmailCooldown(cleanEmail);
    if (!cooldown.allowed) {
      return NextResponse.json({ error: cooldown.error }, { status: 429 });
    }

    const pending = await redisGet(`signup_otp:${cleanEmail}`);

    if (!pending) {
      return NextResponse.json({ error: 'No pending registration found. Please sign up again.' }, { status: 400 });
    }

    const newOtp = generateSecureOtp();
    pending.otp = newOtp;
    pending.expiresAt = Date.now() + 600000;

    await redisSet(`signup_otp:${cleanEmail}`, pending, 600);

    sendSignupOtpEmail(cleanEmail, newOtp, pending.name).catch((mailErr) => {
      console.error('[Background Resend Email Error]:', mailErr.message);
    });

    return NextResponse.json({
      success: true,
      message: `A new 6-digit confirmation code has been sent to ${cleanEmail}.`,
    });
  } catch (err) {
    console.error('[Next.js Resend Signup OTP Error]:', err);
    return NextResponse.json({ error: err.message || 'Failed to resend verification code' }, { status: 500 });
  }
}

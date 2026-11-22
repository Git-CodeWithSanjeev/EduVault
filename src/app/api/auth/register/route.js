import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase, User } from '@/lib/mongodb';
import { redisSet } from '@/lib/redis';
import { sendSignupOtpEmail } from '@/lib/email';
import {
  checkHoneypot,
  sanitizeInput,
  sanitizeEmail,
  validatePasswordStrength,
  checkEmailCooldown,
  generateSecureOtp,
} from '@/lib/security';

export async function POST(request) {
  try {
    const body = await request.json();
    if (checkHoneypot(body)) {
      return NextResponse.json({ success: true, requireOtp: true, message: 'Verification code sent.' });
    }

    const { name, email, password } = body || {};
    const cleanName = sanitizeInput(name, 60);
    const cleanEmail = sanitizeEmail(email);
    const cleanPassword = sanitizeInput(password, 128);

    if (!cleanEmail || !cleanPassword) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }
    if (cleanName.length < 2) {
      return NextResponse.json({ error: 'Full Name must be at least 2 characters' }, { status: 400 });
    }

    const pwValidation = validatePasswordStrength(cleanPassword);
    if (!pwValidation.valid) {
      return NextResponse.json({ error: pwValidation.error }, { status: 400 });
    }

    const cooldown = checkEmailCooldown(cleanEmail);
    if (!cooldown.allowed) {
      return NextResponse.json({ error: cooldown.error }, { status: 429 });
    }

    await connectToDatabase();
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email address already exists. Please sign in.' }, { status: 400 });
    }

    const otp = generateSecureOtp();
    const hashedPassword = await bcrypt.hash(cleanPassword, 10);

    const pendingData = {
      name: cleanName,
      email: cleanEmail,
      hashedPassword,
      otp,
      expiresAt: Date.now() + 600000,
    };

    await redisSet(`signup_otp:${cleanEmail}`, pendingData, 600);

    sendSignupOtpEmail(cleanEmail, otp, cleanName).catch((mailErr) => {
      console.error('[Background Signup Email Error]:', mailErr.message);
    });

    return NextResponse.json({
      success: true,
      requireOtp: true,
      email: cleanEmail,
      message: `A 6-digit confirmation code has been sent to ${cleanEmail}. Please check your inbox.`,
    });
  } catch (err) {
    console.error('[Next.js Register Error]:', err);
    return NextResponse.json({ error: err.message || 'Registration failed' }, { status: 500 });
  }
}

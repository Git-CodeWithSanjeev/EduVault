import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase, User } from '@/lib/mongodb';
import {
  checkHoneypot,
  sanitizeEmail,
  sanitizeInput,
  checkAccountLockout,
  recordFailedLogin,
  clearFailedLogins,
  signAuthToken,
} from '@/lib/security';

export async function POST(request) {
  try {
    const body = await request.json();
    if (checkHoneypot(body)) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const { email, password } = body || {};
    const cleanEmail = sanitizeEmail(email);
    const cleanPassword = sanitizeInput(password, 128);

    if (!cleanEmail || !cleanPassword) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const lockout = checkAccountLockout(cleanEmail);
    if (lockout.locked) {
      return NextResponse.json({ error: lockout.error }, { status: 423 });
    }

    await connectToDatabase();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      recordFailedLogin(cleanEmail);
      return NextResponse.json({ error: 'No account found with this email. Please register first.' }, { status: 404 });
    }

    if (user.provider === 'google' && !user.password) {
      return NextResponse.json(
        { error: 'This account was created with Google Sign-In. Please click Continue with Google.' },
        { status: 400 }
      );
    }

    const isMatch = await bcrypt.compare(cleanPassword, user.password);
    if (!isMatch) {
      recordFailedLogin(cleanEmail);
      return NextResponse.json({ error: 'Incorrect password. Please try again.' }, { status: 401 });
    }

    clearFailedLogins(cleanEmail);

    user.lastLogin = new Date();
    await user.save();

    const token = signAuthToken({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
    });

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        avatar: user.avatar || '🎓',
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
    console.error('[Next.js Login Error]:', err);
    return NextResponse.json({ error: err.message || 'Login failed' }, { status: 500 });
  }
}

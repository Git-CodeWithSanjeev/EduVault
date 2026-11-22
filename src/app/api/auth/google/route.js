import { NextResponse } from 'next/server';
import { connectToDatabase, User } from '@/lib/mongodb';
import { signAuthToken } from '@/lib/security';

function decodeGoogleJwt(jwt) {
  try {
    const parts = jwt.split('.');
    if (parts.length !== 3) return null;
    const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonStr = Buffer.from(payloadBase64, 'base64').toString('utf8');
    return JSON.parse(jsonStr);
  } catch (e) {
    return null;
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { credential, email: rawEmail, name: rawName, avatar: rawAvatar, googleId: rawGoogleId } = body || {};

    let email = rawEmail;
    let name = rawName;
    let avatar = rawAvatar;
    let googleId = rawGoogleId;

    if (credential) {
      const decoded = decodeGoogleJwt(credential);
      if (decoded && decoded.email) {
        email = decoded.email;
        name = decoded.name || decoded.given_name || email.split('@')[0];
        avatar = decoded.picture || avatar || '🎓';
        googleId = decoded.sub || googleId;
      }
    }

    if (!email) {
      return NextResponse.json({ error: 'Valid Google email is required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    await connectToDatabase();

    let user = await User.findOne({ email: cleanEmail });

    if (user) {
      user.name = name || user.name;
      user.avatar = user.avatar || avatar || '🎓';
      user.provider = 'google';
      if (googleId) user.googleId = googleId;
      user.lastLogin = new Date();
      await user.save();
    } else {
      user = await User.create({
        name: name || cleanEmail.split('@')[0],
        email: cleanEmail,
        password: '',
        avatar: avatar || '🎓',
        provider: 'google',
        googleId: googleId || '',
        lastLogin: new Date(),
      });
    }

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
        avatar: user.avatar,
        provider: 'google',
        isVerified: true,
        savedBooks: user.savedBooks || [],
        joinedDate: user.createdAt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      },
    });
  } catch (err) {
    console.error('[Next.js Google Auth Error]:', err);
    return NextResponse.json({ error: err.message || 'Google authentication failed' }, { status: 500 });
  }
}

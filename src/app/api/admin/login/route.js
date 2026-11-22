import { NextResponse } from 'next/server';
import { checkRateLimit, timingSafeMatch, signAdminToken } from '@/lib/security';

export async function POST(request) {
  try {
    const clientIp = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateCheck = await checkRateLimit(`admin_login:${clientIp}`, 6, 60);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `Too many admin login attempts. Please wait ${rateCheck.resetIn} seconds.` },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { username, password } = body || {};
    const expectedUser = (process.env.ADMIN_USERNAME || 'admin').trim();
    const expectedPass = (process.env.ADMIN_PASSWORD || 'admin@eduvault123').trim();

    if (
      timingSafeMatch(String(username || '').trim(), expectedUser) &&
      timingSafeMatch(String(password || '').trim(), expectedPass)
    ) {
      const token = signAdminToken();
      return NextResponse.json({
        success: true,
        message: 'Admin authenticated successfully',
        token,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Invalid Admin ID or Password. Please try again.',
      },
      { status: 401 }
    );
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Admin login failed' }, { status: 500 });
  }
}

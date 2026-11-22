import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/security';

export function getAdminTokenFromRequest(request) {
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization') || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  return null;
}

export function requireAdmin(request) {
  const token = getAdminTokenFromRequest(request);
  if (!token || !verifyAdminToken(token)) {
    return NextResponse.json(
      {
        success: false,
        error: 'Unauthorized: Admin authentication token is required or has expired.',
      },
      { status: 401 }
    );
  }
  return null;
}

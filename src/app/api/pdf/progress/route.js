import { NextResponse } from 'next/server';
import { redisGet, redisSet } from '@/lib/redis';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, bookId, page, totalPages, percentage } = body;
    if (!email || !bookId) {
      return NextResponse.json({ error: 'Missing email or bookId' }, { status: 400 });
    }
    const key = `progress:${email}:${bookId}`;
    const payload = JSON.stringify({ page, totalPages, percentage, updatedAt: new Date().toISOString() });
    await redisSet(key, payload, 86400 * 30);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const bookId = searchParams.get('bookId');
    if (!email || !bookId) {
      return NextResponse.json({ error: 'Missing email or bookId' }, { status: 400 });
    }
    const key = `progress:${email}:${bookId}`;
    const progress = await redisGet(key);
    return NextResponse.json({ success: true, progress: progress || null });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getRedisStatus } from '@/lib/redis';

export async function GET() {
  const status = await getRedisStatus();
  return NextResponse.json(status);
}

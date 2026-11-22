import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { redisGet, redisSet, redisDel, getRedisStatus } from '@/lib/redis';

export async function POST(request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  const startTime = Date.now();
  try {
    const testKey = `admin_ping_${Date.now()}`;
    await redisSet(testKey, { test: true }, 10);
    const result = await redisGet(testKey);
    await redisDel(testKey);

    const duration = Date.now() - startTime;
    return NextResponse.json({
      success: true,
      latencyMs: duration,
      status: getRedisStatus(),
      message: `Redis responded successfully in ${duration}ms!`,
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Redis test failed',
        latencyMs: Date.now() - startTime,
      },
      { status: 200 }
    );
  }
}

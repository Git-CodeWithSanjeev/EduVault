import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { maskSecret } from '@/lib/security';
import { connectMongo } from '@/lib/mongodb';
import { getRedisStatus } from '@/lib/redis';
import { readEnvConfig, updateEnvConfig } from '@/lib/envManager';

export async function GET(request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    const rawConfig = readEnvConfig();
    const { searchParams } = new URL(request.url);
    const isReveal = searchParams.get('reveal') === 'true';

    const safeConfig = {};
    for (const [k, v] of Object.entries(rawConfig)) {
      if (!isReveal && (k.includes('PASS') || k.includes('SECRET') || k.includes('KEY') || k.includes('URI'))) {
        safeConfig[k] = maskSecret(v);
      } else {
        safeConfig[k] = v;
      }
    }

    let isDbConnected = false;
    try {
      const conn = await connectMongo();
      isDbConnected = Boolean(conn?.readyState === 1);
    } catch {
      isDbConnected = false;
    }

    return NextResponse.json({
      success: true,
      config: safeConfig,
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        uptime: Math.floor(process.uptime()),
        memoryUsage: process.memoryUsage(),
        dbConnected: isDbConnected,
        redisStatus: getRedisStatus(),
      },
    });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Failed to read credentials' }, { status: 500 });
  }
}

export async function POST(request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    const updates = await request.json().catch(() => ({}));
    if (typeof updates !== 'object' || Array.isArray(updates)) {
      return NextResponse.json({ error: 'Invalid payload. Must be a key-value object.' }, { status: 400 });
    }

    const updatedConfig = updateEnvConfig(updates);

    if (updates.MONGODB_URI && updates.MONGODB_URI !== process.env.MONGODB_URI) {
      connectMongo(updates.MONGODB_URI).catch((e) => console.warn('[Admin Mongo Reconnect]:', e.message));
    }

    return NextResponse.json({
      success: true,
      message: 'Configuration saved and hot-reloaded successfully!',
      config: updatedConfig,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Failed to update credentials' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { requireAdmin } from '@/lib/adminAuth';

export async function POST(request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  const body = await request.json().catch(() => ({}));
  const uri = body?.uri || process.env.MONGODB_URI;

  if (!uri) {
    return NextResponse.json({ error: 'MongoDB URI is required' }, { status: 400 });
  }

  const startTime = Date.now();
  try {
    const tempConn = await mongoose.createConnection(uri, {
      serverSelectionTimeoutMS: 5000,
    }).asPromise();

    const pingResult = await tempConn.db.admin().ping();
    const collections = await tempConn.db.listCollections().toArray();
    const duration = Date.now() - startTime;

    await tempConn.close();

    return NextResponse.json({
      success: true,
      latencyMs: duration,
      databaseName: tempConn.name || 'eduvault',
      collectionsCount: collections.length,
      collections: collections.map((c) => c.name),
      message: `MongoDB connected successfully in ${duration}ms!`,
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'MongoDB connection failed',
        latencyMs: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

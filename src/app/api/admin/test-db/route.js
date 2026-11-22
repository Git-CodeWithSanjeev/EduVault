import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { requireAdmin } from '@/lib/adminAuth';

export async function POST(request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  const body = await request.json().catch(() => ({}));
  let uri = (body?.uri || '').trim();

  // If URI is empty, masked with bullet points, or contains placeholders, fallback to process.env.MONGODB_URI
  if (!uri || uri.includes('•') || uri.includes('*') || uri.startsWith('•••')) {
    uri = (process.env.MONGODB_URI || '').trim();
  }

  // Strip enclosing quotes if any
  if ((uri.startsWith('"') && uri.endsWith('"')) || (uri.startsWith("'") && uri.endsWith("'"))) {
    uri = uri.slice(1, -1).trim();
  }

  if (!uri) {
    return NextResponse.json(
      {
        success: false,
        error: 'MongoDB URI is required. Please set MONGODB_URI in your environment or provide a valid connection string.',
      },
      { status: 200 }
    );
  }

  const startTime = Date.now();
  try {
    const tempConn = await mongoose.createConnection(uri, {
      serverSelectionTimeoutMS: 6000,
      connectTimeoutMS: 6000,
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
      { status: 200 }
    );
  }
}

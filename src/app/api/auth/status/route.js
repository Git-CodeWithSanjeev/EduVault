import { NextResponse } from 'next/server';

export async function GET() {
  const hasMongo = !!(process.env.MONGODB_URI && !process.env.MONGODB_URI.includes('<db_password>'));
  return NextResponse.json({
    status: 'ok',
    mode: 'nextjs-app-router',
    database: hasMongo ? 'mongodb-cluster' : 'offline-mock',
  });
}

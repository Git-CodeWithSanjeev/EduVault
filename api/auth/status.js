import { connectToDatabase } from '../_db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await connectToDatabase();
    return res.status(200).json({
      dbConnected: true,
      database: 'eduvault',
      hasEnvPassword: true,
    });
  } catch (err) {
    console.error('[Database Health Check Error]:', err.message);
    return res.status(200).json({
      dbConnected: false,
      database: 'eduvault',
      error: 'Database connection currently unavailable.',
    });
  }
}

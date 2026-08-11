import { connectToDatabase } from '../_db.js';

export default async function handler(req, res) {
  try {
    await connectToDatabase();
    return res.status(200).json({
      dbConnected: true,
      database: 'eduvault',
      hasEnvPassword: true,
    });
  } catch (err) {
    return res.status(200).json({
      dbConnected: false,
      database: 'eduvault',
      error: err.message,
    });
  }
}

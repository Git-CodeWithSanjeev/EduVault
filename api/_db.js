import mongoose from 'mongoose';
import fs from 'fs';

// Helper to load .env if process.env.MONGODB_URI is not set
if (!process.env.MONGODB_URI && fs.existsSync('.env')) {
  try {
    const envContent = fs.readFileSync('.env', 'utf-8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...vals] = trimmed.split('=');
        process.env[key.trim()] = vals.join('=').trim();
      }
    }
  } catch (e) {}
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://tzk7865_db_user:6ZHpE2Y12BxQVGZl@cluster0.e6rfj5s.mongodb.net/eduvault?retryWrites=true&w=majority';

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!MONGODB_URI || MONGODB_URI.includes('<db_password>')) {
    throw new Error('MONGODB_URI is not properly configured.');
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    }).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, default: '' },
  avatar: { type: String, default: '🎓' },
  bio: { type: String, default: '' },
  grade: { type: String, default: 'Student' },
  provider: { type: String, default: 'email' },
  googleId: { type: String, default: '' },
  savedBooks: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: Date.now },
});

export const User = mongoose.models.User || mongoose.model('User', userSchema);

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

export function getMongoURI() {
  if (fs.existsSync('.env')) {
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

  let uri = process.env.MONGODB_URI || '';

  // If URI has placeholders, or if username/password are provided separately
  const username = process.env.MONGODB_USERNAME || '';
  const password = process.env.MONGODB_PASSWORD || '';

  if (uri && (uri.includes('<password>') || uri.includes('<db_password>')) && password) {
    uri = uri.replace('<password>', encodeURIComponent(password)).replace('<db_password>', encodeURIComponent(password));
  } else if (!uri && username && password) {
    uri = `mongodb+srv://${encodeURIComponent(username)}:${encodeURIComponent(password)}@cluster0.e6rfj5s.mongodb.net/eduvault?retryWrites=true&w=majority`;
  }

  return uri;
}

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (cached.conn && cached.conn.readyState === 1) {
    return cached.conn;
  }

  const uri = getMongoURI();
  if (!uri || uri.includes('<db_password>') || uri.includes('<password>')) {
    throw new Error('MongoDB connection is not properly configured. Please check MONGODB_URI in .env');
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
    }).then((mongooseInstance) => {
      return mongooseInstance;
    }).catch((err) => {
      cached.promise = null;
      cached.conn = null;
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    cached.conn = null;
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

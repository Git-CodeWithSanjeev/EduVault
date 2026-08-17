/**
 * EduVault Server
 * - PDF Proxy Server (no CORS issues, in-memory LRU cache)
 * - User Authentication API powered by MongoDB (eduvault database)
 */

import express from 'express';
import https from 'https';
import http from 'http';
import cors from 'cors';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

// Read .env manually if process.env.MONGODB_URI is not set
if (!process.env.MONGODB_URI && fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...vals] = trimmed.split('=');
      process.env[key.trim()] = vals.join('=').trim();
    }
  }
}

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

/* ─── MongoDB Database Setup ────────────────────────────────────────── */
const MONGODB_URI = process.env.MONGODB_URI;
let dbConnected = false;

if (MONGODB_URI && !MONGODB_URI.includes('<db_password>')) {
  mongoose.connect(MONGODB_URI)
    .then(() => {
      dbConnected = true;
      console.log('✅ Connected to MongoDB cluster (Database: eduvault)');
    })
    .catch((err) => {
      console.error('❌ MongoDB Connection Error:', err.message);
    });
} else {
  console.warn('⚠️  MONGODB_URI is missing or contains <db_password> placeholder in .env.');
  console.warn('   Please replace <db_password> with your MongoDB password in .env to connect to MongoDB eduvault DB.');
}

// User Schema & Model
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, default: '' },
  avatar: { type: String, default: '🎓' },
  bio: { type: String, default: '' },
  grade: { type: String, default: 'Student' },
  provider: { type: String, default: 'email' },
  supabaseId: { type: String, default: '' },
  savedBooks: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: Date.now }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

/* ─── User Authentication Endpoints ──────────────────────────────────── */

/** Helper to decode base64url Google JWT payload */
function decodeGoogleJwt(jwt) {
  try {
    const parts = jwt.split('.');
    if (parts.length !== 3) return null;
    const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonStr = Buffer.from(payloadBase64, 'base64').toString('utf8');
    return JSON.parse(jsonStr);
  } catch (e) {
    return null;
  }
}

// 1. Direct Google OAuth Endpoint
app.post('/api/auth/google', async (req, res) => {
  try {
    const { credential, email: rawEmail, name: rawName, avatar: rawAvatar, googleId: rawGoogleId } = req.body || {};
    
    let email = rawEmail;
    let name = rawName;
    let avatar = rawAvatar;
    let googleId = rawGoogleId;

    // Decode Google JWT if sent
    if (credential) {
      const decoded = decodeGoogleJwt(credential);
      if (decoded && decoded.email) {
        email = decoded.email;
        name = decoded.name || decoded.given_name || email.split('@')[0];
        avatar = decoded.picture || avatar || '🎓';
        googleId = decoded.sub || googleId;
      }
    }

    if (!email) {
      return res.status(400).json({ error: 'Valid Google email is required' });
    }

    const cleanEmail = email.toLowerCase().trim();

    if (!dbConnected) {
      // Demo / offline fallback
      return res.json({
        success: true,
        user: {
          id: googleId || 'google-' + Date.now(),
          name: name || cleanEmail.split('@')[0],
          email: cleanEmail,
          avatar: avatar || '🎓',
          provider: 'google',
          isVerified: true,
          joinedDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        },
      });
    }

    let user = await User.findOne({ email: cleanEmail });

    if (user) {
      // Update existing user
      user.name = name || user.name;
      user.avatar = avatar || user.avatar;
      user.provider = 'google';
      if (googleId) user.googleId = googleId;
      user.lastLogin = new Date();
      await user.save();
      console.log(`✅ [MongoDB] Direct Google login for: ${cleanEmail}`);
    } else {
      // Create new MongoDB user
      user = await User.create({
        name: name || cleanEmail.split('@')[0],
        email: cleanEmail,
        password: '',
        avatar: avatar || '🎓',
        provider: 'google',
        googleId: googleId || '',
        lastLogin: new Date()
      });
      console.log(`✅ [MongoDB] Direct Google user created: ${cleanEmail}`);
    }

    res.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        provider: 'google',
        isVerified: true,
        savedBooks: user.savedBooks || [],
        joinedDate: user.createdAt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      }
    });
  } catch (err) {
    console.error('[Google Auth Error]:', err);
    res.status(500).json({ error: err.message || 'Google authentication failed' });
  }
});

// OAuth Sync Route (Legacy compatibility)
app.post('/api/auth/oauth-sync', async (req, res) => {
  try {
    const { name, email, avatar, provider = 'google', googleId } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const cleanEmail = email.toLowerCase().trim();

    if (!dbConnected) {
      return res.json({
        success: true,
        user: { id: googleId || 'user-' + Date.now(), name, email: cleanEmail, avatar, provider },
      });
    }

    let user = await User.findOne({ email: cleanEmail });

    if (user) {
      user.name = name || user.name;
      user.avatar = avatar || user.avatar;
      user.provider = provider || user.provider;
      if (googleId) user.googleId = googleId;
      user.lastLogin = new Date();
      await user.save();
    } else {
      user = await User.create({
        name: name || cleanEmail.split('@')[0],
        email: cleanEmail,
        password: '',
        avatar: avatar || '🎓',
        provider: provider || 'google',
        googleId: googleId || '',
        lastLogin: new Date()
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        provider: user.provider,
        isVerified: true,
        savedBooks: user.savedBooks || [],
        joinedDate: user.createdAt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'OAuth sync failed' });
  }
});

// 2. Register Route (Direct MongoDB)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanName = (name || '').trim();
    const cleanEmail = email.toLowerCase().trim();

    if (cleanName.length < 2) {
      return res.status(400).json({ error: 'Full Name must be at least 2 characters' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    if (!dbConnected) {
      return res.json({
        success: true,
        user: {
          id: 'user-' + Date.now(),
          name: cleanName || cleanEmail.split('@')[0],
          email: cleanEmail,
          avatar: '🎓',
          provider: 'email',
          isVerified: true,
          joinedDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        },
      });
    }

    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email address already exists. Please sign in.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      name: cleanName || cleanEmail.split('@')[0],
      email: cleanEmail,
      password: hashedPassword,
      avatar: '🎓',
      provider: 'email',
      savedBooks: []
    });

    console.log(`✅ [MongoDB] New user registered: ${cleanEmail}`);

    res.status(201).json({
      success: true,
      user: {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        avatar: newUser.avatar,
        provider: 'email',
        isVerified: true,
        savedBooks: [],
        joinedDate: newUser.createdAt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      },
    });
  } catch (err) {
    console.error('[Auth Register Error]:', err);
    res.status(500).json({ error: err.message || 'Registration failed' });
  }
});

// 3. Login Route (Direct MongoDB)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanEmail = email.toLowerCase().trim();

    if (!dbConnected) {
      return res.json({
        success: true,
        user: {
          id: 'user-' + Date.now(),
          name: cleanEmail.split('@')[0] || 'Student',
          email: cleanEmail,
          avatar: '🎓',
          provider: 'email',
          isVerified: true,
          joinedDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        },
      });
    }

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.password && user.provider === 'google') {
      return res.status(400).json({ error: 'This account uses Google Sign-In. Please click "Continue with Google".' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    user.lastLogin = new Date();
    await user.save();

    console.log(`✅ [MongoDB] User logged in: ${cleanEmail}`);

    res.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        avatar: user.avatar || '🎓',
        provider: user.provider || 'email',
        isVerified: true,
        savedBooks: user.savedBooks || [],
        joinedDate: user.createdAt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      },
    });
  } catch (err) {
    console.error('[Auth Login Error]:', err);
    res.status(500).json({ error: err.message || 'Login failed' });
  }
});

// 4. Update Password Route
app.post('/api/auth/update-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: 'Email and new password (min 8 chars) are required' });
    }

    if (!dbConnected) {
      return res.json({ success: true, message: 'Password updated (demo mode)' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to update password' });
  }
});

// 5. Update Profile Details Route (Name, Avatar, Bio, Grade)
app.post('/api/auth/update-profile', async (req, res) => {
  try {
    const { email, name, avatar, bio, grade } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const cleanEmail = email.toLowerCase().trim();

    if (!dbConnected) {
      return res.json({
        success: true,
        user: { name, avatar, bio, grade },
      });
    }

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (name) user.name = name.trim();
    if (avatar) user.avatar = avatar;
    if (typeof bio === 'string') user.bio = bio;
    if (typeof grade === 'string') user.grade = grade;

    await user.save();
    console.log(`✅ [MongoDB] Profile updated for: ${cleanEmail}`);

    res.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        grade: user.grade,
        provider: user.provider,
        isVerified: true,
        savedBooks: user.savedBooks || [],
        joinedDate: user.createdAt ? user.createdAt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Recently'
      }
    });
  } catch (err) {
    console.error('[Update Profile Error]:', err);
    res.status(500).json({ error: err.message || 'Failed to update profile' });
  }
});

// Check DB Status
app.get('/api/auth/status', (req, res) => {
  res.json({
    dbConnected,
    database: 'eduvault',
    hasEnvPassword: MONGODB_URI ? !MONGODB_URI.includes('<db_password>') : false,
  });
});

/* ─── PDF Proxy LRU Cache ────────────────────────────────────────────── */
const pdfCache     = new Map();
const CACHE_MAX    = 30;

/** Fetch a URL with retry logic. Retries on ECONNRESET / socket errors. */
function fetchUrl(url, attempt = 1) {
  return new Promise((resolve, reject) => {
    const lib     = url.startsWith('https') ? https : http;
    const parsed  = new URL(url);

    const options = {
      hostname: parsed.hostname,
      port:     parsed.port || (url.startsWith('https') ? 443 : 80),
      path:     parsed.pathname + parsed.search,
      method:   'GET',
      timeout:  25000,
      agent:    url.startsWith('https') ? new https.Agent({ rejectUnauthorized: false, keepAlive: false }) : new http.Agent({ keepAlive: false }),
      headers: {
        'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
        'Accept':          'application/pdf,*/*;q=0.8',
        'Accept-Encoding': 'identity',
        'Connection':      'close',
        'Referer':         parsed.origin + '/',
      },
    };

    const req = lib.request(options, (res) => {
      // Follow redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = res.headers.location.startsWith('http')
          ? res.headers.location
          : `${parsed.origin}${res.headers.location}`;
        res.resume();
        fetchUrl(redirectUrl, attempt).then(resolve).catch(reject);
        return;
      }

      if (res.statusCode !== 200) {
        res.resume();
        reject(new Error(`Upstream returned ${res.statusCode}`));
        return;
      }

      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end',  () => resolve({
        buffer:      Buffer.concat(chunks),
        contentType: res.headers['content-type'] || 'application/pdf',
      }));
      res.on('error', (err) => {
        if ((err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT') && attempt < 3) {
          console.warn(`[Proxy] Retry ${attempt}/3 on ${url} — ${err.code}`);
          fetchUrl(url, attempt + 1).then(resolve).catch(reject);
        } else {
          reject(err);
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      if (attempt < 3) {
        console.warn(`[Proxy] Timeout retry ${attempt}/3 on ${url}`);
        fetchUrl(url, attempt + 1).then(resolve).catch(reject);
      } else {
        reject(new Error('Request timed out after 3 attempts'));
      }
    });

    req.on('error', (err) => {
      if ((err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT' || err.code === 'ENOTFOUND') && attempt < 3) {
        console.warn(`[Proxy] Socket error retry ${attempt}/3 on ${url} — ${err.code}`);
        setTimeout(() => fetchUrl(url, attempt + 1).then(resolve).catch(reject), 500 * attempt);
      } else {
        reject(err);
      }
    });

    req.end();
  });
}

/* ── /pdf/proxy ──────────────────────────────────────────────────── */
app.get('/pdf/proxy', async (req, res) => {
  const { url } = req.query;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing ?url= parameter' });
  }

  let decoded;
  try {
    decoded = decodeURIComponent(url);
    const p = new URL(decoded);
    if (!['http:', 'https:'].includes(p.protocol)) {
      return res.status(400).json({ error: 'Only http/https URLs allowed' });
    }
  } catch {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  // Cache hit
  if (pdfCache.has(decoded)) {
    const { buffer, contentType } = pdfCache.get(decoded);
    pdfCache.delete(decoded);
    pdfCache.set(decoded, { buffer, contentType });

    res.setHeader('Content-Type',   contentType);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control',  'public, max-age=86400');
    res.setHeader('X-Proxy-Cache',  'HIT');
    return res.send(buffer);
  }

  try {
    const { buffer, contentType } = await fetchUrl(decoded);

    if (pdfCache.size >= CACHE_MAX) {
      const oldestKey = pdfCache.keys().next().value;
      pdfCache.delete(oldestKey);
    }
    pdfCache.set(decoded, { buffer, contentType });

    res.setHeader('Content-Type',   contentType);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control',  'public, max-age=86400');
    res.setHeader('X-Proxy-Cache',  'MISS');
    res.send(buffer);
  } catch (err) {
    console.error(`[Proxy] ❌ Failed: ${decoded}\n  → ${err.message}`);
    res.status(502).json({
      error:   'Could not fetch PDF from the source',
      details: err.message,
      url:     decoded,
    });
  }
});

/* ── /health ─────────────────────────────────────────────────────── */
app.get('/health', (req, res) =>
  res.json({
    status: 'ok',
    cachedPDFs: pdfCache.size,
    dbConnected,
    database: 'eduvault',
    port: PORT
  })
);

app.listen(PORT, () => {
  console.log(`\n✅ EduVault Backend Server running on http://localhost:${PORT}`);
  console.log(`   /pdf/proxy?url=<encoded>  — PDF proxy`);
  console.log(`   /api/auth/login & register — MongoDB User Auth`);
  console.log(`   /health                    — Server health & DB status\n`);
});

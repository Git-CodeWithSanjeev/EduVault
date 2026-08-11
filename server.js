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
  password: { type: String, required: true },
  savedBooks: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

/* ─── User Authentication Endpoints ──────────────────────────────────── */

// Register Route
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (!dbConnected) {
      // In-memory fallback response when DB password isn't set in .env yet
      return res.json({
        success: true,
        user: {
          id: 'user-' + Date.now(),
          name: name || email.split('@')[0],
          email,
          avatar: '🎓',
          joinedDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        },
        notice: 'Registered in demo mode. Update <db_password> in .env for persistent MongoDB storage.',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      name: name || email.split('@')[0],
      email: email.toLowerCase(),
      password: hashedPassword,
    });

    res.status(201).json({
      success: true,
      user: {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        avatar: '🎓',
        joinedDate: newUser.createdAt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      },
    });
  } catch (err) {
    console.error('[Auth Register Error]:', err);
    res.status(500).json({ error: err.message || 'Registration failed' });
  }
});

// Login Route
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    if (!dbConnected) {
      // Demo login when MongoDB password isn't configured in .env yet
      return res.json({
        success: true,
        user: {
          id: 'user-' + Date.now(),
          name: email.split('@')[0] || 'Student',
          email,
          avatar: '🎓',
          joinedDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        },
        notice: 'Logged in demo mode. Update <db_password> in .env to authenticate against MongoDB eduvault cluster.',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'No account found with this email' });
    }

    if (password) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid password' });
      }
    }

    res.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        avatar: '🎓',
        joinedDate: user.createdAt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      },
    });
  } catch (err) {
    console.error('[Auth Login Error]:', err);
    res.status(500).json({ error: err.message || 'Login failed' });
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

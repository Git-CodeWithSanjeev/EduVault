/**
 * EduVault PDF Proxy Server
 * - Proxies NCERT / external PDFs server-side (no CORS)
 * - In-memory LRU cache (30 PDFs max)
 * - Auto-retry on ECONNRESET / transient errors (up to 3 attempts)
 * - Proper socket keep-alive disabled to avoid stale connection resets
 */

import express from 'express';
import https from 'https';
import http from 'http';
import cors from 'cors';

const app  = express();
const PORT = 3001;

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:4173', 'http://localhost:3000'],
  methods: ['GET', 'OPTIONS'],
}));

// In-memory LRU cache
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
      // Disable keep-alive — prevents ECONNRESET on idle sockets
      agent:    new lib.Agent({ keepAlive: false }),
      headers: {
        'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
        'Accept':          'application/pdf,*/*;q=0.8',
        'Accept-Encoding': 'identity',          // No gzip — plain bytes
        'Connection':      'close',
        'Referer':         parsed.origin + '/',
      },
    };

    const req = lib.request(options, (res) => {
      // Follow up to 3 redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = res.headers.location.startsWith('http')
          ? res.headers.location
          : `${parsed.origin}${res.headers.location}`;
        res.resume(); // Drain response body
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
    // Move to end for LRU
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

    // LRU eviction
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

/* ── /pdf/meta ───────────────────────────────────────────────────── */
app.get('/pdf/meta', (req, res) => {
  const decoded = decodeURIComponent(req.query.url || '');
  if (pdfCache.has(decoded)) {
    const { buffer, contentType } = pdfCache.get(decoded);
    return res.json({ cached: true, size: buffer.length, contentType });
  }
  res.json({ cached: false });
});

/* ── /pdf/clear-cache ────────────────────────────────────────────── */
app.get('/pdf/clear-cache', (req, res) => {
  const n = pdfCache.size;
  pdfCache.clear();
  res.json({ cleared: n });
});

/* ── /health ─────────────────────────────────────────────────────── */
app.get('/health', (req, res) =>
  res.json({ status: 'ok', cachedPDFs: pdfCache.size, port: PORT })
);

app.listen(PORT, () => {
  console.log(`\n✅ EduVault PDF Proxy  →  http://localhost:${PORT}`);
  console.log(`   /pdf/proxy?url=<encoded>   — proxy & cache any PDF`);
  console.log(`   /health                    — status\n`);
});

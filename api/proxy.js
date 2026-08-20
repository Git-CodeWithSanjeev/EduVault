import https from 'https';
import http from 'http';
import { validateUrlForSsrf } from '../services/security.js';

const MAX_PROXY_BYTES = 50 * 1024 * 1024; // 50MB max file limit

export default async function handler(req, res) {
  // CORS & Security Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url } = req.query;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing ?url= query parameter' });
  }

  let decoded;
  try {
    decoded = decodeURIComponent(url);
  } catch {
    return res.status(400).json({ error: 'Invalid URL encoding' });
  }

  // Anti-SSRF Security Validation
  const validation = validateUrlForSsrf(decoded);
  if (!validation.valid) {
    return res.status(403).json({ error: `Security check failed: ${validation.reason}` });
  }

  try {
    const fetchPDF = (targetUrl, attempt = 1) => {
      return new Promise((resolve, reject) => {
        if (attempt > 5) {
          return reject(new Error('Too many redirects (max 5)'));
        }

        const ssrfCheck = validateUrlForSsrf(targetUrl);
        if (!ssrfCheck.valid) {
          return reject(new Error(`Redirect destination blocked: ${ssrfCheck.reason}`));
        }

        const isHttps = targetUrl.startsWith('https');
        const lib = isHttps ? https : http;
        const parsed = new URL(targetUrl);

        const options = {
          hostname: parsed.hostname,
          port: parsed.port || (isHttps ? 443 : 80),
          path: parsed.pathname + parsed.search,
          method: 'GET',
          timeout: 20000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36 EduVault/1.0',
            'Accept': 'application/pdf,*/*;q=0.8',
            'Accept-Encoding': 'identity',
            'Connection': 'close',
            'Referer': parsed.origin + '/',
          },
        };

        const r = lib.request(options, (upstreamRes) => {
          if (upstreamRes.statusCode >= 300 && upstreamRes.statusCode < 400 && upstreamRes.headers.location) {
            const redirectUrl = upstreamRes.headers.location.startsWith('http')
              ? upstreamRes.headers.location
              : `${parsed.origin}${upstreamRes.headers.location}`;
            upstreamRes.resume();
            fetchPDF(redirectUrl, attempt + 1).then(resolve).catch(reject);
            return;
          }

          if (upstreamRes.statusCode !== 200) {
            upstreamRes.resume();
            reject(new Error(`Upstream returned HTTP ${upstreamRes.statusCode}`));
            return;
          }

          let totalBytes = 0;
          const chunks = [];
          upstreamRes.on('data', (c) => {
            totalBytes += c.length;
            if (totalBytes > MAX_PROXY_BYTES) {
              r.destroy();
              reject(new Error(`Payload exceeds maximum size limit of 50MB`));
              return;
            }
            chunks.push(c);
          });

          upstreamRes.on('end', () => resolve({
            buffer: Buffer.concat(chunks),
            contentType: upstreamRes.headers['content-type'] || 'application/pdf',
          }));

          upstreamRes.on('error', reject);
        });

        r.on('timeout', () => {
          r.destroy();
          if (attempt < 2) {
            fetchPDF(targetUrl, attempt + 1).then(resolve).catch(reject);
          } else {
            reject(new Error('Request to upstream timed out'));
          }
        });

        r.on('error', (err) => {
          if (attempt < 2) {
            fetchPDF(targetUrl, attempt + 1).then(resolve).catch(reject);
          } else {
            reject(err);
          }
        });

        r.end();
      });
    };

    const { buffer, contentType } = await fetchPDF(decoded);

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    return res.status(200).send(buffer);
  } catch (err) {
    console.error(`[Vercel PDF Proxy Error] ${decoded}:`, err.message);
    return res.status(502).json({ error: 'Failed to fetch document', details: err.message });
  }
}

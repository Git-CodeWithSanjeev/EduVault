import https from 'https';
import http from 'http';
import { validateUrlForSsrf } from '../services/security.js';

// Relax TLS certificate verification for educational & government endpoints
// (e.g. ncert.nic.in) whose intermediate certificates are missing from default CA stores
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const MAX_PROXY_BYTES = 50 * 1024 * 1024; // 50MB max file limit

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
  keepAlive: false,
});

export default async function handler(req, res) {
  // CORS & Security Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Range, Accept-Ranges, Content-Type, Accept, Authorization');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');
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
    const streamPDF = (targetUrl, attempt = 1) => {
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

        const headers = {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'application/pdf,application/octet-stream,text/xml,application/xml,*/*;q=0.8',
          'Accept-Encoding': 'identity',
          'Referer': parsed.origin + '/',
        };

        if (req.headers.range) {
          headers['Range'] = req.headers.range;
        }

        const options = {
          hostname: parsed.hostname,
          port: parsed.port || (isHttps ? 443 : 80),
          path: parsed.pathname + parsed.search,
          method: req.method === 'HEAD' ? 'HEAD' : 'GET',
          timeout: 25000,
          rejectUnauthorized: false,
          agent: isHttps ? httpsAgent : undefined,
          headers,
        };

        const r = lib.request(options, (upstreamRes) => {
          if (upstreamRes.statusCode >= 300 && upstreamRes.statusCode < 400 && upstreamRes.headers.location) {
            const redirectUrl = new URL(upstreamRes.headers.location, targetUrl).toString();
            upstreamRes.resume();
            streamPDF(redirectUrl, attempt + 1).then(resolve).catch(reject);
            return;
          }

          if (upstreamRes.statusCode !== 200 && upstreamRes.statusCode !== 206) {
            upstreamRes.resume();
            reject(new Error(`Upstream returned HTTP ${upstreamRes.statusCode}`));
            return;
          }

          const responseHeaders = {
            'Content-Type': upstreamRes.headers['content-type'] || 'application/pdf',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Range, Accept-Ranges, Content-Type, Accept',
            'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges',
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
          };

          if (upstreamRes.headers['content-range']) {
            responseHeaders['Content-Range'] = upstreamRes.headers['content-range'];
          }
          if (upstreamRes.headers['content-length']) {
            responseHeaders['Content-Length'] = upstreamRes.headers['content-length'];
          }

          res.writeHead(upstreamRes.statusCode, responseHeaders);

          if (req.method === 'HEAD') {
            res.end();
            return resolve();
          }

          upstreamRes.pipe(res);

          upstreamRes.on('end', () => resolve());
          upstreamRes.on('error', (err) => {
            console.error('[Stream Error]:', err.message);
            res.end();
            resolve();
          });
        });

        r.on('timeout', () => {
          r.destroy();
          if (attempt < 3) {
            streamPDF(targetUrl, attempt + 1).then(resolve).catch(reject);
          } else {
            reject(new Error('Request to upstream timed out'));
          }
        });

        r.on('error', (err) => {
          if (attempt < 3) {
            streamPDF(targetUrl, attempt + 1).then(resolve).catch(reject);
          } else {
            reject(err);
          }
        });

        r.end();
      });
    };

    await streamPDF(decoded);
  } catch (err) {
    console.error(`[Vercel PDF Proxy Error] ${decoded}:`, err.message);
    if (!res.headersSent) {
      return res.status(502).json({ error: 'Failed to fetch document', details: err.message });
    }
  }
}

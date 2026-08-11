import https from 'https';
import http from 'http';

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

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
    const parsed = new URL(decoded);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return res.status(400).json({ error: 'Only http and https protocols allowed' });
    }
  } catch {
    return res.status(400).json({ error: 'Invalid URL parameter' });
  }

  try {
    const fetchPDF = (targetUrl, attempt = 1) => {
      return new Promise((resolve, reject) => {
        const isHttps = targetUrl.startsWith('https');
        const lib = isHttps ? https : http;
        const parsed = new URL(targetUrl);

        const options = {
          hostname: parsed.hostname,
          port: parsed.port || (isHttps ? 443 : 80),
          path: parsed.pathname + parsed.search,
          method: 'GET',
          timeout: 20000,
          agent: isHttps ? new https.Agent({ rejectUnauthorized: false, keepAlive: false }) : undefined,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
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
            fetchPDF(redirectUrl, attempt).then(resolve).catch(reject);
            return;
          }

          if (upstreamRes.statusCode !== 200) {
            upstreamRes.resume();
            reject(new Error(`Upstream returned HTTP ${upstreamRes.statusCode}`));
            return;
          }

          const chunks = [];
          upstreamRes.on('data', (c) => chunks.push(c));
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
    return res.status(502).json({ error: 'Failed to fetch PDF from upstream', details: err.message });
  }
}

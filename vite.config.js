import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import https from 'https';
import http from 'http';

// Custom https Agent with TLS flexibility for government portals (ncert.nic.in)
const httpsAgent = new https.Agent({ rejectUnauthorized: false, keepAlive: true });

/**
 * Server-side stream & range-byte fetcher for fast PDF progressive loading
 */
function fetchPdfStream(targetUrl, req, res, attempt = 1) {
  if (attempt > 5) {
    res.statusCode = 502;
    return res.end(JSON.stringify({ error: 'Too many redirects' }));
  }

  try {
    const parsed = new URL(targetUrl);
    const isHttps = targetUrl.startsWith('https');
    const lib = isHttps ? https : http;

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/pdf,application/octet-stream,*/*;q=0.8',
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
      method: 'GET',
      agent: isHttps ? httpsAgent : undefined,
      headers: headers,
    };

    const proxyReq = lib.request(options, (proxyRes) => {
      // Follow 30x redirects server-side
      if (proxyRes.statusCode >= 300 && proxyRes.statusCode < 400 && proxyRes.headers.location) {
        const redirect = proxyRes.headers.location.startsWith('http')
          ? proxyRes.headers.location
          : `${parsed.origin}${proxyRes.headers.location}`;
        proxyRes.resume();
        return fetchPdfStream(redirect, req, res, attempt + 1);
      }

      if (proxyRes.statusCode !== 200 && proxyRes.statusCode !== 206) {
        proxyRes.resume();
        res.statusCode = proxyRes.statusCode || 502;
        return res.end(JSON.stringify({ error: `Upstream HTTP ${proxyRes.statusCode}` }));
      }

      const responseHeaders = {
        'Content-Type': proxyRes.headers['content-type'] || 'application/pdf',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Range, Accept-Ranges, Content-Type',
        'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges',
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=86400, immutable',
      };

      if (proxyRes.headers['content-length']) {
        responseHeaders['Content-Length'] = proxyRes.headers['content-length'];
      }
      if (proxyRes.headers['content-range']) {
        responseHeaders['Content-Range'] = proxyRes.headers['content-range'];
      }

      res.writeHead(proxyRes.statusCode || 200, responseHeaders);
      proxyRes.pipe(res);
    });

    req.on('error', () => {
      proxyReq.destroy();
    });

    proxyReq.on('error', (err) => {
      console.error(`[Vite PDF Proxy Error] Attempt ${attempt}:`, err.message);
      if (!res.headersSent) {
        res.statusCode = 502;
        res.end(JSON.stringify({ error: 'Proxy request failed', details: err.message }));
      }
    });

    proxyReq.end();
  } catch (err) {
    if (!res.headersSent) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: 'Invalid URL' }));
    }
  }
}

/**
 * Custom Vite Plugin to proxy PDF requests during development (npm run dev).
 */
function pdfDevProxyPlugin() {
  return {
    name: 'pdf-dev-proxy-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url.startsWith('/api/proxy') || req.url.startsWith('/pdf/proxy')) {
          const rawUrl = req.url.split('?')[1] || '';
          const urlParams = new URLSearchParams(rawUrl);
          const targetUrl = urlParams.get('url');

          if (!targetUrl) {
            res.statusCode = 400;
            return res.end(JSON.stringify({ error: 'Missing url parameter' }));
          }

          fetchPdfStream(targetUrl, req, res);
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), pdfDevProxyPlugin()],
});

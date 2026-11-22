import https from 'https';
import http from 'http';
import { validateUrlForSsrf } from '@/lib/security';

const pdfCache = new Map();
const CACHE_MAX = 50;

export { validateUrlForSsrf };

/** Fetch a URL with retry logic. Retries on ECONNRESET / socket errors. */
export function fetchUrl(url, attempt = 1) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const parsed = new URL(url);

    const options = {
      hostname: parsed.hostname,
      port: parsed.port || (url.startsWith('https') ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: 'GET',
      timeout: 25000,
      rejectUnauthorized: false,
      agent: url.startsWith('https')
        ? new https.Agent({ rejectUnauthorized: false, keepAlive: false })
        : new http.Agent({ keepAlive: false }),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
        'Accept': 'application/pdf,*/*;q=0.8',
        'Accept-Encoding': 'identity',
        'Connection': 'close',
        'Referer': parsed.origin + '/',
      },
    };

    const req = lib.request(options, (res) => {
      // Follow redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = new URL(res.headers.location, url).toString();
        res.resume();
        fetchUrl(redirectUrl, attempt).then(resolve).catch(reject);
        return;
      }

      if (res.statusCode !== 200) {
        res.resume();
        if (res.statusCode === 404 && url.includes('r2.dev/ncert/')) {
          const filename = url.split('/').pop();
          if (filename && filename.endsWith('.pdf')) {
            const fallbackNcert = `https://ncert.nic.in/textbook/pdf/${filename}`;
            console.log(`[Next.js PDF Proxy] R2 404 for ${filename}. Transparently falling back to NCERT: ${fallbackNcert}`);
            return fetchUrl(fallbackNcert, attempt).then(resolve).catch(reject);
          }
        }
        reject(new Error(`Upstream returned ${res.statusCode}`));
        return;
      }

      // Check for 0-byte or corrupted stubs from R2
      const rawContentLength = res.headers['content-length'];
      const parsedLength = rawContentLength !== undefined ? parseInt(rawContentLength, 10) : null;
      if (parsedLength !== null && parsedLength < 500 && url.includes('r2.dev/ncert/')) {
        res.resume();
        const filename = url.split('/').pop();
        if (filename && filename.endsWith('.pdf')) {
          const fallbackNcert = `https://ncert.nic.in/textbook/pdf/${filename}`;
          console.warn(`[Next.js PDF Proxy] R2 returned corrupt/empty (${parsedLength}b) for ${filename}. Transparently falling back to NCERT: ${fallbackNcert}`);
          return fetchUrl(fallbackNcert, attempt).then(resolve).catch(reject);
        }
      }

      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);

        // Magic bytes verification: Valid PDFs must start with %PDF
        const isPdfMagic = buffer.length >= 4 && buffer.slice(0, 4).toString('ascii') === '%PDF';
        if (!isPdfMagic) {
          if (url.includes('r2.dev/ncert/')) {
            const filename = url.split('/').pop();
            if (filename && filename.endsWith('.pdf')) {
              const fallbackNcert = `https://ncert.nic.in/textbook/pdf/${filename}`;
              console.warn(`[Next.js PDF Proxy] Non-PDF header received for ${filename}. Falling back to NCERT: ${fallbackNcert}`);
              return fetchUrl(fallbackNcert, attempt).then(resolve).catch(reject);
            }
          }
          return reject(new Error('Payload received is not a valid PDF document (missing %PDF signature)'));
        }

        resolve({
          buffer,
          contentType: res.headers['content-type'] || 'application/pdf',
        });
      });
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

export async function getCachedOrFetchPdf(decodedUrl) {
  if (pdfCache.has(decodedUrl)) {
    const { buffer, contentType } = pdfCache.get(decodedUrl);
    pdfCache.delete(decodedUrl);
    pdfCache.set(decodedUrl, { buffer, contentType });
    return { buffer, contentType, cached: true };
  }

  const { buffer, contentType } = await fetchUrl(decodedUrl);
  if (pdfCache.size >= CACHE_MAX) {
    const oldestKey = pdfCache.keys().next().value;
    pdfCache.delete(oldestKey);
  }
  pdfCache.set(decodedUrl, { buffer, contentType });
  return { buffer, contentType, cached: false };
}

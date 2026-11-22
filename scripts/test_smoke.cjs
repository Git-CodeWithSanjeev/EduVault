const http = require('http');

async function test(path, method = 'GET', body = null, headers = {}) {
  return new Promise((resolve) => {
    const req = http.request('http://localhost:3000' + path, {
      method,
      headers: {
        'Accept': '*/*',
        ...(body ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } : {}),
        ...headers
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          path,
          status: res.statusCode,
          type: res.headers['content-type'],
          length: data.length,
          data
        });
      });
    });
    req.on('error', err => resolve({ path, error: err.message }));
    if (body) req.write(body);
    req.end();
  });
}

(async () => {
  const resourceRes = await test('/resource/ncert-fess2');
  const titleMatch = resourceRes.data.match(/<title>([^<]+)<\/title>/);
  const ogTitleMatch = resourceRes.data.match(/<meta property="og:title" content="([^"]+)"/);
  const ogDescMatch = resourceRes.data.match(/<meta property="og:description" content="([^"]+)"/);

  console.log('--- SSR METADATA CHECK ---');
  console.log('Title:', titleMatch ? titleMatch[1] : 'Not found');
  console.log('og:title:', ogTitleMatch ? ogTitleMatch[1] : 'Not found');
  console.log('og:description:', ogDescMatch ? ogDescMatch[1] : 'Not found');
})();

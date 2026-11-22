import { NextResponse } from 'next/server';
import { validateUrlForSsrf, getCachedOrFetchPdf } from '@/lib/pdfProxy';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get('url');

  if (!rawUrl) {
    return NextResponse.json({ error: 'Missing ?url= parameter' }, { status: 400 });
  }

  let decoded;
  try {
    decoded = decodeURIComponent(rawUrl);
  } catch {
    return NextResponse.json({ error: 'Invalid URL encoding' }, { status: 400 });
  }

  const validation = validateUrlForSsrf(decoded);
  if (!validation.valid) {
    return NextResponse.json({ error: `Security check failed: ${validation.reason}` }, { status: 403 });
  }

  try {
    const { buffer, contentType, cached } = await getCachedOrFetchPdf(decoded);

    const range = request.headers.get('range');
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : buffer.length - 1;
      const chunksize = end - start + 1;
      const sliced = buffer.subarray(start, end + 1);

      return new Response(sliced, {
        status: 206,
        headers: {
          'Content-Type': contentType,
          'Content-Range': `bytes ${start}-${end}/${buffer.length}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': String(chunksize),
          'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
          'X-Proxy-Cache': cached ? 'HIT' : 'MISS',
        },
      });
    }

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(buffer.length),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
        'X-Proxy-Cache': cached ? 'HIT' : 'MISS',
      },
    });
  } catch (err) {
    console.error(`[API Proxy] Failed to fetch ${decoded}:`, err.message);
    return NextResponse.json(
      { error: 'Could not fetch PDF from source', details: err.message, url: decoded },
      { status: 502 }
    );
  }
}

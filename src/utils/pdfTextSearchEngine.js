/**
 * High-Performance Client-Side PDF Text Search Engine using PDF.js
 * Extracts page text content and caches search index per PDF document URL.
 */

const pdfTextCache = new Map();

/**
 * Extract all text content from PDF document pages
 */
export async function getPdfTextIndex(pdfDoc, url) {
  if (!pdfDoc) return [];
  if (url && pdfTextCache.has(url)) {
    return pdfTextCache.get(url);
  }

  const numPages = pdfDoc.numPages;
  const pageTexts = [];

  for (let i = 1; i <= numPages; i++) {
    try {
      const page = await pdfDoc.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map((item) => item.str);
      const text = strings.join(' ');
      pageTexts.push({ pageNum: i, text, items: content.items });
    } catch (err) {
      console.warn(`Failed to extract text from PDF page ${i}:`, err);
      pageTexts.push({ pageNum: i, text: '', items: [] });
    }
  }

  if (url) {
    pdfTextCache.set(url, pageTexts);
  }
  return pageTexts;
}

/**
 * Perform Full-Text Search on a loaded PDF document
 */
export async function searchPdfDocument(pdfDoc, url, query) {
  if (!pdfDoc || !query || !query.trim()) return [];
  const q = query.toLowerCase().trim();
  const index = await getPdfTextIndex(pdfDoc, url);
  const results = [];

  index.forEach(({ pageNum, text }) => {
    if (!text) return;
    const lowerText = text.toLowerCase();
    let startIndex = 0;

    while (startIndex < lowerText.length) {
      const matchIndex = lowerText.indexOf(q, startIndex);
      if (matchIndex === -1) break;

      // Extract a surrounding text snippet (approx 40 chars before & after)
      const snippetStart = Math.max(0, matchIndex - 40);
      const snippetEnd = Math.min(text.length, matchIndex + q.length + 50);
      const rawSnippet = text.slice(snippetStart, snippetEnd);

      const prefix = snippetStart > 0 ? '…' : '';
      const suffix = snippetEnd < text.length ? '…' : '';

      results.push({
        id: `match_${pageNum}_${matchIndex}`,
        pageNum,
        snippet: `${prefix}${rawSnippet}${suffix}`,
        matchIndex,
      });

      startIndex = matchIndex + q.length;
    }
  });

  return results;
}

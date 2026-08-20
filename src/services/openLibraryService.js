/**
 * Open Library Live Discovery & Search Service
 * API Docs: https://openlibrary.org/dev/docs/api/
 */

const CACHE = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function getCached(key) {
  const item = CACHE.get(key);
  if (!item) return null;
  if (Date.now() - item.time > CACHE_TTL_MS) {
    CACHE.delete(key);
    return null;
  }
  return item.data;
}

function setCache(key, data) {
  CACHE.set(key, { time: Date.now(), data });
}

/**
 * Format raw Open Library Search Doc into EduVault Book Item format
 */
export function formatOpenLibraryDoc(doc) {
  const workKey = doc.key ? doc.key.replace('/works/', '') : '';
  const id = `openlib-${workKey || (doc.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30)}`;
  const coverId = doc.cover_i;
  const isbn = Array.isArray(doc.isbn) ? doc.isbn[0] : doc.isbn;
  
  let coverUrl = null;
  if (coverId) {
    coverUrl = `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
  } else if (isbn) {
    coverUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
  }

  const authors = Array.isArray(doc.author_name) ? doc.author_name.join(', ') : (doc.author_name || 'Various Authors');
  const subject = Array.isArray(doc.subject) && doc.subject.length > 0 ? doc.subject[0] : 'General';
  const firstYear = doc.first_publish_year || doc.publish_year?.[0] || '';
  const iaId = Array.isArray(doc.ia) ? doc.ia[0] : (doc.ia || null);

  return {
    id,
    title: doc.title || 'Untitled Work',
    source: 'Open Library',
    subject: subject,
    level: 'All levels',
    type: 'Open Access eBook',
    license: 'Public Domain / Open Access',
    category: 'Open Educational Resources',
    url: doc.key ? `https://openlibrary.org${doc.key}` : `https://openlibrary.org/search?q=${encodeURIComponent(doc.title || '')}`,
    pdfUrl: iaId ? `https://archive.org/download/${iaId}/${iaId}.pdf` : null,
    readUrl: iaId ? `https://archive.org/embed/${iaId}` : (doc.key ? `https://openlibrary.org${doc.key}` : null),
    iaId,
    coverUrl,
    coverId,
    description: doc.subtitle 
      ? `${doc.subtitle}. Published by ${authors}${firstYear ? ` (${firstYear})` : ''}. Explore millions of free editions on Open Library.`
      : `Classic work by ${authors}${firstYear ? ` (${firstYear})` : ''}. Digitized and preserved on the Open Library and Internet Archive.`,
    authors,
    firstPublishYear: firstYear,
    ratingsAverage: doc.ratings_average ? Number(doc.ratings_average).toFixed(1) : null,
  };
}

/**
 * Search Open Library live for any query
 */
export async function searchOpenLibrary(query, page = 1, limit = 20) {
  const q = (query || '').trim();
  if (!q) return { docs: [], total: 0 };

  const cacheKey = `search_${q.toLowerCase()}_${page}_${limit}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&page=${page}&limit=${limit}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Open Library API error: ${res.status}`);
    }
    const data = await res.json();
    const formatted = (data.docs || []).map(formatOpenLibraryDoc);
    const result = {
      docs: formatted,
      total: data.numFound || formatted.length,
      start: data.start || 0,
    };
    setCache(cacheKey, result);
    return result;
  } catch (err) {
    console.warn('[Open Library API Search Notice]:', err.message);
    return { docs: [], total: 0, error: err.message };
  }
}

/**
 * Fetch books from Open Library by subject slug
 * e.g. "computer_science", "physics", "mathematics", "history", "philosophy", "classic_literature"
 */
export async function fetchOpenLibrarySubject(subjectSlug, limit = 24, offset = 0) {
  const slug = (subjectSlug || 'science').toLowerCase().replace(/\s+/g, '_');
  const cacheKey = `subj_${slug}_${limit}_${offset}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://openlibrary.org/subjects/${slug}.json?limit=${limit}&offset=${offset}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Open Library Subject API error: ${res.status}`);
    }
    const data = await res.json();
    const works = (data.works || []).map(w => {
      const coverId = w.cover_id;
      const coverUrl = coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : null;
      const authors = Array.isArray(w.authors) ? w.authors.map(a => a.name).join(', ') : 'Various Authors';
      const iaId = w.ia || null;
      const workKey = w.key ? w.key.replace('/works/', '') : '';

      return {
        id: `openlib-${workKey || w.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30)}`,
        title: w.title,
        source: 'Open Library',
        subject: data.name || subjectSlug,
        level: 'All levels',
        type: 'Open Access eBook',
        license: 'Public Domain / Open Access',
        category: 'Open Educational Resources',
        url: w.key ? `https://openlibrary.org${w.key}` : `https://openlibrary.org/subjects/${slug}`,
        pdfUrl: iaId ? `https://archive.org/download/${iaId}/${iaId}.pdf` : null,
        readUrl: iaId ? `https://archive.org/embed/${iaId}` : (w.key ? `https://openlibrary.org${w.key}` : null),
        iaId,
        coverUrl,
        coverId,
        description: `Preserved in the Internet Archive digital collection. Author(s): ${authors}${w.first_publish_year ? ` (${w.first_publish_year})` : ''}.`,
        authors,
        firstPublishYear: w.first_publish_year || '',
      };
    });

    const result = {
      works,
      workCount: data.work_count || works.length,
      name: data.name,
    };
    setCache(cacheKey, result);
    return result;
  } catch (err) {
    console.warn('[Open Library Subject API Notice]:', err.message);
    return { works: [], workCount: 0, error: err.message };
  }
}

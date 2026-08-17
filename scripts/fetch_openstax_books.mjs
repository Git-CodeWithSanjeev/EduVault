import { writeFileSync } from 'fs';

async function fetchOpenStaxBooks() {
  console.log('Fetching OpenStax catalog and CMS page data...');
  const [booksRes, pagesRes] = await Promise.all([
    fetch('https://openstax.org/apps/cms/api/books/?format=json'),
    fetch('https://openstax.org/apps/cms/api/v2/pages/?type=books.Book&limit=200&fields=title,description,authors,slug')
  ]);

  const booksData = await booksRes.json();
  const pagesData = await pagesRes.json();

  const pagesMap = new Map();
  pagesData.items.forEach((p) => pagesMap.set(p.id, p));

  function cleanHtml(html) {
    if (!html) return '';
    const text = html
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (text.length <= 170) return text;
    const truncated = text.slice(0, 170);
    const lastSpace = truncated.lastIndexOf(' ');
    return (lastSpace > 80 ? truncated.slice(0, lastSpace) : truncated) + '…';
  }


  function mapCategory(subjects = [], cats = []) {
    const s = [...subjects, ...cats].join(' ').toLowerCase();
    if (s.includes('computer science') || s.includes('python') || s.includes('technology') || s.includes('manufacturing')) {
      return 'Computer Science & IT';
    }
    if (s.includes('nursing') || s.includes('anatomy') || s.includes('medical') || s.includes('health') || s.includes('nutrition') || s.includes('pharmacology')) {
      return 'Medical';
    }
    if (s.includes('business') || s.includes('accounting') || s.includes('finance') || s.includes('management') || s.includes('marketing') || s.includes('economics')) {
      return 'Commerce & Management';
    }
    if (s.includes('history') || s.includes('government') || s.includes('philosophy') || s.includes('political') || s.includes('sociology') || s.includes('psychology') || s.includes('writing') || s.includes('anthropology') || s.includes('humanities')) {
      return 'Arts & Humanities';
    }
    if (s.includes('college success')) {
      return 'Skill Development';
    }
    return 'Science';
  }

  function mapSubject(subjects = [], cats = []) {
    if (subjects.length > 0) return subjects[0];
    if (cats.length > 0) return cats[0];
    return 'General';
  }

  const openstaxBooks = booksData.books.map((b) => {
    const detail = pagesMap.get(b.id) || {};
    const authorsArr = (detail.authors || [])
      .map((a) => {
        if (!a.value) return '';
        if (typeof a.value === 'string') return a.value;
        return a.value.name || `${a.value.first_name || ''} ${a.value.last_name || ''}`.trim();
      })
      .filter(Boolean);

    const slugClean = (b.slug || '').replace(/^books\//, '');
    const webUrl = b.webview_rex_link || b.webview_link || `https://openstax.org/details/books/${slugClean}`;
    const pdfUrl = b.pdf_url || b.high_resolution_pdf_url || '';

    return {
      id: `openstax-${b.id}`,
      title: b.title,
      source: 'OpenStax',
      subject: mapSubject(b.subjects, b.subject_categories),
      level: b.is_hs || b.is_ap ? 'High School / AP' : 'Undergraduate',
      type: 'Open textbook',
      license: 'CC BY 4.0',
      category: mapCategory(b.subjects, b.subject_categories),
      url: webUrl,
      pdfUrl: pdfUrl,
      coverUrl: b.cover_url || '',
      description: cleanHtml(detail.description) || `${b.title} open-access textbook from OpenStax.`,
      authors: authorsArr.length > 0 ? authorsArr.join(', ') : 'OpenStax Contributor Team',
      bookState: b.book_state,
    };
  });

  const fileContent = `// Auto-generated OpenStax textbook catalog (${openstaxBooks.length} books)
// Source: https://openstax.org/subjects
export const OPENSTAX_INDEX = "https://openstax.org/subjects";

export const openstaxBooks = ${JSON.stringify(openstaxBooks, null, 2)};
`;

  writeFileSync('./src/openstaxBooks.js', fileContent, 'utf8');
  console.log(`Successfully generated ./src/openstaxBooks.js with ${openstaxBooks.length} books!`);
}

fetchOpenStaxBooks().catch(console.error);

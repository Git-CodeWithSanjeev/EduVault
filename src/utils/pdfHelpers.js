/**
 * PDF Chapter & URL Generator Utilities
 */

export const NCERT_CHAPTER_COUNTS = {
  lech1: 5, // Class 12 Chemistry Part 1
  lech2: 5, // Class 12 Chemistry Part 2
  leph1: 8, // Class 12 Physics Part 1
  leph2: 6, // Class 12 Physics Part 2
  lemh1: 6, // Class 12 Math Part 1
  lemh2: 7, // Class 12 Math Part 2
  kech1: 6, // Class 11 Chemistry Part 1
  kech2: 3, // Class 11 Chemistry Part 2
  kepy1: 7, // Class 11 Physics Part 1
  kepy2: 7, // Class 11 Physics Part 2
  kemh1: 14, // Class 11 Math
  jebh1: 5, // Class 12 Biology
  kebo1: 19, // Class 11 Biology
};

/** Generate the list of chapter PDF URLs for an NCERT book */
export function getChapterPdfUrls(book) {
  if (!book) return [];

  if (book.source === 'NCERT' && book.url) {
    const match = book.url.match(/\/pdf\/([a-z0-9]+)dd\.zip/i);
    const code = match ? match[1].toLowerCase() : null;

    if (code) {
      const count = NCERT_CHAPTER_COUNTS[code] || 6;
      const list = [
        { id: 'ps', name: '0. Prelims & Index', pdfUrl: `https://ncert.nic.in/textbook/pdf/${code}ps.pdf` },
      ];

      for (let i = 1; i <= count; i++) {
        const numStr = String(i).padStart(2, '0');
        list.push({
          id: numStr,
          name: `${i}. Chapter ${i}`,
          pdfUrl: `https://ncert.nic.in/textbook/pdf/${code}${numStr}.pdf`,
        });
      }

      list.push({
        id: 'an',
        name: `${count + 1}. Answers & Solutions`,
        pdfUrl: `https://ncert.nic.in/textbook/pdf/${code}an.pdf`,
      });

      return list;
    }
  }

  return [
    { id: 'full', name: `${book.title} (Full PDF)`, pdfUrl: book.pdfUrl || book.url },
  ];
}

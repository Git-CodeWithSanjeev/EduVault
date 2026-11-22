/**
 * PDF Chapter & URL Generator Utilities
 */

import { NCERT_FULL_CHAPTER_NAMES, NCERT_FULL_CHAPTER_COUNTS } from '../data/ncertCatalogData.js';
import { getEnv } from './env.js';

export const NCERT_CHAPTER_COUNTS = {
  ...NCERT_FULL_CHAPTER_COUNTS,
  aemr1: 9, // Class 1 English Mridang
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
  jesc1: 13, // Class 10 Science
  jemh1: 14, // Class 10 Math
};

export const NCERT_CHAPTER_NAMES = {
  ...NCERT_FULL_CHAPTER_NAMES,
  aemr1: [
    'Two Little Hands',
    'Greetings',
    'Picture Reading',
    'The Cap-seller and the Monkeys',
    'A Bell for the Cat',
    'The Ant and the Dove',
    'Catch Me if You Can',
    'The Clever Chick',
    'We Love Our School',
  ],
  leph1: [
    'Electric Charges and Fields',
    'Electrostatic Potential and Capacitance',
    'Current Electricity',
    'Moving Charges and Magnetism',
    'Magnetism and Matter',
    'Electromagnetic Induction',
    'Alternating Current',
    'Electromagnetic Waves',
  ],
  leph2: [
    'Ray Optics and Optical Instruments',
    'Wave Optics',
    'Dual Nature of Radiation and Matter',
    'Atoms',
    'Nuclei',
    'Semiconductor Electronics: Materials, Devices and Simple Circuits',
  ],
  lech1: [
    'Solutions',
    'Electrochemistry',
    'Chemical Kinetics',
    'The d- and f-Block Elements',
    'Coordination Compounds',
  ],
  lech2: [
    'Haloalkanes and Haloarenes',
    'Alcohols, Phenols and Ethers',
    'Aldehydes, Ketones and Carboxylic Acids',
    'Amines',
    'Biomolecules',
  ],
  lemh1: [
    'Relations and Functions',
    'Inverse Trigonometric Functions',
    'Matrices',
    'Determinants',
    'Continuity and Differentiability',
    'Application of Derivatives',
  ],
  lemh2: [
    'Integrals',
    'Application of Integrals',
    'Differential Equations',
    'Vector Algebra',
    'Three Dimensional Geometry',
    'Linear Programming',
    'Probability',
  ],
  kepy1: [
    'Units and Measurements',
    'Motion in a Straight Line',
    'Motion in a Plane',
    'Laws of Motion',
    'Work, Energy and Power',
    'System of Particles and Rotational Motion',
    'Gravitation',
  ],
  kepy2: [
    'Mechanical Properties of Solids',
    'Mechanical Properties of Fluids',
    'Thermal Properties of Matter',
    'Thermodynamics',
    'Kinetic Theory',
    'Oscillations',
    'Waves',
  ],
  kech1: [
    'Some Basic Concepts of Chemistry',
    'Structure of Atom',
    'Classification of Elements and Periodicity in Properties',
    'Chemical Bonding and Molecular Structure',
    'Chemical Thermodynamics',
    'Equilibrium',
  ],
  kech2: [
    'Redox Reactions',
    'Organic Chemistry: Some Basic Principles and Techniques',
    'Hydrocarbons',
  ],
  kemh1: [
    'Sets',
    'Relations and Functions',
    'Trigonometric Functions',
    'Complex Numbers and Quadratic Equations',
    'Linear Inequalities',
    'Permutations and Combinations',
    'Binomial Theorem',
    'Sequences and Series',
    'Straight Lines',
    'Conic Sections',
    'Introduction to Three Dimensional Geometry',
    'Limits and Derivatives',
    'Statistics',
    'Probability',
  ],
  jebh1: [
    'Sexual Reproduction in Flowering Plants',
    'Human Reproduction',
    'Reproductive Health',
    'Principles of Inheritance and Variation',
    'Molecular Basis of Inheritance',
  ],
};

const CLOUD_R2_BASE = (getEnv('R2_PUBLIC_URL', 'https://pub-54ce43e6ab02460299838f807b567083.r2.dev')).replace(/\/+$/, '');

/** Generate the list of chapter PDF URLs mapped directly to Cloudflare R2 */
export function getChapterPdfUrls(book) {
  if (!book) return [];

  const R2_BASE = CLOUD_R2_BASE;

  // 1. If book already has real structured chapters
  if (Array.isArray(book.chapters) && book.chapters.length > 0) {
    return book.chapters.map((ch) => {
      const fileName = ch.pdfUrl ? ch.pdfUrl.split('/').pop() : `${ch.id}.pdf`;
      const cloudUrl = ch.cloudUrl || `${R2_BASE}/ncert/${book.code || ''}/${fileName}`;
      return {
        ...ch,
        pdfUrl: proxyUrl(cloudUrl),
        cloudUrl: cloudUrl,
        proxyUrl: proxyUrl(cloudUrl),
      };
    });
  }

  // 2. Derive from NCERT code mapped directly to Cloudflare R2
  if (book.source === 'NCERT' && (book.url || book.code)) {
    const match = book.url ? book.url.match(/\/pdf\/([a-z0-9]+)dd\.zip/i) : null;
    const code = match ? match[1].toLowerCase() : (book.code ? book.code.toLowerCase() : null);

    if (code) {
      const allCounts = { ...NCERT_FULL_CHAPTER_COUNTS, ...NCERT_CHAPTER_COUNTS };
      const allNames = { ...NCERT_FULL_CHAPTER_NAMES, ...NCERT_CHAPTER_NAMES };
      const count = allCounts[code] || (allNames[code]?.length) || 6;
      const namesList = allNames[code] || [];
      const prelimUrl = `${R2_BASE}/ncert/${code}/${code}ps.pdf`;
      const list = [
        {
          id: 'ps',
          name: '0. Prelims & Index',
          pdfUrl: proxyUrl(prelimUrl),
          cloudUrl: prelimUrl,
          proxyUrl: proxyUrl(prelimUrl),
        },
      ];

      for (let i = 1; i <= count; i++) {
        const numStr = String(i).padStart(2, '0');
        const chapterTitle = namesList[i - 1] ? `${i}. ${namesList[i - 1]}` : `${i}. Chapter ${i}`;
        const chapterUrl = `${R2_BASE}/ncert/${code}/${code}${numStr}.pdf`;
        list.push({
          id: numStr,
          name: chapterTitle,
          pdfUrl: proxyUrl(chapterUrl),
          cloudUrl: chapterUrl,
          proxyUrl: proxyUrl(chapterUrl),
        });
      }

      const answerUrl = `${R2_BASE}/ncert/${code}/${code}an.pdf`;
      list.push({
        id: 'an',
        name: `${count + 1}. Answers & Solutions`,
        pdfUrl: proxyUrl(answerUrl),
        cloudUrl: answerUrl,
        proxyUrl: proxyUrl(answerUrl),
      });

      return list;
    }
  }

  const fallbackUrl = book.cloudUrl || book.pdfUrl || book.url;
  return [
    { id: 'full', name: `${book.title} (Full PDF)`, pdfUrl: proxyUrl(fallbackUrl), cloudUrl: fallbackUrl, proxyUrl: proxyUrl(fallbackUrl) },
  ];
}

const PROXY_BASE = getEnv('PROXY_URL', '/api/pdf');

export function proxyUrl(originalUrl) {
  if (!originalUrl) return '';
  if (
    originalUrl.startsWith('/api/pdf') ||
    originalUrl.startsWith('/api/proxy') ||
    originalUrl.startsWith('/pdf/proxy')
  ) {
    return originalUrl;
  }
  // Relative or blob URLs don't need proxying
  if (originalUrl.startsWith('blob:') || originalUrl.startsWith('data:') || originalUrl.startsWith('/')) {
    return originalUrl;
  }
  return `${PROXY_BASE}?url=${encodeURIComponent(originalUrl)}`;
}


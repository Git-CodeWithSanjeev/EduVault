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

export const NCERT_CHAPTER_NAMES = {
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

/** Generate the list of chapter PDF URLs for an NCERT book */
export function getChapterPdfUrls(book) {
  if (!book) return [];

  const R2_BASE = (import.meta.env.VITE_R2_PUBLIC_URL || '').replace(/\/+$/, '');

  if (book.source === 'NCERT' && book.url) {
    const match = book.url.match(/\/pdf\/([a-z0-9]+)dd\.zip/i);
    const code = match ? match[1].toLowerCase() : null;

    if (code) {
      const count = NCERT_CHAPTER_COUNTS[code] || 6;
      const namesList = NCERT_CHAPTER_NAMES[code] || [];
      const list = [
        {
          id: 'ps',
          name: '0. Prelims & Index',
          pdfUrl: `https://ncert.nic.in/textbook/pdf/${code}ps.pdf`,
          cloudUrl: R2_BASE ? `${R2_BASE}/ncert/${code}/${code}ps.pdf` : null,
        },
      ];

      for (let i = 1; i <= count; i++) {
        const numStr = String(i).padStart(2, '0');
        const chapterTitle = namesList[i - 1] ? `${i}. ${namesList[i - 1]}` : `${i}. Chapter ${i}`;
        list.push({
          id: numStr,
          name: chapterTitle,
          pdfUrl: `https://ncert.nic.in/textbook/pdf/${code}${numStr}.pdf`,
          cloudUrl: R2_BASE ? `${R2_BASE}/ncert/${code}/${code}${numStr}.pdf` : null,
        });
      }

      list.push({
        id: 'an',
        name: `${count + 1}. Answers & Solutions`,
        pdfUrl: `https://ncert.nic.in/textbook/pdf/${code}an.pdf`,
        cloudUrl: R2_BASE ? `${R2_BASE}/ncert/${code}/${code}an.pdf` : null,
      });

      return list;
    }
  }

  return [
    { id: 'full', name: `${book.title} (Full PDF)`, pdfUrl: book.pdfUrl || book.url },
  ];
}

const PROXY_BASE = import.meta.env.VITE_PROXY_URL || '/api/proxy';

export function proxyUrl(originalUrl) {
  if (!originalUrl) return '';
  if (originalUrl.startsWith('/api/proxy') || originalUrl.startsWith('/pdf/proxy')) return originalUrl;
  return `${PROXY_BASE}?url=${encodeURIComponent(originalUrl)}`;
}


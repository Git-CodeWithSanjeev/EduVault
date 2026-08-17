import { NCERT_INDEX, ncertBooks } from '../ncertBooks';
import { openstaxBooks } from '../openstaxBooks';


export const otherItems = [
  {
    id: 'ncert-catalog',
    title: 'NCERT Textbook Catalog (Classes I–XII)',
    source: 'NCERT',
    subject: 'All subjects',
    level: 'Classes 1–12',
    type: 'Official catalog',
    license: 'Official',
    category: 'Board Books',
    url: NCERT_INDEX,
    description: 'Official NCERT index to browse and download textbooks by class and subject.',
  },
  {
    id: 'biology',
    title: 'Biology 2e',
    source: 'OpenStax',
    subject: 'Biology',
    level: 'Undergraduate',
    type: 'Open textbook',
    license: 'CC BY-NC-SA 4.0',
    category: 'Science',
    url: 'https://openstax.org/details/books/biology-2e',
    description: 'Peer-reviewed biology textbook in web and PDF formats.',
  },
  {
    id: 'chemistry',
    title: 'Chemistry 2e',
    source: 'OpenStax',
    subject: 'Chemistry',
    level: 'Undergraduate',
    type: 'Open textbook',
    license: 'CC BY-NC-SA 4.0',
    category: 'Science',
    url: 'https://openstax.org/details/books/chemistry-2e',
    description: 'General chemistry with examples and practice.',
  },
  {
    id: 'physics',
    title: 'College Physics 2e',
    source: 'OpenStax',
    subject: 'Physics',
    level: 'Undergraduate',
    type: 'Open textbook',
    license: 'CC BY-NC-SA 4.0',
    category: 'Science',
    url: 'https://openstax.org/details/books/college-physics-2e',
    description: 'Algebra-based physics textbook.',
  },
  {
    id: 'swayam',
    title: 'SWAYAM Free University Courses',
    source: 'SWAYAM',
    subject: 'All subjects',
    level: 'All levels',
    type: 'Video courses',
    license: 'Official',
    category: 'Undergraduate (UG)',
    url: 'https://www.swayam.gov.in/',
    description: 'Government platform with free university courses.',
  },
  // Computer Science & IT
  {
    id: 'python-openstax',
    title: 'Introduction to Python Programming',
    source: 'OpenStax',
    subject: 'Computer Science',
    level: 'Undergraduate',
    type: 'Open textbook',
    license: 'CC BY 4.0',
    category: 'Computer Science & IT',
    url: 'https://openstax.org/details/books/introduction-python-programming',
    description: 'Complete introductory course to computer science and programming in Python.',
  },
  {
    id: 'cs50-harvard',
    title: 'CS50: Introduction to Computer Science',
    source: 'Harvard / edX',
    subject: 'Computer Science',
    level: 'Undergraduate',
    type: 'Open Courseware',
    license: 'Open License',
    category: 'Computer Science & IT',
    url: 'https://cs50.harvard.edu/x/',
    description: 'Harvard University entry-level course on algorithms, data structures, and computer science fundamentals.',
  },
  {
    id: 'sicp-mit',
    title: 'Structure & Interpretation of Computer Programs (SICP)',
    source: 'MIT Press',
    subject: 'Computer Science',
    level: 'Postgraduate',
    type: 'Open textbook',
    license: 'CC BY-NC 4.0',
    category: 'Computer Science & IT',
    url: 'https://mitp-content-server.mit.edu/books/content/sectbyfn/books_pres_0/6515/sicp.html',
    description: 'Classic MIT foundational text on software engineering and functional programming principles.',
  },

  // Engineering
  {
    id: 'nptel-engg',
    title: 'NPTEL Engineering Open Courseware Archive',
    source: 'NPTEL / IITs',
    subject: 'Engineering',
    level: 'Undergraduate',
    type: 'Video courses',
    license: 'CC BY-SA 4.0',
    category: 'Engineering',
    url: 'https://nptel.ac.in/',
    description: 'Free engineering lecture videos and course materials from top Indian Institutes of Technology (IITs).',
  },
  {
    id: 'university-physics',
    title: 'University Physics Volume 1 & 2',
    source: 'OpenStax',
    subject: 'Engineering Physics',
    level: 'Undergraduate',
    type: 'Open textbook',
    license: 'CC BY 4.0',
    category: 'Engineering',
    url: 'https://openstax.org/details/books/university-physics-volume-1',
    description: 'Calculus-based physics textbook tailored for engineering and physical science majors.',
  },

  // Medical & Health
  {
    id: 'anatomy-phys',
    title: 'Anatomy and Physiology 2e',
    source: 'OpenStax',
    subject: 'Medical',
    level: 'Undergraduate',
    type: 'Open textbook',
    license: 'CC BY 4.0',
    category: 'Medical',
    url: 'https://openstax.org/details/books/anatomy-and-physiology-2e',
    description: 'Comprehensive human anatomy and physiology textbook for pre-med and healthcare students.',
  },
  {
    id: 'microbiology',
    title: 'Microbiology Open Textbook',
    source: 'OpenStax',
    subject: 'Medical Biology',
    level: 'Undergraduate',
    type: 'Open textbook',
    license: 'CC BY 4.0',
    category: 'Medical',
    url: 'https://openstax.org/details/books/microbiology',
    description: 'Scope and sequence for single-semester microbiology for allied health majors.',
  },

  // Law
  {
    id: 'harvard-h2o-law',
    title: 'Harvard Law School H2O Open Casebooks',
    source: 'Harvard Law',
    subject: 'Law',
    level: 'Postgraduate',
    type: 'Open Casebook',
    license: 'CC BY-NC-SA 4.0',
    category: 'Law',
    url: 'https://h2o.law.harvard.edu/',
    description: 'Open-access legal casebooks, statutes, and judicial opinion collections for law students.',
  },
  {
    id: 'open-const-law',
    title: 'Constitutional Law Open Access Guide',
    source: 'Open Legal Ed',
    subject: 'Law',
    level: 'Undergraduate',
    type: 'Open textbook',
    license: 'CC BY 4.0',
    category: 'Law',
    url: 'https://open.umn.edu/opentextbooks/textbooks/constitutional-law',
    description: 'In-depth analysis of constitutional doctrines, judicial precedents, and bill of rights.',
  },

  // Commerce & Management
  {
    id: 'accounting-v1',
    title: 'Principles of Accounting Vol 1: Financial Accounting',
    source: 'OpenStax',
    subject: 'Accountancy',
    level: 'Undergraduate',
    type: 'Open textbook',
    license: 'CC BY-NC-SA 4.0',
    category: 'Commerce & Management',
    url: 'https://openstax.org/details/books/principles-financial-accounting',
    description: 'Financial accounting principles, double-entry bookkeeping, and corporate reporting.',
  },
  {
    id: 'principles-mgmt',
    title: 'Principles of Management',
    source: 'OpenStax',
    subject: 'Commerce',
    level: 'Undergraduate',
    type: 'Open textbook',
    license: 'CC BY 4.0',
    category: 'Commerce & Management',
    url: 'https://openstax.org/details/books/principles-management',
    description: 'Foundations of leadership, organizational behavior, strategic planning, and business operations.',
  },

  // Arts & Humanities
  {
    id: 'psychology-2e',
    title: 'Psychology 2e',
    source: 'OpenStax',
    subject: 'Arts & Humanities',
    level: 'Undergraduate',
    type: 'Open textbook',
    license: 'CC BY 4.0',
    category: 'Arts & Humanities',
    url: 'https://openstax.org/details/books/psychology-2e',
    description: 'Introductory psychology covering neuroscience, cognition, behavioral psychology, and therapy.',
  },
  {
    id: 'sociology-3e',
    title: 'Introduction to Sociology 3e',
    source: 'OpenStax',
    subject: 'Sociology',
    level: 'Undergraduate',
    type: 'Open textbook',
    license: 'CC BY 4.0',
    category: 'Arts & Humanities',
    url: 'https://openstax.org/details/books/introduction-sociology-3e',
    description: 'Systematic study of social behavior, institutions, culture, and global social change.',
  },

  // Competitive Exams & Support Materials
  {
    id: 'ncert-exemplar',
    title: 'NCERT Exemplar Problems & Detailed Solutions',
    source: 'NCERT',
    subject: 'Science & Math',
    level: 'Classes 6–12',
    type: 'Question Bank',
    license: 'Official',
    category: 'Question Banks',
    url: 'https://ncert.nic.in/exemplar-problems.php',
    description: 'High-level analytical questions and problems for JEE, NEET, and Olympiad aspirants.',
  },
  {
    id: 'gate-archive',
    title: 'GATE Engineering Examination PYQ & Key Archive',
    source: 'NPTEL / GATE',
    subject: 'Engineering',
    level: 'Competitive Exams',
    type: 'Exam Archive',
    license: 'Official',
    category: 'Previous Year Papers',
    url: 'https://gate2024.iisc.ac.in/',
    description: 'Official previous year question papers and verified keys for all GATE engineering streams.',
  },
  {
    id: 'ncert-lab-manuals',
    title: 'NCERT Science & Mathematics Laboratory Manuals',
    source: 'NCERT',
    subject: 'Science',
    level: 'Classes 9–12',
    type: 'Lab Manual',
    license: 'Official',
    category: 'Lab Manuals',
    url: 'https://ncert.nic.in/lab-manuals.php',
    description: 'Step-by-step practical experiments, observation tables, and safety guides for school laboratories.',
  },

  // Skill Development & Applied Polytechnic
  {
    id: 'odin-web-dev',
    title: 'The Odin Project: Open Full Stack Curriculum',
    source: 'Odin Project',
    subject: 'Computer Science',
    level: 'Skill Development',
    type: 'Interactive Guide',
    license: 'CC BY-SA 4.0',
    category: 'Skill Development',
    url: 'https://www.theodinproject.com/',
    description: 'Hands-on open curriculum for modern web development, Git, JavaScript, Node, and React.',
  },
  {
    id: 'open-doaj',
    title: 'Directory of Open Access Research Journals (DOAJ)',
    source: 'DOAJ',
    subject: 'All subjects',
    level: 'Research',
    type: 'Research Database',
    license: 'Open Access',
    category: 'Research & Journals',
    url: 'https://doaj.org/',
    description: 'Global index of high-quality, peer-reviewed, open access academic journals and research papers.',
  },

  // Additional OpenStax & MIT Mathematics & Sciences
  {
    id: 'calculus-v1',
    title: 'Calculus Volume 1',
    source: 'OpenStax',
    subject: 'Mathematics',
    level: 'Undergraduate',
    type: 'Open textbook',
    license: 'CC BY-NC-SA 4.0',
    category: 'Science',
    url: 'https://openstax.org/details/books/calculus-volume-1',
    description: 'Single-variable calculus, limits, derivatives, integration, and mathematical modeling.',
  },
  {
    id: 'calculus-v2',
    title: 'Calculus Volume 2',
    source: 'OpenStax',
    subject: 'Mathematics',
    level: 'Undergraduate',
    type: 'Open textbook',
    license: 'CC BY-NC-SA 4.0',
    category: 'Science',
    url: 'https://openstax.org/details/books/calculus-volume-2',
    description: 'Integration techniques, differential equations, sequences, infinite series, and power series.',
  },
  {
    id: 'mit-linear-algebra',
    title: 'Linear Algebra & Its Applications',
    source: 'MIT OCW',
    subject: 'Mathematics',
    level: 'Undergraduate',
    type: 'Open Courseware',
    license: 'CC BY-NC-SA 4.0',
    category: 'Engineering',
    url: 'https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/',
    description: 'Professor Gilbert Strang’s world-renowned MIT course on matrix factorizations and vector spaces.',
  },
  {
    id: 'micro-econ',
    title: 'Principles of Microeconomics 3e',
    source: 'OpenStax',
    subject: 'Economics',
    level: 'Undergraduate',
    type: 'Open textbook',
    license: 'CC BY 4.0',
    category: 'Commerce & Management',
    url: 'https://openstax.org/details/books/principles-microeconomics-3e',
    description: 'Supply and demand, consumer behavior, market structures, elasticity, and public policy.',
  },
  {
    id: 'macro-econ',
    title: 'Principles of Macroeconomics 3e',
    source: 'OpenStax',
    subject: 'Economics',
    level: 'Undergraduate',
    type: 'Open textbook',
    license: 'CC BY 4.0',
    category: 'Commerce & Management',
    url: 'https://openstax.org/details/books/principles-macroeconomics-3e',
    description: 'National income, GDP growth, inflation, fiscal policy, monetary systems, and international trade.',
  },
  {
    id: 'plato-republic',
    title: 'The Republic by Plato (Open Classical Philosophy)',
    source: 'Project Gutenberg',
    subject: 'Arts & Humanities',
    level: 'Postgraduate',
    type: 'Open Literature',
    license: 'Public Domain',
    category: 'Arts & Humanities',
    url: 'https://www.gutenberg.org/ebooks/1497',
    description: 'Foundational text of Western philosophy exploring justice, governance, education, and morality.',
  },
  {
    id: 'shakespeare-works',
    title: 'The Complete Works of William Shakespeare',
    source: 'Project Gutenberg',
    subject: 'Language Learning',
    level: 'All levels',
    type: 'Open Literature',
    license: 'Public Domain',
    category: 'Language Learning',
    url: 'https://www.gutenberg.org/ebooks/100',
    description: 'Complete collection of 37 plays, sonnets, and poems for literature and language scholars.',
  },
];

export function hasAccessiblePdf(item) {
  if (!item) return false;
  if (item.source === 'NCERT' && item.url && item.url.includes('dd.zip')) return true;
  if (item.source === 'OpenStax' && (item.pdfUrl || item.url)) return true;
  if (item.pdfUrl || (item.url && item.url.toLowerCase().includes('.pdf'))) return true;
  return false;
}

export const items = [
  ...ncertBooks.filter(hasAccessiblePdf),
  ...openstaxBooks,
  ...otherItems,
];



export const cats = [
  'Board Books',
  'Undergraduate (UG)',
  'Postgraduate (PG)',
  'Diploma & Polytechnic',
  'Competitive Exams',
  'Professional Courses',
  'Engineering',
  'Medical',
  'Law',
  'Commerce & Management',
  'Computer Science & IT',
  'Arts & Humanities',
  'Science',
  'Education',
  'Agriculture',
  'Skill Development',
  'Language Learning',
  'Research & Journals',
  'Open Educational Resources',
  'Question Banks',
  'Previous Year Papers',
  'Notes',
  'Handwritten Notes',
  'Lab Manuals',
  'Projects',
  'Assignments',
  'Syllabus',
];

export const classLevels = [...new Set(ncertBooks.map((b) => b.level))].sort(
  (a, b) => parseInt(a.replace(/\D/g, ''), 10) - parseInt(b.replace(/\D/g, ''), 10),
);

export function getCategorySlug(categoryName) {
  return categoryName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-$/, '');
}

export function getResourcesForCategory(categorySlugOrName) {
  const targetSlug = getCategorySlug(categorySlugOrName);

  return items.filter((item) => {
    if (item.category && getCategorySlug(item.category) === targetSlug) {
      return true;
    }

    switch (targetSlug) {
      case 'board-books':
        return item.source === 'NCERT' || (item.level && item.level.startsWith('Class'));
      case 'undergraduate-ug':
        return item.level === 'Undergraduate' || item.level === 'All levels' || item.category === 'Undergraduate (UG)';
      case 'postgraduate-pg':
        return item.level === 'Postgraduate' || item.level === 'All levels' || item.category === 'Postgraduate (PG)';
      case 'engineering':
        return item.subject === 'Engineering' || item.category === 'Engineering' || item.subject === 'Physics' || item.subject === 'Computer Science';
      case 'medical':
        return item.subject === 'Medical' || item.subject === 'Biology' || item.category === 'Medical';
      case 'law':
        return item.subject === 'Law' || item.category === 'Law';
      case 'commerce-management':
        return item.subject === 'Commerce' || item.subject === 'Accountancy' || item.subject === 'Business Studies' || item.category === 'Commerce & Management';
      case 'computer-science-it':
        return item.subject === 'Computer Science' || item.subject === 'Informatics Practices' || item.category === 'Computer Science & IT';
      case 'arts-humanities':
        return ['History', 'Geography', 'Political Science', 'Economics', 'Sociology', 'Psychology'].includes(item.subject) || item.category === 'Arts & Humanities';
      case 'science':
        return ['Science', 'Physics', 'Chemistry', 'Biology', 'Mathematics', 'Astronomy', 'Environmental Science'].includes(item.subject) || item.category === 'Science';
      case 'competitive-exams':
        return item.type === 'Exam Archive' || item.category === 'Competitive Exams' || item.type === 'Question Bank';
      case 'lab-manuals':
        return item.type === 'Lab Manual' || item.category === 'Lab Manuals';
      case 'question-banks':
      case 'previous-year-papers':
        return item.type === 'Question Bank' || item.type === 'Exam Archive' || item.category === 'Question Banks' || item.category === 'Previous Year Papers';
      case 'notes':
      case 'handwritten-notes':
        return item.type === 'Notes' || item.category === 'Notes' || item.category === 'Handwritten Notes';
      case 'projects':
      case 'assignments':
        return item.type === 'Project Repository' || item.category === 'Projects' || item.category === 'Assignments';
      default:
        const normTitle = targetSlug.replace(/-/g, ' ');
        const itemStr = `${item.title} ${item.description} ${item.subject || ''} ${item.type || ''} ${item.category || ''}`.toLowerCase();
        return normTitle.split(' ').some((word) => word.length > 3 && itemStr.includes(word));
    }
  });
}

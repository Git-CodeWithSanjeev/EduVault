/**
 * Subject & Category Classification Helpers & Constants
 */

export const NCERT_CLASSES = [
  'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6',
  'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12',
];

export const SUBJECT_ICONS = {
  Physics: '⚛️', Chemistry: '🧪', Mathematics: '📐', Biology: '🧬',
  English: '📖', Hindi: '📜', History: '🏛️', Geography: '🌍',
  Economics: '📊', 'Political Science': '🗳️', Sociology: '👥',
  Psychology: '🧠', 'Computer Science': '💻', 'Informatics Practices': '🖥️',
  Accountancy: '🧾', 'Business Studies': '💼', Sanskrit: '🕉️',
  'Physical Education': '🏃', 'Fine Arts': '🎨', Music: '🎵',
  Science: '🔬', 'Social Science': '🌐', 'Environmental Science': '🌿',
  'Home Science': '🏠', Urdu: '✒️',
};

/** Get icon for a given subject */
export function subjectIcon(subject) {
  return SUBJECT_ICONS[subject] || '📚';
}

/** Determine CSS color class for book covers based on subject/category/title */
export function getSubjectColorClass(subject, category, title) {
  const s = ((subject || '') + ' ' + (category || '') + ' ' + (title || '')).toLowerCase();

  if (s.includes('physic')) return 'c-physics';
  if (s.includes('chem')) return 'c-chemistry';
  if (s.includes('bio') || s.includes('medic')) return 'c-biology';
  if (s.includes('math') || s.includes('stat') || s.includes('algebra')) return 'c-math';
  if (s.includes('computer') || s.includes('python') || s.includes('code') || s.includes('tech') || s.includes('engg') || s.includes('engineering')) return 'c-tech';
  if (s.includes('history') || s.includes('geography') || s.includes('polity') || s.includes('social') || s.includes('humanities')) return 'c-history';
  if (s.includes('law') || s.includes('const')) return 'c-law';
  if (s.includes('commerce') || s.includes('business') || s.includes('account') || s.includes('mgmt') || s.includes('econom')) return 'c-commerce';
  if (s.includes('hindi') || s.includes('sanskrit')) return 'c-hindi';
  if (s.includes('english')) return 'c-english';
  return 'c-general';
}

/** Group NCERT books by class level and subject */
export function groupByClass(bookList) {
  const map = {};
  for (const b of bookList) {
    const cls = b.level || 'Other';
    if (!map[cls]) map[cls] = {};
    const subj = b.subject || 'General';
    if (!map[cls][subj]) map[cls][subj] = [];
    map[cls][subj].push(b);
  }
  return map;
}

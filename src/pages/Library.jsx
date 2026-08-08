import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { items, cats, classLevels } from '../data/openItems';
import { Cards } from '../components/Cards';

/* ── helpers ────────────────────────────────────────────────────── */
const NCERT_CLASSES = [
  'Class 1','Class 2','Class 3','Class 4','Class 5','Class 6',
  'Class 7','Class 8','Class 9','Class 10','Class 11','Class 12',
];

const SUBJECT_ICONS = {
  Physics: '⚛️', Chemistry: '🧪', Mathematics: '📐', Biology: '🧬',
  English: '📖', Hindi: '📜', History: '🏛️', Geography: '🌍',
  Economics: '📊', 'Political Science': '🗳️', Sociology: '👥',
  Psychology: '🧠', 'Computer Science': '💻', 'Informatics Practices': '🖥️',
  Accountancy: '🧾', 'Business Studies': '💼', Sanskrit: '🕉️',
  'Physical Education': '🏃', 'Fine Arts': '🎨', Music: '🎵',
  Science: '🔬', 'Social Science': '🌐', 'Environmental Science': '🌿',
  'Home Science': '🏠', 'Urdu': '✒️',
};

function subjectIcon(subject) {
  return SUBJECT_ICONS[subject] || '📚';
}

/* Group NCERT books by level → subject */
function groupByClass(bookList) {
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

/* ── Component ──────────────────────────────────────────────────── */
export function Library({ saved, toggle }) {
  const [tab, setTab]       = useState('class');   // 'class' | 'category' | 'search'
  const [q, setQ]           = useState('');
  const [activeClass, setActiveClass] = useState(NCERT_CLASSES[11]); // default Class 12
  const [activeCat, setActiveCat]     = useState(cats[0]);
  const [activeSub, setActiveSub]     = useState('All');
  const [visibleCount, setVisibleCount] = useState(16);

  /* ─── SEARCH tab filter ─── */
  const searchResults = useMemo(() => {
    if (!q.trim()) return [];
    const lq = q.toLowerCase();
    return items.filter((x) =>
      Object.values(x).join(' ').toLowerCase().includes(lq)
    );
  }, [q]);

  /* ─── CLASS tab data ─── */
  const ncertOnly  = useMemo(() => items.filter(x => x.source === 'NCERT'), []);
  const classGroup = useMemo(() => groupByClass(ncertOnly), [ncertOnly]);
  const classBooks = useMemo(() => {
    const subjectMap = classGroup[activeClass] || {};
    if (activeSub === 'All') return Object.values(subjectMap).flat();
    return subjectMap[activeSub] || [];
  }, [classGroup, activeClass, activeSub]);
  const classSubjects = useMemo(() => {
    const subjectMap = classGroup[activeClass] || {};
    return ['All', ...Object.keys(subjectMap).sort()];
  }, [classGroup, activeClass]);

  /* ─── CATEGORY tab data ─── */
  const catResults = useMemo(() => {
    const slug = activeCat.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '');
    return items.filter(x => {
      const xSlug = (x.category || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
      if (xSlug === slug) return true;
      // fallback subject-based match
      if (slug === 'science') return ['Physics','Chemistry','Biology','Mathematics','Science','Environmental Science'].includes(x.subject);
      if (slug === 'computer-science-it') return ['Computer Science','Informatics Practices'].includes(x.subject);
      if (slug === 'arts-humanities') return ['History','Geography','Political Science','Economics','Sociology','Psychology'].includes(x.subject);
      if (slug === 'board-books') return x.source === 'NCERT';
      if (slug === 'undergraduate-ug') return x.level === 'Undergraduate';
      return false;
    }).slice(0, visibleCount);
  }, [activeCat, visibleCount]);

  return (
    <section className="lib-page">
      {/* ── Hero Header ── */}
      <div className="lib-hero">
        <p className="eyebrow">📚 RESOURCE LIBRARY</p>
        <h1 className="lib-hero-title">Free Books &amp; Study Material</h1>
        <p className="lib-hero-sub">
          {items.length}+ verified free textbooks · NCERT · OpenStax · Open License
        </p>

        {/* Global Search */}
        <div className="lib-search-bar">
          <span className="lib-search-icon">🔍</span>
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); if (e.target.value) setTab('search'); else setTab('class'); }}
            placeholder="Search books, subjects, classes, authors…"
            className="lib-search-input"
          />
          {q && (
            <button className="lib-search-clear" onClick={() => { setQ(''); setTab('class'); }}>✕</button>
          )}
        </div>
      </div>

      {/* ── Tab Switcher ── */}
      {!q && (
        <div className="lib-tabs">
          <button className={`lib-tab ${tab === 'class' ? 'active' : ''}`} onClick={() => setTab('class')}>
            🏫 By Class
          </button>
          <button className={`lib-tab ${tab === 'category' ? 'active' : ''}`} onClick={() => setTab('category')}>
            📂 By Category
          </button>
        </div>
      )}

      {/* ════════════════════════════════════════════
           SEARCH RESULTS
      ════════════════════════════════════════════ */}
      {tab === 'search' && (
        <div className="lib-content">
          <div className="lib-section-header">
            <span>🔍 Search results for "<strong>{q}</strong>"</span>
            <span className="lib-count-badge">{searchResults.length} found</span>
          </div>
          {searchResults.length === 0
            ? <div className="lib-empty">No results found. Try a different term.</div>
            : <Cards list={searchResults} saved={saved} toggle={toggle} />
          }
        </div>
      )}

      {/* ════════════════════════════════════════════
           BY CLASS TAB
      ════════════════════════════════════════════ */}
      {tab === 'class' && (
        <div className="lib-split">
          {/* Class Selector */}
          <div className="lib-class-rail">
            <div className="lib-rail-label">NCERT Classes</div>
            {NCERT_CLASSES.map((cls) => (
              <button
                key={cls}
                className={`lib-class-btn ${activeClass === cls ? 'active' : ''}`}
                onClick={() => { setActiveClass(cls); setActiveSub('All'); }}
              >
                {cls}
                <span className="lib-class-count">
                  {Object.values(classGroup[cls] || {}).flat().length}
                </span>
              </button>
            ))}
          </div>

          {/* Books Panel */}
          <div className="lib-books-panel">
            {/* Subject Filter Pills */}
            <div className="lib-subject-pills">
              {classSubjects.map((s) => (
                <button
                  key={s}
                  className={`lib-pill ${activeSub === s ? 'active' : ''}`}
                  onClick={() => setActiveSub(s)}
                >
                  {s !== 'All' && <span>{subjectIcon(s)}</span>}
                  {s}
                </button>
              ))}
            </div>

            <div className="lib-section-header">
              <span>
                {subjectIcon(activeSub !== 'All' ? activeSub : 'Science')}&nbsp;
                <strong>{activeClass}</strong>
                {activeSub !== 'All' && ` · ${activeSub}`}
              </span>
              <span className="lib-count-badge">{classBooks.length} books</span>
            </div>

            {classBooks.length === 0
              ? <div className="lib-empty">No books found for this selection.</div>
              : <Cards list={classBooks} saved={saved} toggle={toggle} />
            }
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════
           BY CATEGORY TAB
      ════════════════════════════════════════════ */}
      {tab === 'category' && (
        <div className="lib-split">
          {/* Category Rail */}
          <div className="lib-class-rail">
            <div className="lib-rail-label">Categories</div>
            {cats.map((c) => (
              <button
                key={c}
                className={`lib-class-btn ${activeCat === c ? 'active' : ''}`}
                onClick={() => { setActiveCat(c); setVisibleCount(16); }}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Category Panel */}
          <div className="lib-books-panel">
            <div className="lib-section-header">
              <span>📂 <strong>{activeCat}</strong></span>
              <span className="lib-count-badge">{catResults.length} items</span>
            </div>

            {catResults.length === 0
              ? <div className="lib-empty">No items in this category yet.</div>
              : <Cards list={catResults} saved={saved} toggle={toggle} />
            }

            {/* Load more */}
            {items.filter(x => {
              const slug = activeCat.toLowerCase().replace(/[^a-z0-9]+/g, '-');
              const xSlug = (x.category || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
              return xSlug === slug;
            }).length > visibleCount && (
              <div className="load-more-wrap">
                <button className="load-more-btn" onClick={() => setVisibleCount(v => v + 16)}>
                  Load More ↓
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

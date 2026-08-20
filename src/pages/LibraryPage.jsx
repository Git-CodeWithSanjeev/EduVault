import React, { useState, useEffect, useMemo } from 'react';
import { items, cats } from '../data/openItems';
import { Cards } from '../components/ResourceGrid';
import { NCERT_CLASSES, subjectIcon, groupByClass } from '../utils/subjectHelpers';

export { NCERT_CLASSES, subjectIcon, groupByClass };

/* ── Component ──────────────────────────────────────────────────── */
export function Library({ saved = [], toggle = () => {} }) {
  const [tab, setTab] = useState(() => sessionStorage.getItem('eduvault_lib_tab') || 'class');
  const [q, setQ] = useState(() => sessionStorage.getItem('eduvault_lib_q') || '');
  const [activeClass, setActiveClass] = useState(() => sessionStorage.getItem('eduvault_lib_class') || NCERT_CLASSES[11]);
  const [activeCat, setActiveCat] = useState(() => sessionStorage.getItem('eduvault_lib_cat') || cats[0]);
  const [activeSub, setActiveSub] = useState(() => sessionStorage.getItem('eduvault_lib_sub') || 'All');
  const [openstaxSub, setOpenstaxSub] = useState(() => sessionStorage.getItem('eduvault_lib_openstax_sub') || 'All');
  const [visibleCount, setVisibleCount] = useState(16);

  useEffect(() => {
    sessionStorage.setItem('eduvault_lib_tab', tab);
  }, [tab]);

  useEffect(() => {
    sessionStorage.setItem('eduvault_lib_q', q);
  }, [q]);

  useEffect(() => {
    sessionStorage.setItem('eduvault_lib_class', activeClass);
  }, [activeClass]);

  useEffect(() => {
    sessionStorage.setItem('eduvault_lib_cat', activeCat);
  }, [activeCat]);

  useEffect(() => {
    sessionStorage.setItem('eduvault_lib_sub', activeSub);
  }, [activeSub]);

  useEffect(() => {
    sessionStorage.setItem('eduvault_lib_openstax_sub', openstaxSub);
  }, [openstaxSub]);


  /* ─── OPENSTAX tab data ─── */
  const openstaxBooksList = useMemo(() => items.filter(x => x.source === 'OpenStax'), []);
  const openstaxSubjects = useMemo(() => {
    const set = new Set(openstaxBooksList.map(b => b.subject).filter(Boolean));
    return ['All', ...Array.from(set).sort()];
  }, [openstaxBooksList]);
  const filteredOpenstaxBooks = useMemo(() => {
    if (openstaxSub === 'All') return openstaxBooksList;
    return openstaxBooksList.filter(b => b.subject === openstaxSub);
  }, [openstaxBooksList, openstaxSub]);

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
      if (slug === 'undergraduate-ug') return x.level === 'Undergraduate' || x.source === 'OpenStax';
      return false;
    }).slice(0, visibleCount);
  }, [activeCat, visibleCount]);


  const [libFilterOpen, setLibFilterOpen] = useState(false);

  // Active filter subject depending on current tab
  const currentActiveSub = tab === 'openstax' ? openstaxSub : (tab === 'class' ? activeSub : 'All');
  const currentSubjectList = tab === 'openstax' ? openstaxSubjects : (tab === 'class' ? classSubjects : []);

  const handleSelectSubject = (sub) => {
    if (tab === 'openstax') {
      setOpenstaxSub(sub);
    } else if (tab === 'class') {
      setActiveSub(sub);
    }
    setLibFilterOpen(false);
  };

  const handleClearSubject = () => {
    if (tab === 'openstax') {
      setOpenstaxSub('All');
    } else if (tab === 'class') {
      setActiveSub('All');
    }
  };

  return (
    <section className="lib-page">
      {/* ── Hero Header ── */}
      <div className="lib-hero">
        <p className="eyebrow">RESOURCE LIBRARY</p>
        <h1 className="lib-hero-title">Free Books &amp; Study Material</h1>
        <p className="lib-hero-sub">
          {items.length}+ verified free textbooks · NCERT · OpenStax · Open License
        </p>

        {/* Global Search & Integrated Filter Bar */}
        <div style={{ position: 'relative', width: '100%', maxWidth: '720px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
            {/* Search Input Box */}
            <div style={{ position: 'relative', flex: 1 }}>
              <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                value={q}
                onChange={(e) => { setQ(e.target.value); if (e.target.value) setTab('search'); else setTab('class'); }}
                placeholder="Search books, subjects, classes, authors…"
                style={{
                  width: '100%',
                  height: '46px',
                  padding: '0 42px 0 46px',
                  background: 'var(--card)',
                  border: '1.5px solid rgba(13, 148, 136, 0.22)',
                  borderRadius: '20px',
                  fontSize: '14px',
                  color: 'var(--ink)',
                  outline: 'none',
                  boxShadow: '0 4px 16px rgba(13, 148, 136, 0.06)',
                  boxSizing: 'border-box',
                }}
              />
              {q && (
                <button
                  onClick={() => { setQ(''); setTab('class'); }}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 0,
                    color: 'var(--muted)',
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Button on the RIGHT of Search Box */}
            {/* Filter Button on the RIGHT of Search Box */}
            {!q && (currentSubjectList.length > 1 || tab === 'class') && (
              <button
                type="button"
                onClick={() => setLibFilterOpen(!libFilterOpen)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  height: '46px',
                  padding: '0 18px',
                  background: (currentActiveSub !== 'All' || tab === 'class') ? 'var(--p-gradient)' : '#e6f7f3',
                  color: (currentActiveSub !== 'All' || tab === 'class') ? '#ffffff' : 'var(--p-dark)',
                  border: (currentActiveSub !== 'All' || tab === 'class') ? '1px solid rgba(255,255,255,0.2)' : '1.5px solid rgba(13, 148, 136, 0.25)',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: (currentActiveSub !== 'All' || tab === 'class') ? '0 4px 14px var(--p-glow)' : '0 2px 8px rgba(13, 148, 136, 0.05)',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  whiteSpace: 'nowrap',
                  boxSizing: 'border-box',
                }}
                aria-expanded={libFilterOpen}
                aria-label="Filter options dropdown"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
                <span>
                  {tab === 'class'
                    ? (currentActiveSub === 'All' ? `Filter (${activeClass})` : `${activeClass} · ${currentActiveSub}`)
                    : (currentActiveSub === 'All' ? 'Filter Subjects' : currentActiveSub)}
                </span>
                <span style={{ fontSize: '10px', opacity: 0.8 }}>{libFilterOpen ? '▲' : '▼'}</span>
              </button>
            )}

            {/* Clear Filter button if a subject is active */}
            {!q && currentActiveSub !== 'All' && (
              <button
                type="button"
                onClick={handleClearSubject}
                style={{
                  height: '46px',
                  padding: '0 14px',
                  background: '#ffffff',
                  border: '1.5px solid rgba(13, 148, 136, 0.22)',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: 'var(--muted)',
                  cursor: 'pointer',
                  boxSizing: 'border-box',
                }}
                title="Reset active subject"
              >
                ✕ Clear
              </button>
            )}
          </div>

          {/* Floating Dropdown Filter Options Popover */}
          {!q && libFilterOpen && (
            <>
              <div
                onClick={() => setLibFilterOpen(false)}
                style={{ position: 'fixed', inset: 0, zIndex: 190 }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  left: 0,
                  background: '#ffffff',
                  borderRadius: '16px',
                  padding: '16px',
                  boxShadow: '0 16px 40px rgba(13, 148, 136, 0.14), 0 2px 8px rgba(0,0,0,0.04)',
                  border: '1px solid rgba(13, 148, 136, 0.18)',
                  zIndex: 200,
                  textAlign: 'left',
                  maxHeight: '80vh',
                  overflowY: 'auto',
                }}
              >
                {/* 1. FILTER BY CLASS SECTION (NCERT) */}
                {tab === 'class' && (
                  <div style={{ marginBottom: '14px', paddingBottom: '12px', borderBottom: '1px solid rgba(13, 148, 136, 0.12)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--muted)', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                        Filter By Class ({activeClass})
                      </span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '6px',
                        maxHeight: '220px',
                        overflowY: 'auto',
                        padding: '2px',
                      }}
                    >
                      {NCERT_CLASSES.map((cls) => {
                        const isClsActive = activeClass === cls;
                        return (
                          <button
                            key={cls}
                            type="button"
                            onClick={() => {
                              setActiveClass(cls);
                              setActiveSub('All');
                            }}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '16px',
                              fontSize: '12px',
                              fontWeight: isClsActive ? 800 : 600,
                              cursor: 'pointer',
                              background: isClsActive ? 'var(--p-gradient)' : '#f1f5f9',
                              color: isClsActive ? '#ffffff' : 'var(--ink)',
                              border: isClsActive ? '1px solid transparent' : '1px solid rgba(13, 148, 136, 0.15)',
                              boxShadow: isClsActive ? '0 2px 8px var(--p-glow)' : 'none',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            {isClsActive ? '✓ ' : ''}{cls}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. FILTER BY SUBJECT SECTION */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--muted)', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                    Select Subject ({currentSubjectList.length})
                  </span>
                  {currentActiveSub !== 'All' && (
                    <button
                      type="button"
                      onClick={handleClearSubject}
                      style={{
                        background: 'none',
                        border: 0,
                        color: 'var(--p)',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Reset to All
                    </button>
                  )}
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px',
                    maxHeight: '320px',
                    overflowY: 'auto',
                    padding: '2px',
                  }}
                >
                  {currentSubjectList.map((s) => {
                    const isActive = currentActiveSub === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleSelectSubject(s)}
                        style={{
                          padding: '7px 13px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: isActive ? 700 : 600,
                          cursor: 'pointer',
                          background: isActive ? 'var(--p-gradient)' : '#f8fafc',
                          color: isActive ? '#ffffff' : 'var(--ink)',
                          border: isActive ? '1px solid transparent' : '1px solid rgba(13, 148, 136, 0.15)',
                          boxShadow: isActive ? '0 3px 10px var(--p-glow)' : 'none',
                          transition: 'all 0.15s ease',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}
                      >
                        {isActive ? '✓ ' : (s !== 'All' ? subjectIcon(s) + ' ' : '')}{s}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Tab Switcher ── */}
      {!q && (
        <div className="lib-tabs">
          <button className={`lib-tab ${tab === 'class' ? 'active' : ''}`} onClick={() => setTab('class')}>
            By Class (NCERT)
          </button>
          <button className={`lib-tab ${tab === 'openstax' ? 'active' : ''}`} onClick={() => setTab('openstax')}>
            OpenStax College
          </button>
          <button className={`lib-tab ${tab === 'category' ? 'active' : ''}`} onClick={() => setTab('category')}>
            By Category
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
            {/* Active Subject Filter Badge */}
            {activeSub !== 'All' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>Active Subject Filter:</span>
                <span style={{
                  padding: '6px 14px',
                  background: 'var(--p-gradient)',
                  color: '#ffffff',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 8px var(--p-glow)',
                }}>
                  {subjectIcon(activeSub)} {activeSub}
                  <button
                    type="button"
                    onClick={() => setActiveSub('All')}
                    style={{ background: 'none', border: 0, color: '#ffffff', cursor: 'pointer', padding: 0, fontSize: '13px', marginLeft: '4px' }}
                    title="Remove filter"
                  >
                    ✕
                  </button>
                </span>
              </div>
            )}

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
           OPENSTAX TAB
      ════════════════════════════════════════════ */}
      {tab === 'openstax' && (
        <div className="lib-content">
          {openstaxSub !== 'All' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>Active Subject Filter:</span>
              <span style={{
                padding: '6px 14px',
                background: 'var(--p-gradient)',
                color: '#ffffff',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 8px var(--p-glow)',
              }}>
                {subjectIcon(openstaxSub)} {openstaxSub}
                <button
                  type="button"
                  onClick={() => setOpenstaxSub('All')}
                  style={{ background: 'none', border: 0, color: '#ffffff', cursor: 'pointer', padding: 0, fontSize: '13px', marginLeft: '4px' }}
                  title="Remove filter"
                >
                  ✕
                </button>
              </span>
            </div>
          )}

          <div className="lib-section-header">
            <span>
              📖 <strong>OpenStax College &amp; AP Textbooks</strong>
              {openstaxSub !== 'All' && ` · ${openstaxSub}`}
            </span>
            <span className="lib-count-badge">{filteredOpenstaxBooks.length} books</span>
          </div>

          {filteredOpenstaxBooks.length === 0 ? (
            <div className="lib-empty">No OpenStax books found for subject "{openstaxSub}".</div>
          ) : (
            <Cards list={filteredOpenstaxBooks} saved={saved} toggle={toggle} />
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════
           BY CATEGORY TAB
      ════════════════════════════════════════════ */}

      {tab === 'category' && (
        <div className="lib-split">
          {/* Category Rail */}
          <div className="lib-class-rail lib-cat-rail">
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

export default Library;

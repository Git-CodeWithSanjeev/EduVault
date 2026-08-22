import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { VideoCard } from './VideoCard';
import { educationalGalleryData } from '../data/educationalGalleryData';
import { items as allPlatformBooks } from '../data/openItems';
import { getStoredYouTubeApiKey, setStoredYouTubeApiKey, testYouTubeApiKey } from '../services/youtubeApi';

// Clean SVG Icon Component matching website UI theme
function ThemeIcon({ name, size = 16, color = 'currentColor', style = {} }) {
  const iconMap = {
    all: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
    school: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
      </svg>
    ),
    ug: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
        <rect width="20" height="14" x="2" y="3" rx="2" />
        <line x1="8" x2="16" y1="21" y2="21" />
        <line x1="12" x2="12" y1="17" y2="21" />
      </svg>
    ),
    competitive: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
      </svg>
    ),
    math: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
        <line x1="5" y1="12" x2="19" y2="12" />
        <line x1="12" y1="5" x2="12" y2="19" />
      </svg>
    ),
    physics: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
        <circle cx="12" cy="12" r="2" />
        <ellipse cx="12" cy="12" rx="9" ry="3" transform="rotate(45 12 12)" />
        <ellipse cx="12" cy="12" rx="9" ry="3" transform="rotate(-45 12 12)" />
      </svg>
    ),
    chemistry: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
        <path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2" />
        <path d="M8.5 2h7" />
        <path d="M7 16h10" />
      </svg>
    ),
    biology: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
        <path d="M11 2a2 2 0 0 0-2 2v5H4a2 2 0 0 0-2 2v2c0 1.1.9 2 2 2h5v5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-5h5a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-5V4a2 2 0 0 0-2-2h-2z" />
      </svg>
    ),
    science: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
        <path d="M14 2v6a2 2 0 0 0 .586 1.414l5 5a2 2 0 0 1 0 2.828l-4.172 4.172a2 2 0 0 1-2.828 0l-5-5A2 2 0 0 1 7 15V2" />
        <path d="M9 2h6" />
      </svg>
    ),
    evs: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
        <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
      </svg>
    ),
    code: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
    social: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
    english: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
    hindi: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
        <path d="M12 19l7-7 3 3-7 7-3-3z" />
        <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
        <path d="M2 2l7.586 7.586" />
        <circle cx="11" cy="11" r="2" />
      </svg>
    ),
    commerce: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    chart: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    book: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
    external: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
      </svg>
    ),
  };

  return iconMap[name] || iconMap.book;
}

function getSubjectIconName(sub = '') {
  const lower = sub.toLowerCase();
  if (lower.includes('math') || lower.includes('quant')) return 'math';
  if (lower.includes('physic')) return 'physics';
  if (lower.includes('chem')) return 'chemistry';
  if (lower.includes('bio')) return 'biology';
  if (lower.includes('evs') || lower.includes('environment')) return 'evs';
  if (lower.includes('science')) return 'science';
  if (lower.includes('code') || lower.includes('program') || lower.includes('python') || lower.includes('web') || lower.includes('dev') || lower.includes('tech') || lower.includes('cs') || lower.includes('algo') || lower.includes('data')) return 'code';
  if (lower.includes('social') || lower.includes('history') || lower.includes('geography') || lower.includes('polity')) return 'social';
  if (lower.includes('english')) return 'english';
  if (lower.includes('hindi') || lower.includes('sanskrit')) return 'hindi';
  if (lower.includes('account') || lower.includes('business') || lower.includes('finance')) return 'commerce';
  if (lower.includes('econom')) return 'chart';
  if (lower.includes('reason') || lower.includes('aptitude')) return 'math';
  return 'book';
}

const TIER_DESCRIPTIONS = {
  'Class 1–12': 'Comprehensive NCERT & Board Exam full courses for secondary and senior secondary students.',
  'Undergraduate (UG)': 'B.Tech, Computer Science, Full-Stack engineering, Operating Systems, and industry placement bootcamps.',
  'Competitive Exams': 'Aptitude shortcuts, Indian Polity, Modern History, logical reasoning, and English for UPSC, SSC, Banking & career exams.',
  'All': 'Explore our complete curriculum across school, university degrees, and competitive career exams.',
};

/**
 * Helper to retrieve matching textbook resources for a given class or subject
 * Excludes Undergraduate (UG) courses as requested
 */
function getMatchingBooks(subjectName, classNum, tier) {
  // Explicitly remove books from Undergraduate (UG) Video Courses section
  if (tier === 'Undergraduate (UG)') {
    return [];
  }

  if (!Array.isArray(allPlatformBooks) || allPlatformBooks.length === 0) return [];
  const sLower = (subjectName || '').toLowerCase();
  
  if (tier === 'Class 1–12' || (classNum && classNum !== 'All')) {
    const cNum = String(classNum || '').replace(/\D/g, '');
    return allPlatformBooks
      .filter((b) => {
        const bLevel = (b.level || '').replace(/\D/g, '');
        const bSub = (b.subject || '').toLowerCase();
        const bTitle = (b.title || '').toLowerCase();
        
        const matchClass = !cNum || bLevel === cNum;
        const matchSub = sLower === 'all' || bSub.includes(sLower) || sLower.includes(bSub) || bTitle.includes(sLower);
        return matchClass && matchSub;
      })
      .slice(0, 4);
  }

  // Competitive Books matching
  if (tier === 'Competitive Exams') {
    return allPlatformBooks
      .filter((b) => {
        const bSub = (b.subject || '').toLowerCase();
        const bTitle = (b.title || '').toLowerCase();
        const bCat = (b.category || '').toLowerCase();
        return bSub.includes(sLower) || sLower.includes(bSub) || bTitle.includes(sLower) || bCat.includes(sLower);
      })
      .slice(0, 4);
  }

  return [];
}

/**
 * VideoGallery Component
 * Hierarchical Video Navigation: Class 1–12 → Undergraduate (UG) → Competitive Exams
 * Features clean UI theme icons, related book references, live search, and clean structured browsing.
 */
export function VideoGallery({
  videos = educationalGalleryData,
  title = "Video Learning Vault",
  subtitle = "Structured full-length video courses organized by academic level and subject.",
  showFilters = true,
  columns = 3,
}) {
  const [selectedTier, setSelectedTier] = useState(() => sessionStorage.getItem('eduvault_vg_tier') || 'All');
  const [selectedClassNum, setSelectedClassNum] = useState(() => sessionStorage.getItem('eduvault_vg_class') || 'All');
  const [selectedSubject, setSelectedSubject] = useState(() => sessionStorage.getItem('eduvault_vg_subject') || 'All');
  const [searchQuery, setSearchQuery] = useState(() => sessionStorage.getItem('eduvault_vg_q') || '');

  useEffect(() => {
    sessionStorage.setItem('eduvault_vg_tier', selectedTier);
  }, [selectedTier]);

  useEffect(() => {
    sessionStorage.setItem('eduvault_vg_class', selectedClassNum);
  }, [selectedClassNum]);

  useEffect(() => {
    sessionStorage.setItem('eduvault_vg_subject', selectedSubject);
  }, [selectedSubject]);

  useEffect(() => {
    sessionStorage.setItem('eduvault_vg_q', searchQuery);
  }, [searchQuery]);

  // Tier 1 Categories
  const tiers = [
    { id: 'All', label: 'All Courses', icon: 'all' },
    { id: 'Class 1–12', label: 'Class 1–12', icon: 'school' },
    { id: 'Undergraduate (UG)', label: 'Undergraduate (UG)', icon: 'ug' },
    { id: 'Competitive Exams', label: 'Competitive Exams', icon: 'competitive' },
  ];

  // Normalize list of videos
  const normalizedVideos = useMemo(() => {
    if (!Array.isArray(videos) || videos.length === 0) return [];
    return videos
      .map((v) => {
        if (typeof v === 'string') {
          return {
            id: v,
            tier: 'Undergraduate (UG)',
            classNum: 'UG',
            subject: 'General',
            title: `YouTube Video (${v})`,
            channel: 'YouTube Educator',
            thumbnail: `https://img.youtube.com/vi/${v}/hqdefault.jpg`,
          };
        }
        const vId = v.videoId || v.id;
        const thumb = v.thumbnail || (vId ? `https://img.youtube.com/vi/${vId}/hqdefault.jpg` : null);
        const tier = v.tier || (v.category === 'Class 1 to 12 School Curriculum' || v.focusArea?.includes('Class') || v.classNum ? 'Class 1–12' : (v.focusArea?.includes('Aptitude') || v.focusArea?.includes('Spoken') ? 'Competitive Exams' : 'Undergraduate (UG)'));
        const subject = v.subject || v.focusArea || v.category || 'General';
        const classNum = v.classNum ? String(v.classNum) : (v.gradeLevel ? v.gradeLevel.replace(/\D/g, '') : null);

        return {
          ...v,
          tier,
          subject,
          classNum,
          thumbnail: thumb,
        };
      })
      .filter((v) => v && v.title);
  }, [videos]);

  // Subjects available for currently selected Tier and Class
  const availableSubjects = useMemo(() => {
    let subset = normalizedVideos;
    if (selectedTier !== 'All') {
      subset = subset.filter((v) => v.tier === selectedTier);
    }
    if (selectedTier === 'Class 1–12' && selectedClassNum !== 'All') {
      subset = subset.filter((v) => String(v.classNum) === String(selectedClassNum));
    }

    const subjectSet = new Set(subset.map((v) => v.subject).filter(Boolean));
    return ['All', ...Array.from(subjectSet)];
  }, [normalizedVideos, selectedTier, selectedClassNum]);

  // Filtered videos based on Tier, Class, Subject, and Search Query
  const filteredVideos = useMemo(() => {
    return normalizedVideos.filter((v) => {
      const matchesTier = selectedTier === 'All' || v.tier === selectedTier;
      const matchesClass = selectedTier !== 'Class 1–12' || selectedClassNum === 'All' || String(v.classNum) === String(selectedClassNum);
      const matchesSubject = selectedSubject === 'All' || v.subject === selectedSubject;
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        `${v.title} ${v.channel} ${v.subject} ${v.tier} ${v.gradeLevel || ''} ${v.whyHighQuality || ''}`
          .toLowerCase()
          .includes(query);

      return matchesTier && matchesClass && matchesSubject && matchesSearch;
    });
  }, [normalizedVideos, selectedTier, selectedClassNum, selectedSubject, searchQuery]);

  // Group videos by subject if viewing "All Subjects" and no narrow search query
  const groupedBySubject = useMemo(() => {
    if (selectedSubject !== 'All' || searchQuery.trim().length > 0) {
      return null;
    }

    const groups = {};
    filteredVideos.forEach((v) => {
      const sub = v.subject || 'General';
      if (!groups[sub]) {
        groups[sub] = {
          subjectName: sub,
          tier: v.tier,
          classNum: v.classNum,
          iconName: getSubjectIconName(sub),
          videos: [],
          relatedBooks: getMatchingBooks(sub, v.classNum, v.tier),
        };
      }
      groups[sub].videos.push(v);
    });

    return Object.values(groups);
  }, [filteredVideos, selectedSubject, searchQuery]);

  return (
    <section className="video-gallery-section" style={{ maxWidth: '1280px', margin: '0 auto' }}>
      {/* Header */}
      <div className="video-gallery-header" style={{ marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <ThemeIcon name={selectedTier === 'Class 1–12' ? 'school' : selectedTier === 'Undergraduate (UG)' ? 'ug' : selectedTier === 'Competitive Exams' ? 'competitive' : 'all'} size={18} color="var(--p)" />
            <p className="eyebrow" style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 800 }}>
              {selectedTier === 'All' ? 'Complete Academic Curriculum' : `${selectedTier} Video Courses`}
            </p>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, margin: '4px 0 8px', color: 'var(--ink)', letterSpacing: '-0.3px' }}>
            {title}
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '14px', margin: 0, lineHeight: 1.5, maxWidth: '800px' }}>
            {TIER_DESCRIPTIONS[selectedTier] || subtitle}
          </p>
        </div>
      </div>

      {/* Tier 1: Main Academic Level Hierarchy Tabs (Without count bubbles) */}
      <div
        className="tier-navigation-tabs"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          padding: '6px',
          background: '#f1f5f9',
          borderRadius: '16px',
          marginBottom: '18px',
          border: '1px solid var(--line)',
        }}
      >
        {tiers.map((t) => {
          const isActive = selectedTier === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setSelectedTier(t.id);
                setSelectedClassNum('All');
                setSelectedSubject('All');
              }}
              style={{
                flex: '1 1 auto',
                minWidth: '150px',
                padding: '12px 20px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: isActive ? 800 : 600,
                cursor: 'pointer',
                background: isActive ? '#ffffff' : 'transparent',
                color: isActive ? 'var(--p-dark)' : 'var(--muted)',
                border: isActive ? '1px solid var(--line)' : '1px solid transparent',
                boxShadow: isActive ? '0 4px 12px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.2s ease',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <ThemeIcon name={t.icon} size={18} color={isActive ? 'var(--p-dark)' : 'var(--muted)'} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Class 1 to 12 Specific Class Filter Bar */}
      {selectedTier === 'Class 1–12' && (
        <div
          style={{
            background: '#ffffff',
            border: '1.5px solid var(--line)',
            borderRadius: '16px',
            padding: '14px 18px',
            marginBottom: '18px',
            boxShadow: 'var(--card-shadow)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ThemeIcon name="school" size={16} color="var(--p)" />
              Select Class:
            </span>
            {selectedClassNum !== 'All' && (
              <button
                type="button"
                onClick={() => {
                  setSelectedClassNum('All');
                  setSelectedSubject('All');
                }}
                style={{ background: 'none', border: 0, color: 'var(--p-dark)', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
              >
                View All Classes (1–12) →
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            <button
              type="button"
              onClick={() => {
                setSelectedClassNum('All');
                setSelectedSubject('All');
              }}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: selectedClassNum === 'All' ? 800 : 600,
                background: selectedClassNum === 'All' ? 'var(--p-gradient)' : '#f8fafc',
                color: selectedClassNum === 'All' ? '#ffffff' : 'var(--ink)',
                border: selectedClassNum === 'All' ? '1px solid transparent' : '1px solid var(--line)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              All Classes (1–12)
            </button>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => {
              const isActive = String(selectedClassNum) === String(num);
              return (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    setSelectedClassNum(String(num));
                    setSelectedSubject('All');
                  }}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: isActive ? 800 : 600,
                    background: isActive ? 'var(--p-gradient)' : '#f8fafc',
                    color: isActive ? '#ffffff' : 'var(--ink)',
                    border: isActive ? '1px solid transparent' : '1px solid var(--line)',
                    cursor: 'pointer',
                    boxShadow: isActive ? '0 2px 8px var(--p-glow)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Class {num}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Tier 2: Subject-Wise Filter Pills & Live Search Bar */}
      {showFilters && (
        <div style={{ marginBottom: '28px' }}>
          {/* Subject Pills Row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              overflowX: 'auto',
              paddingBottom: '8px',
              marginBottom: '14px',
              scrollbarWidth: 'none',
            }}
          >
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap', marginRight: '4px' }}>
              Subjects:
            </span>
            {availableSubjects.map((sub) => {
              const isActive = selectedSubject === sub;
              const iconName = sub === 'All' ? 'all' : getSubjectIconName(sub);
              return (
                <button
                  key={sub}
                  type="button"
                  onClick={() => setSelectedSubject(sub)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: isActive ? 700 : 600,
                    cursor: 'pointer',
                    background: isActive ? 'var(--p-gradient)' : '#ffffff',
                    color: isActive ? '#ffffff' : 'var(--ink)',
                    border: isActive ? '1px solid transparent' : '1px solid var(--line)',
                    boxShadow: isActive ? '0 3px 10px var(--p-glow)' : '0 1px 3px rgba(0,0,0,0.02)',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <ThemeIcon name={iconName} size={14} color={isActive ? '#ffffff' : 'var(--p)'} />
                  <span>{sub === 'All' ? `All ${selectedTier === 'All' ? 'Courses' : selectedTier} Subjects` : sub}</span>
                </button>
              );
            })}
          </div>

          {/* Search Input Bar */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1 1 240px' }}>
              <input
                type="text"
                placeholder={`Search ${selectedTier === 'All' ? 'all courses' : selectedTier} by title, educator, or topic...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 42px 12px 16px',
                  background: 'var(--card)',
                  border: '1.5px solid var(--line)',
                  borderRadius: '20px',
                  fontSize: '13px',
                  color: 'var(--ink)',
                  outline: 'none',
                  boxShadow: 'var(--card-shadow)',
                  boxSizing: 'border-box',
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
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
                >
                  ✕
                </button>
              )}
            </div>

            {(selectedSubject !== 'All' || selectedTier !== 'All' || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedTier('All');
                  setSelectedClassNum('All');
                  setSelectedSubject('All');
                  setSearchQuery('');
                }}
                style={{
                  background: '#f8fafc',
                  border: '1px solid var(--line)',
                  borderRadius: '20px',
                  padding: '10px 16px',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: 'var(--muted)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  minHeight: '42px',
                }}
              >
                Reset All Filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* Video Cards Presentation */}
      {filteredVideos.length === 0 ? (
        <div className="video-gallery-empty" style={{ textAlign: 'center', padding: '60px 20px', background: '#f8fafc', borderRadius: '16px', border: '1px dashed var(--line)' }}>
          <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--ink)', marginBottom: '8px' }}>
            No courses found matching "{searchQuery}".
          </p>
          <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '16px' }}>
            Try searching for another topic or reset the category filters.
          </p>
          <button
            type="button"
            className="action-btn active"
            onClick={() => {
              setSelectedTier('All');
              setSelectedClassNum('All');
              setSelectedSubject('All');
              setSearchQuery('');
            }}
          >
            Reset Filters
          </button>
        </div>
      ) : groupedBySubject ? (
        /* Render Grouped Subject-wise Sections */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
          {groupedBySubject.map((group) => (
            <div key={group.subjectName} className="subject-section" style={{ borderTop: '1px solid var(--line)', paddingTop: '24px' }}>
              {/* Subject Section Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#f0fdfa', border: '1px solid #ccfbf1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ThemeIcon name={group.iconName} size={20} color="var(--p-dark)" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--ink)' }}>
                      {group.subjectName}
                    </h3>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)' }}>
                      {group.tier}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedSubject(group.subjectName)}
                  style={{
                    background: 'none',
                    border: '1px solid var(--line)',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'var(--p-dark)',
                    cursor: 'pointer',
                  }}
                >
                  View Subject Only →
                </button>
              </div>

              {/* Grid of Video Cards for this Subject */}
              <div className="video-gallery-grid" style={{ '--desktop-cols': columns, marginBottom: group.relatedBooks.length > 0 ? '16px' : '0' }}>
                {group.videos.map((vid, idx) => (
                  <VideoCard key={(vid.id || vid.videoId || 'vid') + '-' + idx} video={vid} />
                ))}
              </div>

              {/* Related Books / Textbooks Reference Box */}
              {group.relatedBooks.length > 0 && (
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid var(--line)',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    marginTop: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      <ThemeIcon name="book" size={14} color="var(--p)" />
                      Recommended Textbooks & References
                    </span>
                    <Link to="/library" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--p-dark)', textDecoration: 'none' }}>
                      Browse All Textbooks →
                    </Link>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                    {group.relatedBooks.map((bk) => (
                      <Link
                        key={bk.id}
                        to={`/read/${bk.id}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '8px 12px',
                          background: '#ffffff',
                          border: '1px solid var(--line)',
                          borderRadius: '8px',
                          textDecoration: 'none',
                          color: 'var(--ink)',
                          transition: 'all 0.15s ease',
                        }}
                        className="book-resource-card"
                      >
                        <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#f0fdfa', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <ThemeIcon name="book" size={14} color="var(--p-dark)" />
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                          <div style={{ fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {bk.title}
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--muted)', fontWeight: 600 }}>
                            {bk.source || 'Open Text'} · {bk.level || bk.subject}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Direct Grid for Single Subject Filter or Search Results */
        <div>
          {selectedSubject !== 'All' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <ThemeIcon name={getSubjectIconName(selectedSubject)} size={22} color="var(--p-dark)" />
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--ink)' }}>
                {selectedSubject}
              </h3>
            </div>
          )}

          <div className="video-gallery-grid" style={{ '--desktop-cols': columns, marginBottom: '20px' }}>
            {filteredVideos.map((vid, idx) => (
              <VideoCard key={(vid.id || vid.videoId || 'vid') + '-' + idx} video={vid} />
            ))}
          </div>

          {/* Related Books for this selected subject */}
          {getMatchingBooks(selectedSubject, selectedClassNum, selectedTier).length > 0 && (
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid var(--line)',
                borderRadius: '12px',
                padding: '14px 18px',
                marginTop: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  <ThemeIcon name="book" size={14} color="var(--p)" />
                  Available Platform Textbooks for {selectedSubject}
                </span>
                <Link to="/library" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--p-dark)', textDecoration: 'none' }}>
                  Explore Open Library →
                </Link>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                {getMatchingBooks(selectedSubject, selectedClassNum, selectedTier).map((bk) => (
                  <Link
                    key={bk.id}
                    to={`/read/${bk.id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 14px',
                      background: '#ffffff',
                      border: '1px solid var(--line)',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      color: 'var(--ink)',
                      transition: 'all 0.15s ease',
                    }}
                    className="book-resource-card"
                  >
                    <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#f0fdfa', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <ThemeIcon name="book" size={16} color="var(--p-dark)" />
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {bk.title}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>
                        {bk.source || 'Open Text'} · {bk.level || bk.subject}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default VideoGallery;



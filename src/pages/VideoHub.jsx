import React, { useState, useMemo, useEffect } from 'react';
import { educationalVideos } from '../data/educationalVideos';
import { VideoGallery } from '../components/VideoGallery';
import { VideoCard } from '../components/VideoCard';
import { educationalGalleryData } from '../data/educationalGalleryData';
import { searchYouTubePlaylists, isValidThumbnail } from '../services/youtubeApi';
import { classCurriculumData } from '../data/classCurriculumData';

export function VideoHub() {
  const [selectedMainCategory, setSelectedMainCategory] = useState('All');
  const [selectedClassNum, setSelectedClassNum] = useState(10);
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [selectedChannel, setSelectedChannel] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [apiPlaylists, setApiPlaylists] = useState([]);
  const [isSearchingApi, setIsSearchingApi] = useState(false);

  const mainCategories = [
    'All',
    'Class 1 to 12 School Curriculum',
    'Learn Programming Languages',
    'Data Structures & Algorithms',
    'Web & Full-Stack Development',
    'Mobile App Development',
    'Core Computer Science & Operating Systems',
    'System Design & Software Architecture',
    'Artificial Intelligence & Machine Learning',
    'Cloud Computing, DevOps & Databases',
    'Government Exam Prep (UPSC/SSC/Bank)',
  ];

  const channels = [
    'All',
    'Physics Wallah',
    'Magnet Brains',
    'Khan Academy',
    'Sunil Panda',
    'Study IQ IAS',
    'Career Definer',
    'Gate Smashers',
    'NPTEL',
    'CodeWithHarry',
    'Apna College',
    'Chai aur Code (Hitesh Choudhary)',
    'Striver (takeUforward)',
    'Love Babbar',
    'The Cherno',
    'Programming with Mosh',
    'freeCodeCamp.org',
  ];

  const currentClassObject = classCurriculumData[selectedClassNum] || classCurriculumData[10];

  useEffect(() => {
    let activeQuery = '';

    if (selectedMainCategory === 'Class 1 to 12 School Curriculum') {
      if (selectedSubject && selectedSubject !== 'All' && currentClassObject.queries[selectedSubject]) {
        activeQuery = currentClassObject.queries[selectedSubject];
      } else {
        activeQuery = `Class ${selectedClassNum} NCERT Mathematics Science English complete course Magnet Brains Physics Wallah`;
      }
    } else if (selectedMainCategory === 'Government Exam Prep (UPSC/SSC/Bank)') {
      activeQuery = 'UPSC CSE SSC CGL Banking Quant Polity Geography Study IQ Career Definer';
    } else if (searchQuery.trim().length > 2) {
      activeQuery = searchQuery.trim();
    }

    if (!activeQuery) {
      setApiPlaylists([]);
      return;
    }

    let isMounted = true;
    setIsSearchingApi(true);

    searchYouTubePlaylists(activeQuery).then((results) => {
      if (isMounted) {
        const validResults = results.filter((p) => p && p.thumbnail && isValidThumbnail(p.thumbnail));
        setApiPlaylists(validResults);
        setIsSearchingApi(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [selectedMainCategory, selectedClassNum, selectedSubject, searchQuery]);

  const filteredVideos = useMemo(() => {
    return educationalVideos
      .map((v) => {
        if (!v) return null;
        const vId = v.videoId || v.id;
        const thumb = v.thumbnail || (vId ? `https://img.youtube.com/vi/${vId}/hqdefault.jpg` : null);
        return { ...v, thumbnail: thumb };
      })
      .filter((v) => {
        if (!v || !v.title) return false;

        const matchesCat =
          selectedMainCategory === 'All' ||
          selectedMainCategory === 'Class 1 to 12 School Curriculum' ||
          selectedMainCategory === 'Government Exam Prep (UPSC/SSC/Bank)' ||
          v.category === selectedMainCategory;

        const matchesChan =
          selectedChannel === 'All' ||
          (v.channel && v.channel.toLowerCase().includes(selectedChannel.split(' ')[0].toLowerCase()));

        const matchesSearch =
          !searchQuery.trim() ||
          Object.values(v).join(' ').toLowerCase().includes(searchQuery.toLowerCase());

        return matchesCat && matchesChan && matchesSearch;
      });
  }, [selectedMainCategory, selectedChannel, searchQuery]);

  const displayList = useMemo(() => {
    if (apiPlaylists.length > 0) {
      return [...apiPlaylists, ...filteredVideos];
    }
    return filteredVideos;
  }, [apiPlaylists, filteredVideos]);

  return (
    <section className="page" style={{ padding: '16px' }}>
      {/* Featured High Quality Educational Video Gallery */}
      <VideoGallery
        videos={educationalGalleryData}
        title="Featured Class 1–12 & Degree Playlists"
        subtitle="Full NCERT Class 1 to 12 playlists, B.Tech, UG/PG Degrees, and Govt Exam preparation courses."
        showFilters={true}
        columns={3}
      />

      <hr style={{ border: 0, borderTop: '1px solid var(--line)', margin: '32px 0' }} />

      <p className="eyebrow">COMPLETE K-12 & HIGHER ED CURRICULUM</p>
      <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '8px 0 12px', color: 'var(--ink)' }}>
        Class 1 to 12 All Subjects Video Vault
      </h2>
      <p className="intro" style={{ maxWidth: '800px', margin: '0 0 20px', color: 'var(--muted)', fontSize: '14px', lineHeight: 1.6 }}>
        Select any class from Class 1 to 12 to explore dedicated full-length course playlists for Mathematics, Physics, Chemistry, Biology, Social Studies, English, Hindi, Accountancy, Economics, and Computer Science.
      </p>

      {/* Main Category Tabs - Mobile Scrollable */}
      <div
        className="mode-tabs"
        style={{
          display: 'flex',
          flexWrap: 'nowrap',
          overflowX: 'auto',
          gap: '8px',
          margin: '16px 0',
          paddingBottom: '8px',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {mainCategories.map((cat) => (
          <button
            key={cat}
            type="button"
            className={`mode-btn ${selectedMainCategory === cat ? 'active' : ''}`}
            onClick={() => {
              setSelectedMainCategory(cat);
              setSelectedSubject('All');
            }}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              minHeight: '40px',
              flexShrink: 0,
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Dedicated Class 1 to 12 Selector Bar */}
      {selectedMainCategory === 'Class 1 to 12 School Curriculum' && (
        <div style={{ background: '#f8fafc', border: '1px solid var(--line)', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
          <h4 style={{ margin: '0 0 10px', color: 'var(--ink)', fontSize: '14px' }}>Select Class (Class 1 to 12):</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => {
                  setSelectedClassNum(num);
                  setSelectedSubject('All');
                }}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: selectedClassNum === num ? 800 : 600,
                  background: selectedClassNum === num ? 'var(--p)' : '#ffffff',
                  color: selectedClassNum === num ? '#ffffff' : 'var(--ink)',
                  border: selectedClassNum === num ? '1px solid var(--p)' : '1px solid var(--line)',
                  cursor: 'pointer',
                  minHeight: '40px',
                }}
              >
                Class {num}
              </button>
            ))}
          </div>

          <h4 style={{ margin: '14px 0 8px', color: 'var(--ink)', fontSize: '14px' }}>
            {currentClassObject.title} - Subjects:
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            <button
              type="button"
              onClick={() => setSelectedSubject('All')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: selectedSubject === 'All' ? 800 : 600,
                background: selectedSubject === 'All' ? '#eff6ff' : '#ffffff',
                color: selectedSubject === 'All' ? 'var(--p)' : 'var(--ink)',
                border: selectedSubject === 'All' ? '1px solid var(--p)' : '1px solid var(--line)',
                cursor: 'pointer',
                minHeight: '38px',
              }}
            >
              All Subjects
            </button>
            {currentClassObject.subjects.map((sub) => (
              <button
                key={sub}
                type="button"
                onClick={() => setSelectedSubject(sub)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: selectedSubject === sub ? 800 : 600,
                  background: selectedSubject === sub ? '#eff6ff' : '#ffffff',
                  color: selectedSubject === sub ? 'var(--p)' : 'var(--ink)',
                  border: selectedSubject === sub ? '1px solid var(--p)' : '1px solid var(--line)',
                  cursor: 'pointer',
                  minHeight: '38px',
                }}
              >
                📖 {sub}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search & Channel Filter Bar */}
      <div className="filters" style={{ margin: '20px 0 14px', display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search topics (e.g. Class 10 Light, Calculus)..."
          style={{ flex: 1, minWidth: '240px', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--line)', minHeight: '44px' }}
        />
        <select
          value={selectedChannel}
          onChange={(e) => setSelectedChannel(e.target.value)}
          style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--line)', minHeight: '44px' }}
        >
          {channels.map((ch) => (
            <option key={ch} value={ch}>
              Channel: {ch}
            </option>
          ))}
        </select>
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)' }}>{displayList.length} courses found</span>
      </div>

      {/* Loading Indicator */}
      {isSearchingApi && (
        <div style={{ padding: '12px 16px', background: '#eff6ff', color: 'var(--p)', borderRadius: '8px', marginBottom: '16px', fontWeight: 700, fontSize: '13px' }}>
          ⚡ Searching Playlists for Class {selectedClassNum} {selectedSubject !== 'All' ? `(${selectedSubject})` : ''}...
        </div>
      )}

      {/* Video Card Grid */}
      <div className="video-gallery-grid" style={{ '--desktop-cols': 3 }}>
        {displayList.map((vid) => (
          <VideoCard key={vid.id || vid.playlistId || vid.videoId} video={vid} />
        ))}
      </div>
    </section>
  );
}

export default VideoHub;

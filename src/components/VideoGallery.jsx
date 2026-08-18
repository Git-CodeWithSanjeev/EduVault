import React, { useState, useMemo, useEffect } from 'react';
import { VideoCard } from './VideoCard';
import { educationalGalleryData } from '../data/educationalGalleryData';
import { getStoredYouTubeApiKey, setStoredYouTubeApiKey, testYouTubeApiKey, isValidThumbnail } from '../services/youtubeApi';

/**
 * VideoGallery Component
 * Reusable, responsive grid gallery for YouTube videos & playlists.
 * Supports YouTube Data API v3 dynamic fetching with diagnostic API testing modal.
 */
export function VideoGallery({
  videos = educationalGalleryData,
  title = "Curated Educational Playlists",
  subtitle = "High-impact video courses with zero initial page load impact thanks to lazy-loaded embeds.",
  showFilters = true,
  columns = 3,
}) {
  const [selectedFocus, setSelectedFocus] = useState(() => sessionStorage.getItem('eduvault_vg_focus') || 'All');
  const [searchQuery, setSearchQuery] = useState(() => sessionStorage.getItem('eduvault_vg_q') || '');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [activeApiKey, setActiveApiKey] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [isTestingKey, setIsTestingKey] = useState(false);

  useEffect(() => {
    sessionStorage.setItem('eduvault_vg_focus', selectedFocus);
  }, [selectedFocus]);

  useEffect(() => {
    sessionStorage.setItem('eduvault_vg_q', searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const key = getStoredYouTubeApiKey();
    setActiveApiKey(key);
    setApiKeyInput(key);
  }, []);

  const handleTestKey = async () => {
    setIsTestingKey(true);
    setTestResult(null);
    const res = await testYouTubeApiKey(apiKeyInput);
    setTestResult(res);
    setIsTestingKey(false);
  };

  const handleSaveApiKey = (e) => {
    e.preventDefault();
    setStoredYouTubeApiKey(apiKeyInput);
    setActiveApiKey(apiKeyInput.trim());
    setTestResult(null);
    setShowApiKeyModal(false);
  };

  const handleClearApiKey = () => {
    setStoredYouTubeApiKey('');
    setApiKeyInput('');
    setActiveApiKey('');
    setTestResult(null);
    setShowApiKeyModal(false);
  };

  // Normalize list of videos with fallback thumbnail resolution
  const normalizedVideos = useMemo(() => {
    if (!Array.isArray(videos) || videos.length === 0) return [];
    return videos
      .map((v) => {
        if (typeof v === 'string') {
          return {
            id: v,
            title: `YouTube Video (${v})`,
            channel: 'YouTube Educator',
            focusArea: 'General',
            thumbnail: `https://img.youtube.com/vi/${v}/hqdefault.jpg`,
          };
        }
        const vId = v.videoId || v.id;
        const thumb = v.thumbnail || (vId ? `https://img.youtube.com/vi/${vId}/hqdefault.jpg` : null);
        return { ...v, thumbnail: thumb };
      })
      .filter((v) => v && v.title);
  }, [videos]);

  const focusAreas = useMemo(() => {
    const areas = new Set(
      normalizedVideos
        .map((v) => v.focusArea || v.category)
        .filter(Boolean)
    );
    return ['All', ...Array.from(areas)];
  }, [normalizedVideos]);

  const filteredVideos = useMemo(() => {
    return normalizedVideos.filter((v) => {
      const area = v.focusArea || v.category || '';
      const matchesFocus = selectedFocus === 'All' || area === selectedFocus;
      const fullText = `${v.title} ${v.channel} ${v.focusArea} ${v.whyHighQuality || ''}`.toLowerCase();
      const matchesSearch = !searchQuery.trim() || fullText.includes(searchQuery.toLowerCase());
      return matchesFocus && matchesSearch;
    });
  }, [normalizedVideos, selectedFocus, searchQuery]);

  const [filterOpen, setFilterOpen] = useState(false);

  return (
    <section className="video-gallery-section">
      {/* Gallery Header */}
      {(title || subtitle) && (
        <div className="video-gallery-header">
          <div>
            {title && <h2 className="video-gallery-title">{title}</h2>}
            {subtitle && <p className="video-gallery-subtitle">{subtitle}</p>}
          </div>
        </div>
      )}

      {/* API Key Modal / Form */}
      {showApiKeyModal && (
        <div
          style={{
            background: '#ffffff',
            border: '1px solid var(--p)',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px',
            boxShadow: 'var(--card-shadow)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h4 style={{ margin: 0, color: 'var(--ink)' }}>
              Cloud API Configuration
            </h4>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--p-dark)', background: '#ccfbf1', padding: '3px 8px', borderRadius: '6px' }}>
              Default Key Active
            </span>
          </div>
          <p style={{ margin: '0 0 14px', fontSize: '13px', color: 'var(--muted)', lineHeight: 1.5 }}>
            Active Key: <code>{activeApiKey ? `${activeApiKey.slice(0, 10)}...${activeApiKey.slice(-4)}` : 'None'}</code>. Dynamic playlist items, thumbnails, and lesson drawers are live-connected.
          </p>

          <form onSubmit={handleSaveApiKey} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="AIzaSy... (Enter API Key)"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              style={{
                flex: 1,
                minWidth: '280px',
                padding: '10px 14px',
                border: '1px solid var(--line)',
                borderRadius: '8px',
                fontSize: '13px',
              }}
            />
            <button
              type="button"
              onClick={handleTestKey}
              disabled={isTestingKey}
              style={{
                background: '#f4f1ff',
                color: 'var(--p)',
                border: '1px solid #d9d3f5',
                padding: '10px 14px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              {isTestingKey ? 'Testing...' : '🧪 Test Key'}
            </button>
            <button
              type="submit"
              style={{
                background: 'var(--p)',
                color: '#fff',
                border: 0,
                padding: '10px 18px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Save Key
            </button>
            {activeApiKey && (
              <button
                type="button"
                onClick={handleClearApiKey}
                style={{
                  background: '#fff0f0',
                  color: '#d93838',
                  border: '1px solid #ffd0d0',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Reset Default
              </button>
            )}
          </form>

          {/* Key Diagnostic Box */}
          {testResult && (
            <div
              style={{
                marginTop: '14px',
                padding: '12px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                lineHeight: 1.5,
                background: testResult.success ? '#f0fff4' : '#fff9f0',
                border: testResult.success ? '1px solid #b7eb8f' : '1px solid #ffe58f',
                color: testResult.success ? '#276749' : '#8c4b00',
              }}
            >
              <strong>{testResult.success ? '✅ API Key Connection Successful' : 'ℹ️ API Diagnostic Result'}:</strong>{' '}
              {testResult.message}
            </div>
          )}
        </div>
      )}

      {/* Modern Integrated Search and Filter Controls */}
      {showFilters && focusAreas.length > 2 && (
        <div className="video-gallery-controls" style={{ position: 'relative', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Search Input Box */}
            <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
              <input
                type="text"
                placeholder="Search playlists, topics, channels..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 42px 12px 16px',
                  background: 'var(--card)',
                  border: '1.5px solid var(--line)',
                  borderRadius: '20px',
                  fontSize: '14px',
                  color: 'var(--ink)',
                  outline: 'none',
                  boxShadow: 'var(--card-shadow)',
                  boxSizing: 'border-box',
                }}
              />
              {searchQuery ? (
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
                  aria-label="Clear search input"
                >
                  ✕
                </button>
              ) : null}
            </div>

            {/* Filter Trigger Button directly on the RIGHT of Search Box */}
            <button
              type="button"
              onClick={() => setFilterOpen(!filterOpen)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 18px',
                background: selectedFocus !== 'All' ? 'var(--p-gradient)' : '#e6f7f3',
                color: selectedFocus !== 'All' ? '#ffffff' : 'var(--p-dark)',
                border: selectedFocus !== 'All' ? '1px solid rgba(255,255,255,0.2)' : '1.5px solid rgba(13, 148, 136, 0.3)',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: selectedFocus !== 'All' ? '0 4px 14px var(--p-glow)' : '0 2px 8px rgba(13, 148, 136, 0.05)',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                whiteSpace: 'nowrap',
                minHeight: '44px',
              }}
              aria-expanded={filterOpen}
              aria-label="Toggle Topic Filters"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              <span>{selectedFocus === 'All' ? 'Filter Topics' : selectedFocus}</span>
              <span style={{ fontSize: '10px', opacity: 0.8 }}>{filterOpen ? '▲' : '▼'}</span>
            </button>

            {/* Quick Reset Button if a filter is active */}
            {selectedFocus !== 'All' && (
              <button
                type="button"
                onClick={() => setSelectedFocus('All')}
                style={{
                  background: 'none',
                  border: '1.5px solid var(--line)',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: 'var(--muted)',
                  cursor: 'pointer',
                  minHeight: '44px',
                }}
                title="Reset active topic filter"
              >
                ✕ Clear
              </button>
            )}
          </div>

          {/* Floating Dropdown Filter Options Panel */}
          {filterOpen && (
            <>
              <div
                onClick={() => setFilterOpen(false)}
                style={{ position: 'fixed', inset: 0, zIndex: 90 }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  left: 0,
                  maxWidth: '100%',
                  background: 'rgba(255, 255, 255, 0.98)',
                  backdropFilter: 'blur(16px)',
                  border: '1.5px solid rgba(13, 148, 136, 0.25)',
                  borderRadius: '16px',
                  padding: '16px',
                  boxShadow: '0 16px 40px rgba(13, 148, 136, 0.16)',
                  zIndex: 100,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid var(--line)' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--ink)', letterSpacing: '0.3px', textTransform: 'uppercase' }}>
                    Select Topic or Category ({focusAreas.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFocus('All');
                      setFilterOpen(false);
                    }}
                    style={{
                      background: 'none',
                      border: 0,
                      color: 'var(--p)',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Reset to All
                  </button>
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                    maxHeight: '280px',
                    overflowY: 'auto',
                    padding: '2px',
                  }}
                >
                  {focusAreas.map((area) => {
                    const isActive = selectedFocus === area;
                    return (
                      <button
                        key={area}
                        type="button"
                        onClick={() => {
                          setSelectedFocus(area);
                          setFilterOpen(false);
                        }}
                        style={{
                          padding: '8px 14px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: isActive ? 700 : 600,
                          cursor: 'pointer',
                          background: isActive ? 'var(--p-gradient)' : '#f8fafc',
                          color: isActive ? '#ffffff' : 'var(--ink)',
                          border: isActive ? '1px solid transparent' : '1px solid var(--line)',
                          boxShadow: isActive ? '0 4px 12px var(--p-glow)' : 'none',
                          transition: 'all 0.15s ease',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        {isActive ? '✓ ' : ''}{area}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Video Grid Layout */}
      {filteredVideos.length > 0 ? (
        <div
          className="video-gallery-grid"
          style={{ '--desktop-cols': columns }}
        >
          {filteredVideos.map((item, idx) => (
            <VideoCard key={(item.id || item.videoId || 'vg') + '-' + idx} video={item} />
          ))}
        </div>
      ) : (
        <div className="video-gallery-empty">
          <p>No videos found matching "{searchQuery}".</p>
          <button
            type="button"
            className="video-tab-btn active"
            onClick={() => {
              setSelectedFocus('All');
              setSearchQuery('');
            }}
          >
            Reset Filters
          </button>
        </div>
      )}
    </section>
  );
}

export default VideoGallery;

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
  const [selectedFocus, setSelectedFocus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [activeApiKey, setActiveApiKey] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [isTestingKey, setIsTestingKey] = useState(false);

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

  return (
    <section className="video-gallery-section">
      {/* Gallery Header */}
      {(title || subtitle) && (
        <div className="video-gallery-header">
          <p className="eyebrow">HIGH-QUALITY PLAYLISTS</p>
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
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--p)', background: '#efecff', padding: '3px 8px', borderRadius: '6px' }}>
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

      {/* Filter Controls */}
      {showFilters && focusAreas.length > 2 && (
        <div className="video-gallery-controls">
          <div className="video-gallery-search">
            <input
              type="text"
              placeholder="Search playlists, topics, channels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="video-search-input"
            />
          </div>

          <div className="video-gallery-tabs">
            {focusAreas.map((area) => (
              <button
                key={area}
                type="button"
                className={`video-tab-btn ${selectedFocus === area ? 'active' : ''}`}
                onClick={() => setSelectedFocus(area)}
              >
                {area}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Video Grid Layout */}
      {filteredVideos.length > 0 ? (
        <div
          className="video-gallery-grid"
          style={{ '--desktop-cols': columns }}
        >
          {filteredVideos.map((item, idx) => (
            <VideoCard key={item.id || item.videoId || idx} video={item} />
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

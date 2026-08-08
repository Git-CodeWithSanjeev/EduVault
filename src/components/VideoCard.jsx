import React, { useState, useEffect } from 'react';
import { fetchYouTubePlaylistItems, fetchYouTubePlaylistDetails } from '../services/youtubeApi';

/**
 * VideoCard Component
 * Embeds full YouTube Playlists with interactive in-card video lesson selector.
 * Dynamically fetches playlist items via YouTube Data API v3 or RSS Feed fallback.
 */
export function VideoCard({ video }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [apiData, setApiData] = useState(null);
  const [thumbSrc, setThumbSrc] = useState(null);
  const [hasThumbError, setHasThumbError] = useState(false);
  const [showPlaylistDrawer, setShowPlaylistDrawer] = useState(false);
  const [dynamicLessons, setDynamicLessons] = useState(null);
  const [dataSource, setDataSource] = useState(null);
  const [isFetchingApi, setIsFetchingApi] = useState(false);

  // Normalize initial video prop
  const initialVideoId = typeof video === 'string' ? video : (video.videoId || video.id);
  const playlistId = typeof video === 'object' ? video.playlistId : null;

  const [selectedVideoId, setSelectedVideoId] = useState(initialVideoId);

  const initialObj = typeof video === 'string'
    ? {
        id: initialVideoId,
        playlistId: null,
        title: `YouTube Playlist/Video (${initialVideoId})`,
        channel: 'Educational Channel',
        focusArea: 'General',
        whyHighQuality: '',
        duration: null,
        videoCount: null,
        lessons: [],
      }
    : {
        id: initialVideoId,
        playlistId: video.playlistId || null,
        title: video.title || 'Untitled Playlist Course',
        channel: video.channel || 'Educational Channel',
        focusArea: video.focusArea || video.category || 'Education',
        whyHighQuality: video.whyHighQuality || video.description || '',
        duration: video.duration || (video.playlistId ? 'Full Playlist' : null),
        videoCount: video.videoCount || null,
        thumbnail: video.thumbnail,
        lessons: video.lessons || [],
      };

  // Dynamically query YouTube Data API v3 / RSS playlistItems endpoint
  useEffect(() => {
    if (!playlistId) return;

    let isMounted = true;
    setIsFetchingApi(true);

    fetchYouTubePlaylistItems(playlistId)
      .then((items) => {
        if (isMounted && items && items.length > 0) {
          setDynamicLessons(items);
          setDataSource(items[0]?.source || 'api');
          if (items[0] && items[0].thumbnail && !thumbSrc) {
            setThumbSrc(items[0].thumbnail);
          }
          if (items[0] && items[0].videoId && !selectedVideoId) {
            setSelectedVideoId(items[0].videoId);
          }
        }
      })
      .finally(() => {
        if (isMounted) setIsFetchingApi(false);
      });

    // Fetch Playlist Details
    fetchYouTubePlaylistDetails(playlistId).then((details) => {
      if (isMounted && details) {
        setApiData(details);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [playlistId]);

  // Lessons list priority: YouTube API/RSS -> item.lessons -> default fallback
  const lessonsList = dynamicLessons || (initialObj.lessons && initialObj.lessons.length > 0
    ? initialObj.lessons
    : [
        { id: 1, videoId: initialVideoId, title: '1. Complete Course Overview & Intro', duration: '35m' },
        { id: 2, videoId: initialVideoId, title: '2. Core Principles & Setup Masterclass', duration: '45m' },
        { id: 3, videoId: initialVideoId, title: '3. Detailed Topic Deep Dive & Examples', duration: '50m' },
        { id: 4, videoId: initialVideoId, title: '4. Advanced Techniques & Practice Exercises', duration: '1h 10m' },
      ]);

  // Determine thumbnail source
  useEffect(() => {
    if (initialObj.thumbnail) {
      setThumbSrc(initialObj.thumbnail);
    } else if (selectedVideoId) {
      setThumbSrc(`https://img.youtube.com/vi/${selectedVideoId}/hqdefault.jpg`);
    }
  }, [selectedVideoId, initialObj.thumbnail]);

  const handlePlay = (vidId) => {
    if (vidId) {
      setSelectedVideoId(vidId);
    }
    setIsPlaying(true);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handlePlay();
    }
  };

  const [imageLoadFailed, setImageLoadFailed] = useState(false);

  const handleImageError = () => {
    if (!hasThumbError && selectedVideoId) {
      setHasThumbError(true);
      setThumbSrc(`https://img.youtube.com/vi/${selectedVideoId}/mqdefault.jpg`);
    } else {
      setImageLoadFailed(true);
    }
  };

  // AUTOMATIC REMOVAL: Do not render card if thumbnail fails to load
  if (imageLoadFailed) {
    return null;
  }

  // Construct iframe embed URL for playlist vs single video
  let embedSrc = '';
  if (playlistId) {
    if (selectedVideoId) {
      embedSrc = `https://www.youtube.com/embed/${selectedVideoId}?list=${playlistId}&autoplay=1&rel=0`;
    } else {
      embedSrc = `https://www.youtube.com/embed/videoseries?list=${playlistId}&autoplay=1&rel=0`;
    }
  } else {
    embedSrc = `https://www.youtube.com/embed/${selectedVideoId}?autoplay=1&rel=0`;
  }

  // External YouTube Link
  const externalLink = playlistId
    ? `https://www.youtube.com/playlist?list=${playlistId}`
    : `https://www.youtube.com/watch?v=${selectedVideoId}`;

  const displayTitle = apiData?.title || initialObj.title;
  const displayChannel = apiData?.channel || initialObj.channel;

  // Source Badge text & styling
  const sourceLabel = dataSource === 'api'
    ? '⚡ Verified Live Playlist'
    : dataSource === 'rss'
    ? '📡 Live Playlist'
    : '📋 Playlist';

  return (
    <div className="video-card-container">
      {/* Aspect Ratio Media Frame */}
      <div className="video-aspect-box">
        {!isPlaying ? (
          <div
            className="video-thumbnail-wrapper"
            onClick={() => handlePlay(selectedVideoId)}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            role="button"
            aria-label={`Play playlist: ${displayTitle}`}
          >
            {thumbSrc && (
              <img
                src={thumbSrc}
                alt={displayTitle}
                className="video-thumbnail-img"
                loading="lazy"
                onError={handleImageError}
              />
            )}
            <div className="video-thumbnail-overlay">
              <div className="video-play-btn" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>

              {/* Playlist Badge */}
              <span className="video-duration-badge" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {playlistId ? `📑 Playlist (${lessonsList.length})` : (initialObj.duration || 'Video')}
              </span>
            </div>
          </div>
        ) : (
          <iframe
            src={embedSrc}
            title={displayTitle}
            className="video-iframe"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        )}
      </div>

      {/* Card Content */}
      <div className="video-card-body">
        <div className="video-card-header">
          {initialObj.focusArea && (
            <span className="video-badge-focus">{initialObj.focusArea}</span>
          )}
          {displayChannel && (
            <span className="video-channel-name">📺 {displayChannel}</span>
          )}
        </div>

        <h3 className="video-card-title">{displayTitle}</h3>

        {initialObj.whyHighQuality && (
          <p className="video-card-reason">
            <strong>Why It's High Quality:</strong> {initialObj.whyHighQuality}
          </p>
        )}

        {/* Dynamic YouTube Playlist Selector Box */}
        <div className="playlist-selector-box" style={{ marginTop: '12px' }}>
          <button
            type="button"
            onClick={() => setShowPlaylistDrawer(!showPlaylistDrawer)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              background: dataSource === 'api' ? '#efecff' : '#f4f1ff',
              border: dataSource === 'api' ? '1px solid #725de0' : '1px solid #d9d3f5',
              borderRadius: '8px',
              color: 'var(--p)',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <span>
              {sourceLabel} ({lessonsList.length} Videos)
            </span>
            <span>{showPlaylistDrawer ? '▲ Hide' : '▼ Select Video'}</span>
          </button>

          {showPlaylistDrawer && (
            <div
              style={{
                marginTop: '8px',
                background: '#faf9fd',
                border: '1px solid var(--line)',
                borderRadius: '8px',
                padding: '6px',
                maxHeight: '190px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              {lessonsList.map((les) => {
                const isCurrent = isPlaying && selectedVideoId === les.videoId;
                return (
                  <button
                    key={les.id || les.videoId}
                    type="button"
                    onClick={() => handlePlay(les.videoId)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justify: 'space-between',
                      textAlign: 'left',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: isCurrent ? 800 : 600,
                      background: isCurrent ? '#efecff' : '#ffffff',
                      border: isCurrent ? '1px solid var(--p)' : '1px solid var(--line)',
                      color: isCurrent ? 'var(--p)' : 'var(--ink)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '6px' }}>
                      {isCurrent ? '▶ ' : '• '}{les.title}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--muted)', fontWeight: 700 }}>
                      {les.duration || 'Watch'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Bar */}
        <div style={{ marginTop: 'auto', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <a
            href={externalLink}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 700, textDecoration: 'none' }}
          >
            🔗 Open Playlist ↗
          </a>
          <button
            type="button"
            onClick={() => handlePlay(selectedVideoId)}
            style={{
              background: isPlaying ? '#efecff' : 'var(--p)',
              color: isPlaying ? 'var(--p)' : '#fff',
              border: 0,
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 700,
            }}
          >
            {isPlaying ? 'Playing Playlist' : '▶ Play Playlist'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default VideoCard;

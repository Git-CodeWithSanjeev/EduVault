import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchYouTubePlaylistItems, fetchYouTubePlaylistDetails } from '../services/youtubeApi';
import { useVideoLearning } from '../hooks/useVideoLearning';

/**
 * VideoCard Component
 * Displays video & playlist cards with direct navigation to the dedicated Video Details Learning Page.
 */
export function VideoCard({ video }) {
  const navigate = useNavigate();
  const { getCourseProgress, isBookmarked, isSaved, toggleBookmark, toggleSave } = useVideoLearning();

  const [apiData, setApiData] = useState(null);
  const [thumbSrc, setThumbSrc] = useState(null);
  const [hasThumbError, setHasThumbError] = useState(false);
  const [dynamicLessons, setDynamicLessons] = useState(null);
  const [dataSource, setDataSource] = useState(null);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);

  // Normalize initial video prop
  const initialVideoId = typeof video === 'string' ? video : (video.videoId || video.id);
  const playlistId = typeof video === 'object' ? video.playlistId : null;
  const targetId = typeof video === 'object' ? (video.id || initialVideoId) : initialVideoId;

  const initialObj = typeof video === 'string'
    ? {
        id: initialVideoId,
        playlistId: null,
        title: `YouTube Video Course (${initialVideoId})`,
        channel: 'Educational Channel',
        focusArea: 'General',
        whyHighQuality: '',
        duration: 'Video Course',
        thumbnail: `https://img.youtube.com/vi/${initialVideoId}/hqdefault.jpg`,
        lessons: [],
      }
    : {
        id: video.id || initialVideoId,
        playlistId: video.playlistId || null,
        title: video.title || 'Educational Course',
        channel: video.channel || 'Educational Channel',
        focusArea: video.focusArea || video.category || 'Education',
        whyHighQuality: video.whyHighQuality || video.description || '',
        duration: video.duration || (video.playlistId ? 'Full Course' : 'Video'),
        thumbnail: video.thumbnail,
        lessons: video.lessons || [],
      };

  // Query YouTube Data API v3 or RSS fallback
  useEffect(() => {
    if (!playlistId) return;

    let isMounted = true;
    fetchYouTubePlaylistItems(playlistId).then((items) => {
      if (isMounted && items && items.length > 0) {
        setDynamicLessons(items);
        setDataSource(items[0]?.source || 'api');
        if (items[0] && items[0].thumbnail && !thumbSrc) {
          setThumbSrc(items[0].thumbnail);
        }
      }
    });

    fetchYouTubePlaylistDetails(playlistId).then((details) => {
      if (isMounted && details) {
        setApiData(details);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [playlistId]);

  const lessonsCount = dynamicLessons ? dynamicLessons.length : (initialObj.lessons?.length || 4);
  const progressPercent = getCourseProgress(targetId, lessonsCount);

  // Set initial thumbnail source
  useEffect(() => {
    if (initialObj.thumbnail) {
      setThumbSrc(initialObj.thumbnail);
    } else if (initialVideoId) {
      setThumbSrc(`https://img.youtube.com/vi/${initialVideoId}/hqdefault.jpg`);
    }
  }, [initialVideoId, initialObj.thumbnail]);

  const handleImageError = () => {
    if (!hasThumbError && initialVideoId) {
      setHasThumbError(true);
      setThumbSrc(`https://img.youtube.com/vi/${initialVideoId}/mqdefault.jpg`);
    } else {
      setImageLoadFailed(true);
    }
  };

  if (imageLoadFailed) {
    return null;
  }

  const displayTitle = apiData?.title || initialObj.title;
  const displayChannel = apiData?.channel || initialObj.channel;
  const videoDetailsUrl = `/video/${targetId}`;

  const bookmarked = isBookmarked(targetId);
  const saved = isSaved(targetId);

  return (
    <div className="video-card-container">
      {/* Aspect Ratio Media Frame -> Navigates to Video Details Page */}
      <div className="video-aspect-box">
        <Link
          to={videoDetailsUrl}
          className="video-thumbnail-wrapper"
          aria-label={`Open video course: ${displayTitle}`}
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

            {/* Playlist/Duration Badge */}
            <span className="video-duration-badge" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {playlistId ? `📑 Playlist (${lessonsCount})` : (initialObj.duration || 'Video')}
            </span>
          </div>
        </Link>
      </div>

      {/* Card Content */}
      <div className="video-card-body">
        <div className="video-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {initialObj.focusArea && (
            <span className="video-badge-focus">{initialObj.focusArea}</span>
          )}
          {displayChannel && (
            <span className="video-channel-name">📺 {displayChannel}</span>
          )}
        </div>

        {/* Title -> Direct Link */}
        <h3 className="video-card-title">
          <Link to={videoDetailsUrl} style={{ color: 'inherit', textDecoration: 'none' }}>
            {displayTitle}
          </Link>
        </h3>

        {initialObj.whyHighQuality && (
          <p className="video-card-reason" style={{ WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            <strong>Overview:</strong> {initialObj.whyHighQuality}
          </p>
        )}

        {/* Progress Bar (if course has progress) */}
        {progressPercent > 0 && (
          <div style={{ margin: '10px 0 6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--accent)', fontWeight: 700, marginBottom: '4px' }}>
              <span>Progress</span>
              <span>{progressPercent}%</span>
            </div>
            <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${progressPercent}%`, height: '100%', background: 'var(--accent)', transition: 'width 0.3s ease' }} />
            </div>
          </div>
        )}

        {/* Quick Action & Details Link Bar */}
        <div style={{ marginTop: 'auto', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              onClick={() => toggleBookmark(targetId)}
              title={bookmarked ? 'Remove Bookmark' : 'Bookmark Video'}
              style={{
                background: bookmarked ? '#eff6ff' : '#f8fafc',
                border: '1px solid var(--line)',
                borderRadius: '6px',
                padding: '6px 10px',
                fontSize: '13px',
                cursor: 'pointer',
                minHeight: '36px',
              }}
            >
              {bookmarked ? '🔖' : '📑'}
            </button>
            <button
              type="button"
              onClick={() => toggleSave(targetId)}
              title={saved ? 'Saved in Wishlist' : 'Save Video'}
              style={{
                background: saved ? '#fef2f2' : '#f8fafc',
                border: '1px solid var(--line)',
                borderRadius: '6px',
                padding: '6px 10px',
                fontSize: '13px',
                cursor: 'pointer',
                minHeight: '36px',
              }}
            >
              {saved ? '❤️' : '🤍'}
            </button>
          </div>

          <Link
            to={videoDetailsUrl}
            className="action-btn"
            style={{
              background: 'var(--p)',
              color: '#ffffff',
              border: 0,
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 700,
              textDecoration: 'none',
              minHeight: '40px',
            }}
          >
            Start Learning →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default VideoCard;

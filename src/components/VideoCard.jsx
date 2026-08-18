import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchYouTubePlaylistItems, fetchYouTubePlaylistDetails } from '../services/youtubeApi';
import { useVideoLearning } from '../hooks/useVideoLearning';
import { useAuth } from '../context/AuthContext';

/**
 * VideoCard Component
 * Displays video & playlist cards with direct navigation to the dedicated Video Details Learning Page.
 */
export function VideoCard({ video }) {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const { getCourseProgress, isSaved, toggleSave } = useVideoLearning();

  const handleSaveClick = (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    toggleSave(targetId);
  };

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
      setThumbSrc('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80');
    }
  };

  const displayTitle = initialObj.title || apiData?.title;
  const displayChannel = initialObj.channel || apiData?.channel;
  const videoDetailsUrl = `/video/${targetId}`;

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
            <span className="video-channel-name" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="15" rx="2" />
                <polygon points="10 9 15 11.5 10 14 10 9" fill="currentColor" />
              </svg>
              <span>{displayChannel}</span>
            </span>
          )}
        </div>

        {/* Title -> Direct Link */}
        <h3 className="video-card-title">
          <Link to={videoDetailsUrl} style={{ color: 'inherit', textDecoration: 'none' }}>
            {displayTitle}
          </Link>
        </h3>

        {initialObj.whyHighQuality && (
          <div className="video-card-reason">
            <span className="video-card-reason-label">Overview:</span>
            <span className="video-card-reason-text">
              {initialObj.whyHighQuality}
            </span>
          </div>
        )}

        {/* Progress Bar (if course has progress) */}
        {progressPercent > 0 && (
          <div style={{ margin: '10px 0 6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--p-dark)', fontWeight: 700, marginBottom: '4px' }}>
              <span>Progress</span>
              <span>{progressPercent}%</span>
            </div>
            <div style={{ height: '6px', background: '#ccebe4', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${progressPercent}%`, height: '100%', background: 'var(--p-gradient)', transition: 'width 0.3s ease' }} />
            </div>
          </div>
        )}

        {/* Quick Action & Details Link Bar */}
        <div style={{ marginTop: 'auto', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={handleSaveClick}
              title={saved ? 'Remove from Favorites' : 'Save to Favorites'}
              className={`card-heart-btn ${saved ? 'saved' : ''}`}
              aria-label={saved ? 'Remove from Favorites' : 'Save to Favorites'}
            >
              <svg
                className="card-heart-icon"
                viewBox="0 0 24 24"
                fill={saved ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="1.65"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
            </button>
          </div>

          <Link
            to={videoDetailsUrl}
            className="action-btn"
            style={{
              background: 'var(--p)',
              color: '#ffffff',
              border: 0,
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 700,
              textDecoration: 'none',
              minHeight: '40px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
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

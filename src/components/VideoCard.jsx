import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchYouTubePlaylistItems, fetchYouTubePlaylistDetails } from '../services/youtubeApi';
import { useVideoLearning } from '../hooks/useVideoLearning';
import { useAuth } from '../context/AuthContext';

/**
 * VideoCard Component
 * Displays video & playlist cards with direct navigation to the dedicated Video Details Learning Page.
 */
export const VideoCard = React.memo(function VideoCard({ video }) {
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

  const lessonsCount = dynamicLessons ? dynamicLessons.length : (initialObj.lessons?.length || 24);
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

  const levelBadge = (video.tier === 'Undergraduate (UG)' || String(video.level || '').toUpperCase().includes('UG'))
    ? 'UG'
    : (video.classNum ? `Class ${video.classNum}` : (video.level || 'Class 12'));

  const durationText = playlistId ? `${lessonsCount} Videos` : (initialObj.duration || '12 Hours · 24 Videos');

  return (
    <div
      className="video-card-container flex flex-col h-full"
      style={{
        background: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 4px 18px rgba(15, 94, 83, 0.05)',
        border: 'none',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
    >
      {/* 16:9 Aspect Ratio Media Frame */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', background: '#0f172a', overflow: 'hidden' }}>
        <Link
          to={videoDetailsUrl}
          style={{ display: 'block', width: '100%', height: '100%', position: 'relative' }}
          aria-label={`Open video course: ${displayTitle}`}
        >
          {thumbSrc && (
            <img
              src={thumbSrc}
              alt={displayTitle}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              loading="lazy"
              decoding="async"
              onError={handleImageError}
            />
          )}

          {/* Exactly ONE Top-Left Level Badge */}
          <span
            style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              background: 'rgba(15, 23, 42, 0.78)',
              backdropFilter: 'blur(6px)',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 700,
              padding: '3px 9px',
              borderRadius: '6px',
              letterSpacing: '0.2px',
              zIndex: 3,
            }}
          >
            {levelBadge}
          </span>

          {/* Centered Circular Play Button */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.28)',
              backdropFilter: 'blur(6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
              zIndex: 2,
            }}
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
              <polygon points="8 5 19 12 8 19 8 5" />
            </svg>
          </div>

          {/* Bottom Duration & Video Count Strip */}
          <div
            style={{
              position: 'absolute',
              bottom: '10px',
              left: '10px',
              background: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(4px)',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 600,
              padding: '3px 8px',
              borderRadius: '5px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              zIndex: 3,
            }}
          >
            <span style={{ fontSize: '10px' }}>▶</span>
            <span>{durationText}</span>
          </div>
        </Link>
      </div>

      {/* Card Body */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* Title (2-line clamp) */}
        <h3
          style={{
            fontSize: '15px',
            fontWeight: 800,
            color: '#0f172a',
            margin: '0 0 6px',
            lineHeight: 1.35,
            minHeight: '2.7rem',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          <Link to={videoDetailsUrl} style={{ color: 'inherit', textDecoration: 'none' }}>
            {displayTitle}
          </Link>
        </h3>

        {/* Clean 2-Line Description (Old harsh OVERVIEW: box completely removed) */}
        <p
          style={{
            fontSize: '12.5px',
            color: '#64748b',
            margin: '0 0 14px',
            lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {initialObj.whyHighQuality || video.description || 'Structured academic masterclass covering core theory, proofs, and real-world problem sets.'}
        </p>

        {/* Progress Bar (if course in progress) */}
        {progressPercent > 0 && (
          <div style={{ margin: '0 0 10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#0F5E53', fontWeight: 700, marginBottom: '3px' }}>
              <span>Progress</span>
              <span>{progressPercent}%</span>
            </div>
            <div style={{ height: '5px', background: '#E6F4F1', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${progressPercent}%`, height: '100%', background: '#0F5E53', transition: 'width 0.3s ease' }} />
            </div>
          </div>
        )}

        {/* Creator Footer with Avatar & Bookmark */}
        <div
          style={{
            marginTop: 'auto',
            paddingTop: '10px',
            borderTop: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: '#E6F4F1',
                color: '#0F5E53',
                fontSize: '11px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {(displayChannel || 'C').slice(0, 1).toUpperCase()}
            </div>
            <span
              style={{
                fontSize: '12px',
                color: '#64748b',
                fontWeight: 600,
                maxWidth: '160px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={displayChannel}
            >
              {displayChannel}
            </span>
          </div>

          <button
            type="button"
            onClick={handleSaveClick}
            title={saved ? 'Remove from Favorites' : 'Save to Favorites'}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: saved ? '#0F5E53' : '#94a3b8',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              transition: 'color 0.15s ease',
            }}
            aria-label={saved ? 'Remove from Favorites' : 'Save to Favorites'}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill={saved ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
});

export default VideoCard;

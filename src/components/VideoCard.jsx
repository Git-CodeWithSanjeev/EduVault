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

  const isRightBadge = video.badgePosition === 'right' || levelBadge === 'UG';
  const badgeStyle = isRightBadge
    ? { position: 'absolute', top: '10px', right: '10px', zIndex: 3 }
    : { position: 'absolute', top: '10px', left: '10px', zIndex: 3 };

  // Custom visual artwork SVG matching the attached design
  const renderArtwork = () => {
    const t = (displayTitle || '').toLowerCase();
    if (video.theme === 'quantum' || t.includes('quantum')) {
      return (
        <svg viewBox="0 0 320 180" style={{ width: '100%', height: '100%', objectFit: 'cover' }}>
          <rect width="320" height="180" fill="#080f1e" />
          <defs>
            <radialGradient id="qGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="1" />
              <stop offset="35%" stopColor="#ea580c" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#080f1e" stopOpacity="0" />
            </radialGradient>
          </defs>
          {/* Orbital Waves & Ellipses */}
          <ellipse cx="160" cy="90" rx="100" ry="36" stroke="#38bdf8" strokeWidth="1.8" transform="rotate(-25 160 90)" opacity="0.85" />
          <ellipse cx="160" cy="90" rx="90" ry="32" stroke="#818cf8" strokeWidth="1.8" strokeDasharray="6 3" transform="rotate(35 160 90)" opacity="0.75" />
          <ellipse cx="160" cy="90" rx="95" ry="30" stroke="#06b6d4" strokeWidth="1.8" transform="rotate(90 160 90)" opacity="0.75" />
          {/* Orbiting particles */}
          <circle cx="85" cy="55" r="4" fill="#38bdf8" filter="drop-shadow(0 0 6px #38bdf8)" />
          <circle cx="235" cy="125" r="4" fill="#38bdf8" filter="drop-shadow(0 0 6px #38bdf8)" />
          <circle cx="110" cy="120" r="3.5" fill="#f472b6" />
          <circle cx="210" cy="60" r="3.5" fill="#f472b6" />
          {/* Glowing Center Core */}
          <circle cx="160" cy="90" r="38" fill="url(#qGlow)" />
          <circle cx="160" cy="90" r="14" fill="#fef08a" />
          <circle cx="160" cy="90" r="9" fill="#f59e0b" />
        </svg>
      );
    }
    if (video.theme === 'organic-chem' || t.includes('organic chemistry')) {
      return (
        <svg viewBox="0 0 320 180" style={{ width: '100%', height: '100%', objectFit: 'cover' }}>
          <rect width="320" height="180" fill="#041b24" />
          <defs>
            <radialGradient id="chemFlaskGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fef08a" stopOpacity="0.95" />
              <stop offset="60%" stopColor="#eab308" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ca8a04" stopOpacity="0.1" />
            </radialGradient>
          </defs>
          {/* Erlenmeyer Flask */}
          <path d="M148 55 L158 55 L158 75 L130 130 C125 140 132 148 142 148 L178 148 C188 148 195 140 190 130 L162 75 L162 55 L172 55" stroke="#67e8f9" strokeWidth="2.5" fill="none" opacity="0.8" />
          {/* Glowing Liquid in Flask */}
          <path d="M136 122 L142 110 Q160 115 178 110 L184 122 C188 130 184 144 176 144 L144 144 C136 144 132 130 136 122 Z" fill="url(#chemFlaskGlow)" />
          {/* Bubbles */}
          <circle cx="155" cy="120" r="3" fill="#ffffff" opacity="0.8" />
          <circle cx="165" cy="128" r="2.5" fill="#ffffff" opacity="0.7" />
          <circle cx="160" cy="95" r="2" fill="#fef08a" opacity="0.9" />
          {/* Molecular Bond Model on the right */}
          <g transform="translate(45, 10)">
            <line x1="175" y1="80" x2="205" y2="105" stroke="#fdba74" strokeWidth="3" opacity="0.7" />
            <line x1="205" y1="105" x2="235" y2="85" stroke="#fdba74" strokeWidth="3" opacity="0.7" />
            <line x1="205" y1="105" x2="205" y2="135" stroke="#fdba74" strokeWidth="3" opacity="0.7" />
            <circle cx="175" cy="80" r="8" fill="#f97316" />
            <circle cx="205" cy="105" r="10" fill="#facc15" />
            <circle cx="235" cy="85" r="8" fill="#f97316" />
            <circle cx="205" cy="135" r="7" fill="#fb923c" />
          </g>
        </svg>
      );
    }
    if (video.theme === 'cs-tech' || t.includes('computer science')) {
      return (
        <svg viewBox="0 0 320 180" style={{ width: '100%', height: '100%', objectFit: 'cover' }}>
          <rect width="320" height="180" fill="#091322" />
          {/* Monitor Screen Frame */}
          <rect x="105" y="45" width="110" height="75" rx="6" stroke="#38bdf8" strokeWidth="2" fill="#0a192f" />
          <line x1="160" y1="120" x2="160" y2="138" stroke="#38bdf8" strokeWidth="2.5" />
          <line x1="145" y1="138" x2="175" y2="138" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
          {/* Code lines in monitor */}
          <line x1="115" y1="58" x2="155" y2="58" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
          <line x1="115" y1="68" x2="185" y2="68" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" />
          <line x1="125" y1="78" x2="170" y2="78" stroke="#fb923c" strokeWidth="2" strokeLinecap="round" />
          <line x1="125" y1="88" x2="195" y2="88" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
          <line x1="115" y1="98" x2="145" y2="98" stroke="#f472b6" strokeWidth="2" strokeLinecap="round" />
          <line x1="115" y1="108" x2="165" y2="108" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" />
          {/* Beaker with cyan glow on the left */}
          <path d="M68 95 L68 135 C68 140 73 144 78 144 L92 144 C97 144 102 140 102 135 L102 95 Z" stroke="#38bdf8" strokeWidth="2" fill="none" opacity="0.8" />
          <rect x="70" y="112" width="30" height="30" rx="3" fill="#06b6d4" opacity="0.65" />
          <circle cx="85" cy="124" r="2.5" fill="#ffffff" opacity="0.8" />
          <circle cx="78" cy="132" r="2" fill="#ffffff" opacity="0.7" />
          {/* Flask on the right */}
          <path d="M225 110 L232 95 L238 95 L245 110 L255 136 C258 142 254 145 248 145 L222 145 C216 145 212 142 215 136 Z" stroke="#38bdf8" strokeWidth="2" fill="none" opacity="0.7" />
          <path d="M219 130 L226 116 L244 116 L251 130 C253 138 250 142 245 142 L225 142 C220 142 217 138 219 130 Z" fill="#38bdf8" opacity="0.5" />
        </svg>
      );
    }
    return null;
  };

  const customArtwork = renderArtwork();

  return (
    <div
      className="video-card-container flex flex-row md:flex-col h-full bg-white rounded-2xl shadow-sm overflow-hidden p-2.5 sm:p-3 md:p-0 transition-all duration-200"
      style={{
        border: 'none',
        boxShadow: '0 4px 18px rgba(15, 94, 83, 0.05)',
      }}
    >
      {/* 16:9 Aspect Ratio Media Frame (Left horizontal side on mobile, top full width on tablet/desktop) */}
      <div className="w-[44%] sm:w-[42%] md:w-full shrink-0 relative aspect-[16/9] bg-[#0f172a] rounded-xl md:rounded-none overflow-hidden">
        <Link
          to={videoDetailsUrl}
          style={{ display: 'block', width: '100%', height: '100%', position: 'relative' }}
          aria-label={`Open video course: ${displayTitle}`}
        >
          {customArtwork || (thumbSrc && (
            <img
              src={thumbSrc}
              alt={displayTitle}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              loading="lazy"
              decoding="async"
              onError={handleImageError}
            />
          ))}

          {/* Top Left Badge: Class 12 */}
          <span
            style={{
              position: 'absolute',
              top: '8px',
              left: '8px',
              zIndex: 3,
              background: '#0369a1',
              color: '#ffffff',
              fontSize: '10px',
              fontWeight: 700,
              padding: '2px 7px',
              borderRadius: '5px',
              letterSpacing: '0.2px',
            }}
          >
            Class 12
          </span>

          {/* Top Right Badge: UG */}
          <span
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              zIndex: 3,
              background: '#047857',
              color: '#ffffff',
              fontSize: '10px',
              fontWeight: 700,
              padding: '2px 7px',
              borderRadius: '5px',
              letterSpacing: '0.2px',
            }}
          >
            UG
          </span>

          {/* Centered Circular Play Button */}
          <div
            className="w-8 h-8 sm:w-9 sm:h-9 md:w-11 md:h-11"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
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
            <svg viewBox="0 0 24 24" className="w-4 h-4 md:w-5 md:h-5" fill="currentColor">
              <polygon points="8 5 19 12 8 19 8 5" />
            </svg>
          </div>

          {/* Bottom Duration & Video Count Strip */}
          <div
            style={{
              position: 'absolute',
              bottom: '8px',
              left: '8px',
              background: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(4px)',
              color: '#ffffff',
              fontSize: '10px',
              fontWeight: 600,
              padding: '2px 7px',
              borderRadius: '5px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              zIndex: 3,
            }}
          >
            <span style={{ fontSize: '9px' }}>▶</span>
            <span className="whitespace-nowrap">{durationText}</span>
          </div>
        </Link>
      </div>

      {/* Card Body (Right side on mobile, bottom body on tablet/desktop) */}
      <div className="flex-1 flex flex-col justify-between p-2 sm:p-2.5 md:p-4 min-w-0">
        <div>
          {/* Title (2-line clamp) */}
          <h3
            className="text-[13px] sm:text-[14px] md:text-[15px] font-extrabold text-[#0f172a] leading-snug line-clamp-2 mb-1 md:mb-1.5 min-h-0 md:min-h-[2.6rem]"
            title={displayTitle}
          >
            <Link to={videoDetailsUrl} style={{ color: 'inherit', textDecoration: 'none' }}>
              {displayTitle}
            </Link>
          </h3>

          {/* Clean 2-Line Description (Old harsh OVERVIEW: box completely removed) */}
          <p
            className="text-[11px] sm:text-[11.5px] md:text-[12.5px] text-[#64748b] leading-relaxed line-clamp-2 mb-2 md:mb-3.5"
          >
            {initialObj.whyHighQuality || video.description || 'Structured academic masterclass covering core theory, proofs, and real-world problem sets.'}
          </p>

          {/* Progress Bar (if course in progress) */}
          {progressPercent > 0 && (
            <div style={{ margin: '0 0 8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#0F5E53', fontWeight: 700, marginBottom: '3px' }}>
                <span>Progress</span>
                <span>{progressPercent}%</span>
              </div>
              <div style={{ height: '4px', background: '#E6F4F1', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${progressPercent}%`, height: '100%', background: '#0F5E53', transition: 'width 0.3s ease' }} />
              </div>
            </div>
          )}
        </div>

        {/* Creator Footer with Avatar & Bookmark */}
        <div
          className="mt-auto pt-1.5 md:pt-2.5 border-t border-slate-100 flex items-center justify-between"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: '#E6F4F1',
                color: '#0F5E53',
                fontSize: '10px',
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
              className="text-[11px] sm:text-[11.5px] md:text-xs font-semibold text-slate-600 truncate max-w-[140px] sm:max-w-[180px]"
              title={displayChannel}
            >
              Creator: {displayChannel}
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

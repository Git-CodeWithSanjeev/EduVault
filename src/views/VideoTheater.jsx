'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate, useLocation } from '../utils/routerCompat';
import { educationalVideos, getPlaylistLessons, getVideoId } from '../data/educationalVideos';
import { educationalGalleryData } from '../data/educationalGalleryData';
import { items } from '../data/openItems';
import { fetchYouTubePlaylistItems, fetchYouTubePlaylistDetails } from '../services/youtubeApi';
import { useVideoLearning } from '../hooks/useVideoLearning';
import { useAuth } from '../context/AuthContext';
import { triggerAuthPrompt } from '../utils/authPrompt';
import { VideoCard } from '../components/VideoCard';
import { ToastNotification } from '../components/FormElements';

export function VideoTheater() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn } = useAuth();
  const iframeRef = useRef(null);

  const {
    isLessonCompleted,
    toggleLessonCompleted,
    getCourseProgress,
    isLiked,
    toggleLike,
    isBookmarked,
    toggleBookmark,
    isSaved,
    toggleSave,
    isInLearningList,
    toggleLearningList,
  } = useVideoLearning();

  const vid = useMemo(() => {
    if (!id) return null;
    const foundGallery = educationalGalleryData.find((v) => v.id === id || v.videoId === id || v.playlistId === id);
    if (foundGallery) return foundGallery;

    const foundStatic = educationalVideos.find((v) => v.id === id || v.videoId === id || v.playlistId === id);
    if (foundStatic) return foundStatic;

    // Explicit resolution for canonical featured courses
    if (id === 'class-12-quantum-mechanics') {
      return {
        id: 'class-12-quantum-mechanics',
        videoId: 'lZ3bPUKo5zc',
        playlistId: 'PLUl4u3cNGP61-9PEhRognw5vryrSEVLPr',
        title: 'Introduction to Quantum Mechanics',
        channel: 'Samantha Ray',
        category: 'Physics',
        tier: 'Class 12',
        level: 'Class 12',
        duration: '12 Hours · 24 Videos',
        description: 'Introduction to quantum science, wave mechanics, superposition, and quantum states.',
        theme: 'quantum',
      };
    }
    if (id === 'ug-organic-chemistry') {
      return {
        id: 'ug-organic-chemistry',
        videoId: 'ZgccHLOj3W4',
        playlistId: 'PLgqhGKMp0Djaj_Tmch5c0zjqHEEHAGivd',
        title: 'Organic Chemistry Masterclass',
        channel: 'James Miller',
        category: 'Chemistry',
        tier: 'Undergraduate (UG)',
        level: 'UG',
        duration: '12 Hours · 24 Videos',
        description: 'Comprehensive masterclass on organic reaction mechanisms, IUPAC nomenclature, and stereochemistry.',
        theme: 'organic-chem',
      };
    }
    if (id === 'cs-masterclass') {
      return {
        id: 'cs-masterclass',
        videoId: 'F0WoVEr0-44',
        playlistId: 'PLWKjhJtqVAbmGw5fN5BQlwuug-8bDmabi',
        title: 'Computer Science Masterclass',
        channel: 'Soran Jenkins',
        category: 'Computer Science',
        tier: 'Class 12',
        level: 'Class 12',
        duration: '12 Hours · 24 Videos',
        description: 'Learn computational thinking, algorithms, data structures, and foundational programming.',
        theme: 'cs-tech',
      };
    }

    const isPl = id.startsWith('PL');
    const isDirectVid = !isPl && id.length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(id);

    return {
      id: id,
      playlistId: isPl ? id : null,
      videoId: isDirectVid ? id : 'tVzUXW6siu0',
      title: `Educational Course (${id})`,
      channel: 'Verified Educator',
      category: 'Education',
      level: 'Beginner to Advanced',
      language: 'English',
      description: 'Comprehensive open educational video course with interactive lesson timeline.',
      duration: 'Video Playlist',
    };
  }, [id]);

  const [activeLessonIdx, setActiveLessonIdx] = useState(0);
  const [dynamicLessons, setDynamicLessons] = useState(null);
  const [apiDetails, setApiDetails] = useState(null);
  const [isLoadingApi, setIsLoadingApi] = useState(false);
  const [hasPlayerError, setHasPlayerError] = useState(false);
  const [startTimestamp, setStartTimestamp] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState('1');
  const [toastMessage, setToastMessage] = useState('');
  const [isAccordionOpen, setIsAccordionOpen] = useState(true);

  // Send commands to YouTube iframe via postMessage
  const sendPlayerCommand = (func, args = []) => {
    try {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func, args }),
          '*'
        );
      }
    } catch (_) {}
  };

  // Determine playlistId safely
  const playlistId = useMemo(() => {
    if (!vid) return null;
    if (vid.playlistId && vid.playlistId.startsWith('PL')) return vid.playlistId;
    if (vid.embedUrl && vid.embedUrl.includes('list=')) {
      try {
        const listParam = new URL(vid.embedUrl).searchParams.get('list');
        if (listParam && listParam.startsWith('PL')) return listParam;
      } catch {
        const match = vid.embedUrl.match(/list=(PL[a-zA-Z0-9_-]+)/);
        return match ? match[1] : null;
      }
    }
    return null;
  }, [vid]);

  useEffect(() => {
    if (!playlistId) return;

    let isMounted = true;
    setIsLoadingApi(true);

    fetchYouTubePlaylistItems(playlistId)
      .then((items) => {
        if (isMounted && items && items.length > 0) {
          setDynamicLessons(items);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoadingApi(false);
      });

    fetchYouTubePlaylistDetails(playlistId).then((details) => {
      if (isMounted && details) {
        setApiDetails(details);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [playlistId]);

  // Toast feedback helper
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  if (!vid) {
    return (
      <section className="page empty" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <h2>Video course not found</h2>
        <p style={{ color: 'var(--muted)', margin: '12px 0 24px' }}>
          The requested video course could not be located in EduVault repository.
        </p>
        <Link to="/videos" className="action-btn active" style={{ display: 'inline-flex' }}>
          ← Back to Video Hub
        </Link>
      </section>
    );
  }

  const fallbackLessons = getPlaylistLessons(vid);
  const lessons = dynamicLessons || fallbackLessons;
  const activeLesson = lessons[activeLessonIdx] || lessons[0] || {};
  const primaryVidId = getVideoId(vid);
  const targetVidId = activeLesson.videoId || primaryVidId;

  // Chapter Timestamps
  const defaultChapters = [
    { title: '00:00 Introduction & Overview', seconds: 0 },
    { title: '02:15 Core Concepts & Fundamentals', seconds: 135 },
    { title: '06:30 Step-by-Step Practical Demonstration', seconds: 390 },
    { title: '11:20 Common Mistakes & Edge Cases', seconds: 680 },
    { title: '15:40 Summary & Best Practices', seconds: 940 },
  ];

  const chapters = vid.chapters || defaultChapters;

  // What you'll learn checklist items
  const defaultOutcomes = [
    `Master foundational concepts of ${vid.category || 'the subject'}`,
    `Build real-world application examples step by step`,
    `Understand best practices, optimizations, and clean architecture`,
    `Solve common pitfalls and diagnostic challenges`,
    `Apply newly acquired knowledge directly to projects or exams`,
  ];

  const outcomes = vid.whatYoullLearn || defaultOutcomes;

  // Embed URL with youtube-nocookie, mobile playsinline, autoplay, playlist, and timestamp support
  const posterBg = (targetVidId && targetVidId.length === 11 && !targetVidId.startsWith('PL'))
    ? `https://i.ytimg.com/vi/${targetVidId}/hqdefault.jpg`
    : (vid.thumbnail || `https://i.ytimg.com/vi/tVzUXW6siu0/hqdefault.jpg`);

  // Course Progress calculation
  const totalLessonsCount = lessons.length;
  const progressPercent = getCourseProgress(vid.id || primaryVidId, totalLessonsCount);
  const isCurrentCompleted = isLessonCompleted(vid.id || primaryVidId, activeLessonIdx);
  const liked = isLiked(vid.id || primaryVidId);
  const bookmarked = isBookmarked(vid.id || primaryVidId);
  const saved = isSaved(vid.id || primaryVidId);
  const learningListActive = isInLearningList(vid.id || primaryVidId);

  // Lesson navigation
  const handlePrevLesson = () => {
    if (activeLessonIdx > 0) {
      setActiveLessonIdx(activeLessonIdx - 1);
      setStartTimestamp(0);
    }
  };

  const handleNextLesson = () => {
    if (activeLessonIdx < lessons.length - 1) {
      setActiveLessonIdx(activeLessonIdx + 1);
      setStartTimestamp(0);
    }
  };

  // Timestamp Seeking with YouTube Player API integration
  const handleSeekChapter = (seconds) => {
    setStartTimestamp(seconds);
    sendPlayerCommand('seekTo', [seconds, true]);
    sendPlayerCommand('playVideo', []);
    showToast(`Jumped to ${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`);
  };

  // Playback Speed control with YouTube Player API integration
  const handleSetSpeed = (speed) => {
    setPlaybackSpeed(speed);
    sendPlayerCommand('setPlaybackRate', [parseFloat(speed)]);
    showToast(`Playback speed set to ${speed}x`);
  };

  // Share link
  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast('🔗 Video lesson link copied to clipboard!');
    } else {
      showToast('🔗 Link: ' + window.location.href);
    }
  };

  // Related Videos
  const relatedVideos = educationalVideos
    .filter((v) => (v.id !== vid.id && v.videoId !== vid.videoId) && (v.category === vid.category || v.subject === vid.subject))
    .slice(0, 3);

  const fallbackRelated = relatedVideos.length > 0 ? relatedVideos : educationalVideos.slice(0, 3);

  const channelTitle = apiDetails?.channel || vid.channel || 'Educational Channel';
  const courseTitle = apiDetails?.title || vid.title || 'Video Course';

  return (
    <section className="page video-theater-page">
      {/* Toast Notification Popup */}
      <ToastNotification message={toastMessage} />

      {/* Back Navigation Bar */}
      <div className="theater-top-bar">
        <Link to="/videos" className="action-btn" style={{ textDecoration: 'none' }}>
          ← Back to Video Hub
        </Link>
        <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>
          Part of: <strong style={{ color: 'var(--ink)' }}>{courseTitle}</strong>
        </span>
      </div>

      <div className="learning-container">
        {/* Main Learning Area */}
        <div className="learning-main">
          {/* Responsive 16:9 Video Player */}
          <div className="player-wrapper" style={{ position: 'relative', width: '100%', paddingBottom: '56.25%', height: 0, background: '#0f172a', borderRadius: '12px', overflow: 'hidden' }}>
            {isLoadingApi ? (
              <div className="skeleton" style={{ position: 'absolute', inset: 0 }} />
            ) : hasPlayerError ? (
              <div style={{ position: 'absolute', inset: 0, padding: '40px 20px', textAlign: 'center', color: '#ffffff', background: '#0f172a', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <p style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>⚠️ Unable to load video embed</p>
                <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px' }}>The video source may be restricted on this network or browser.</p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    className="action-btn active"
                    onClick={() => setHasPlayerError(false)}
                  >
                    🔄 Retry Loading Video
                  </button>
                  <a
                    href={`https://www.youtube.com/watch?v=${targetVidId}${playlistId ? `&list=${playlistId}` : ''}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="action-btn"
                    style={{ textDecoration: 'none' }}
                  >
                    ▶ Watch on YouTube
                  </a>
                </div>
              </div>
            ) : (
              <iframe
                ref={iframeRef}
                key={`${vid.id}-${targetVidId}`}
                src={`https://www.youtube-nocookie.com/embed/${targetVidId}?enablejsapi=1&playsinline=1&rel=0${startTimestamp ? `&start=${startTimestamp}` : ''}`}
                title={activeLesson.title || courseTitle}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                onError={() => setHasPlayerError(true)}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
              />
            )}
          </div>

          {/* Interactive Player Quick Controls */}
          <div className="player-speed-bar">
            <div className="player-speed-group">
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)' }}>Speed:</span>
              {['0.75', '1', '1.25', '1.5', '2'].map((speed) => (
                <button
                  key={speed}
                  type="button"
                  onClick={() => handleSetSpeed(speed)}
                  style={{
                    minWidth: '42px',
                    height: '28px',
                    padding: '0 8px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: 700,
                    border: playbackSpeed === speed ? '1.5px solid var(--p)' : '1px solid var(--line)',
                    background: playbackSpeed === speed ? '#e6f7f3' : '#ffffff',
                    color: playbackSpeed === speed ? 'var(--p-dark)' : 'var(--ink)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: playbackSpeed === speed ? '0 2px 6px rgba(13, 148, 136, 0.12)' : 'none',
                  }}
                >
                  {speed}x
                </button>
              ))}
            </div>

            <div className="player-nav-group">
              <button
                type="button"
                className="action-btn"
                onClick={handlePrevLesson}
                disabled={activeLessonIdx === 0}
                style={{ opacity: activeLessonIdx === 0 ? 0.5 : 1, padding: '4px 12px', fontSize: '12px' }}
              >
                ← Prev Lesson
              </button>
              <button
                type="button"
                className="action-btn"
                onClick={handleNextLesson}
                disabled={activeLessonIdx === lessons.length - 1}
                style={{ opacity: activeLessonIdx === lessons.length - 1 ? 0.5 : 1, padding: '4px 12px', fontSize: '12px' }}
              >
                Next Lesson →
              </button>
            </div>
          </div>

          {/* Interactive Learning Actions Bar */}
          <div className="learning-actions-bar">
            <button
              type="button"
              className={`action-btn ${isCurrentCompleted ? 'completed' : ''}`}
              onClick={() => {
                if (!isLoggedIn) {
                  navigate('/login');
                  return;
                }
                toggleLessonCompleted(vid.id || primaryVidId, activeLessonIdx);
                showToast(isCurrentCompleted ? 'Marked lesson as pending' : 'Lesson marked as completed!');
              }}
            >
              {isCurrentCompleted ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <span>Completed</span>
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                  <span>Mark Completed</span>
                </>
              )}
            </button>

            <button
              type="button"
              className={`action-btn ${saved ? 'active' : ''}`}
              onClick={() => {
                if (!isLoggedIn) {
                  triggerAuthPrompt({
                    feature: 'Save Video Course',
                    title: 'Sign In to Save Courses',
                    message: 'Please sign in or create an account to save video lessons to your library and track your progress.',
                    from: location.pathname,
                  });
                  return;
                }
                toggleSave(vid.id || primaryVidId);
                showToast(saved ? 'Removed from saved' : 'Saved to My Library');
              }}
            >
              {saved ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', color: '#e11d48' }}>
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                  </svg>
                  <span>Saved</span>
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                  </svg>
                  <span>Save</span>
                </>
              )}
            </button>

            <button
              type="button"
              className={`action-btn ${liked ? 'active' : ''}`}
              onClick={() => {
                if (!isLoggedIn) {
                  navigate('/login');
                  return;
                }
                toggleLike(vid.id || primaryVidId);
                showToast(liked ? 'Unliked' : 'Liked video lesson');
              }}
            >
              {liked ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', color: '#0284c7' }}>
                    <path d="M7 10v12M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z" />
                  </svg>
                  <span>Liked</span>
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                    <path d="M7 10v12M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z" />
                  </svg>
                  <span>Like</span>
                </>
              )}
            </button>

            <button
              type="button"
              className={`action-btn ${learningListActive ? 'active' : ''}`}
              onClick={() => {
                if (!isLoggedIn) {
                  navigate('/login');
                  return;
                }
                toggleLearningList(vid.id || primaryVidId);
                showToast(learningListActive ? 'Removed from Learning List' : 'Added to Learning List');
              }}
            >
              {learningListActive ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                    <path d="m5 12 5 5L20 7" />
                  </svg>
                  <span>In Learning List</span>
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <span>Add to List</span>
                </>
              )}
            </button>

            <button type="button" className="action-btn" onClick={handleShare}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              <span>Share</span>
            </button>

            <a
              href={`https://www.youtube.com/watch?v=${targetVidId}${playlistId ? `&list=${playlistId}` : ''}`}
              target="_blank"
              rel="noopener noreferrer"
              className="action-btn"
              style={{ textDecoration: 'none' }}
              title="Open video directly on YouTube"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '6px', color: '#ef4444' }}>
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              <span>YouTube</span>
            </a>
          </div>

          {/* Video Metadata Information */}
          <div style={{ background: 'var(--card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--line)', margin: '16px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '6px', background: '#e6f7f3', color: 'var(--p-dark)' }}>
                {vid.category || 'Education'}
              </span>
              <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '6px', background: '#ccfbf1', color: '#0f766e' }}>
                Level: {vid.level || 'Beginner to Advanced'}
              </span>
              <span style={{ fontSize: '11px', fontStyle: 'normal', padding: '4px 10px', borderRadius: '6px', background: '#f1f5f9', color: 'var(--muted)', fontWeight: 700 }}>
                🌐 {vid.language || 'English'}
              </span>
              {(() => {
                const rawDur = activeLesson.duration || vid.duration;
                if (!rawDur || rawDur === 'Video') return null;
                return (
                  <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 700 }}>
                    ⏱ Runtime: {rawDur}
                  </span>
                );
              })()}
            </div>

            <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '8px 0 12px', color: 'var(--ink)', lineHeight: 1.3, letterSpacing: 'normal', wordBreak: 'break-word' }}>
              {activeLesson.title || courseTitle}
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--p-dark)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <strong style={{ fontSize: '14px', color: 'var(--ink)' }}>{channelTitle}</strong>
              </div>
              <span style={{ color: 'var(--line)' }}>•</span>
              <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>
                Verified Educator Resource
              </span>
            </div>

            <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--ink2)', margin: 0 }}>
              {apiDetails?.description || vid.description || 'Comprehensive open educational video lesson covering theoretical concepts, practical exercises, and code implementations.'}
            </p>
          </div>

          {/* Dedicated Section: What You'll Learn */}
          <div style={{ background: 'var(--card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--line)', margin: '16px 0' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 14px', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--p)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" />
              </svg>
              <span>What You'll Learn</span>
            </h3>
            <div className="checklist-grid">
              {outcomes.map((item, idx) => (
                <div key={idx} className="checklist-item">
                  <span className="checklist-icon">✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Expandable Section: About This Lesson */}
          <div className="learning-accordion">
            <button
              type="button"
              className="accordion-header"
              onClick={() => setIsAccordionOpen(!isAccordionOpen)}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--p-dark)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
                <span>About This Lesson & Course Blueprint</span>
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 700 }}>
                {isAccordionOpen ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="18 15 12 9 6 15" />
                    </svg>
                    <span>Hide</span>
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                    <span>Expand</span>
                  </>
                )}
              </span>
            </button>

            {isAccordionOpen && (
              <div className="accordion-content">
                <h4 style={{ margin: '12px 0 6px', color: 'var(--ink)' }}>Detailed Lesson Explanation</h4>
                <p>
                  This course module provides an in-depth exploration of fundamental and advanced concepts. It is structured for self-paced learning, providing high-clarity examples and verified educational material.
                </p>

                <h4 style={{ margin: '14px 0 6px', color: 'var(--ink)' }}>Prerequisites</h4>
                <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--ink2)' }}>
                  <li>Basic understanding of fundamental concepts in {vid.category || 'this subject'}.</li>
                  <li>A modern web browser and curiosity for learning.</li>
                </ul>

                <h4 style={{ margin: '14px 0 6px', color: 'var(--ink)' }}>Key Concepts & Terminology</h4>
                <p style={{ margin: 0 }}>
                  Includes architectural patterns, problem-solving strategies, performance considerations, and real-world application examples.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Learning Sidebar: Course Playlist & Chapters */}
        <div className="learning-sidebar">
          {/* Course Progress Box */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: '12px', padding: '18px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)' }}>Course Progress</span>
              <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--p-dark)' }}>{progressPercent}%</span>
            </div>
            <div style={{ height: '8px', background: '#ccebe4', borderRadius: '4px', overflow: 'hidden', marginBottom: '10px' }}>
              <div style={{ width: `${progressPercent}%`, height: '100%', background: 'var(--p-gradient)', transition: 'width 0.3s ease' }} />
            </div>
            <small style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>
              Lesson {activeLessonIdx + 1} of {lessons.length} active
            </small>
          </div>

          {/* Lessons Playlist Drawer */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>COURSE LESSONS ({lessons.length})</span>
              <span style={{ fontSize: '11px', color: 'var(--p-dark)', fontWeight: 700 }}>Active #{activeLessonIdx + 1}</span>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '360px', overflowY: 'auto' }}>
              {lessons.map((les, idx) => {
                const completed = isLessonCompleted(vid.id || primaryVidId, idx);
                const isActive = activeLessonIdx === idx;
                return (
                  <div
                    key={les.id || les.videoId || idx}
                    onClick={() => {
                      setActiveLessonIdx(idx);
                      setStartTimestamp(0);
                    }}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      background: isActive ? '#e6f7f3' : '#f8fafc',
                      border: isActive ? '1.5px solid var(--p)' : '1px solid var(--line)',
                      color: isActive ? 'var(--p-dark)' : 'var(--ink)',
                      fontWeight: isActive ? 700 : 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={completed}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleLessonCompleted(vid.id || primaryVidId, idx);
                      }}
                      style={{ cursor: 'pointer', minHeight: '18px' }}
                    />
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {isActive ? '▶ ' : `${idx + 1}. `}{les.title.replace(/^\d+\.\s*/, '')}
                    </span>
                    <span style={{ fontSize: '10px', opacity: 0.7 }}>{les.duration || 'Video'}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Clickable Video Chapters / Timeline */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: '12px', padding: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--p-dark)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="17" x2="12" y2="22" />
                <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a1 1 0 0 0 0-2H8a1 1 0 0 0 0 2h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
              </svg>
              <span>Video Chapters</span>
            </h3>
            <p style={{ fontSize: '11px', color: 'var(--muted)', margin: '0 0 12px' }}>
              Tap any chapter to seek timestamp:
            </p>

            <div className="chapters-list">
              {chapters.map((ch, idx) => (
                <div
                  key={idx}
                  className="chapter-row"
                  onClick={() => handleSeekChapter(ch.seconds)}
                >
                  <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{ch.title}</span>
                  <span className="chapter-timestamp">
                    {Math.floor(ch.seconds / 60)}:{(ch.seconds % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Section: Continue Learning (Related Video Courses) */}
      <div style={{ marginTop: '48px', paddingTop: '32px', borderTop: '1px solid var(--line)' }}>
        <p className="eyebrow">CONTINUE LEARNING</p>
        <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '6px 0 20px', color: 'var(--ink)' }}>
          Related Video Courses & Next Lessons
        </h2>

        <div className="video-gallery-grid" style={{ '--desktop-cols': 3 }}>
          {fallbackRelated.map((item, idx) => (
            <VideoCard key={item.id || item.videoId || idx} video={item} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default VideoTheater;

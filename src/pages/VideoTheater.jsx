import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { educationalVideos, getPlaylistLessons, getVideoId } from '../data/educationalVideos';
import { educationalGalleryData } from '../data/educationalGalleryData';
import { items } from '../data/openItems';
import { fetchYouTubePlaylistItems, fetchYouTubePlaylistDetails } from '../services/youtubeApi';
import { useVideoLearning } from '../hooks/useVideoLearning';
import { VideoCard } from '../components/VideoCard';

export function VideoTheater() {
  const { id } = useParams();
  const navigate = useNavigate();

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
    const foundStatic = educationalVideos.find((v) => v.id === id || v.videoId === id || v.playlistId === id);
    if (foundStatic) return foundStatic;

    const foundGallery = educationalGalleryData.find((v) => v.id === id || v.videoId === id || v.playlistId === id);
    if (foundGallery) return foundGallery;

    return {
      id: id,
      playlistId: id.startsWith('PL') || id.length > 15 ? id : null,
      videoId: (!id.startsWith('PL') && id.length <= 15) ? id : null,
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

  // Determine playlistId
  const playlistId = vid
    ? vid.playlistId || (vid.embedUrl && vid.embedUrl.includes('list=') ? new URL(vid.embedUrl).searchParams.get('list') : null)
    : null;

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

  // Embed URL with timestamp & autoplay support
  const activeEmbedUrl = playlistId
    ? `https://www.youtube.com/embed/${targetVidId}?list=${playlistId}&autoplay=1&enablejsapi=1&rel=0${startTimestamp ? `&start=${startTimestamp}` : ''}`
    : `https://www.youtube.com/embed/${targetVidId}?autoplay=1&enablejsapi=1&rel=0${startTimestamp ? `&start=${startTimestamp}` : ''}`;

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

  // Auto scroll upward to top when lesson or video changes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [id, activeLessonIdx]);

  // Timestamp Seeking
  const handleSeekChapter = (seconds) => {
    setStartTimestamp(seconds);
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    showToast(`Jumped to chapter timestamp (${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')})`);
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
    <section className="page" style={{ maxWidth: '1400px', padding: '16px' }}>
      {/* Toast Notification Popup */}
      {toastMessage && <div className="toast-notification">{toastMessage}</div>}

      {/* Back Navigation Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
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
          <div className="player-wrapper">
            {isLoadingApi ? (
              <div className="skeleton" style={{ width: '100%', height: '100%' }} />
            ) : hasPlayerError ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#ffffff', background: '#0f172a', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <p style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>⚠️ Unable to load video embed</p>
                <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px' }}>The video source may be restricted or offline.</p>
                <button
                  type="button"
                  className="action-btn active"
                  onClick={() => setHasPlayerError(false)}
                >
                  🔄 Retry Loading Video
                </button>
              </div>
            ) : (
              <iframe
                key={`${vid.id}-${targetVidId}-${activeLessonIdx}-${startTimestamp}`}
                src={activeEmbedUrl}
                title={activeLesson.title || courseTitle}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                onError={() => setHasPlayerError(true)}
              />
            )}
          </div>

          {/* Interactive Player Quick Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', background: 'var(--card)', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--line)', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)' }}>Playback Speed:</span>
              {['0.75', '1', '1.25', '1.5', '2'].map((speed) => (
                <button
                  key={speed}
                  type="button"
                  onClick={() => {
                    setPlaybackSpeed(speed);
                    showToast(`Speed set to ${speed}x`);
                  }}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                    border: playbackSpeed === speed ? '1px solid var(--p)' : '1px solid var(--line)',
                    background: playbackSpeed === speed ? '#eff6ff' : '#ffffff',
                    color: playbackSpeed === speed ? 'var(--p)' : 'var(--ink)',
                    cursor: 'pointer',
                  }}
                >
                  {speed}x
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
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
                toggleLessonCompleted(vid.id || primaryVidId, activeLessonIdx);
                showToast(isCurrentCompleted ? 'Marked lesson as pending' : '✅ Lesson marked as completed!');
              }}
            >
              {isCurrentCompleted ? '✅ Completed' : '⚪ Mark Completed'}
            </button>

            <button
              type="button"
              className={`action-btn ${saved ? 'active' : ''}`}
              onClick={() => {
                toggleSave(vid.id || primaryVidId);
                showToast(saved ? 'Removed from saved' : '❤️ Saved to My Library');
              }}
            >
              {saved ? '❤️ Saved' : '🤍 Save'}
            </button>

            <button
              type="button"
              className={`action-btn ${bookmarked ? 'active' : ''}`}
              onClick={() => {
                toggleBookmark(vid.id || primaryVidId);
                showToast(bookmarked ? 'Bookmark removed' : '🔖 Bookmarked');
              }}
            >
              {bookmarked ? '🔖 Bookmarked' : '📑 Bookmark'}
            </button>

            <button
              type="button"
              className={`action-btn ${liked ? 'active' : ''}`}
              onClick={() => {
                toggleLike(vid.id || primaryVidId);
                showToast(liked ? 'Unliked' : '👍 Liked video lesson');
              }}
            >
              {liked ? '👍 Liked' : '👍 Like'}
            </button>

            <button
              type="button"
              className={`action-btn ${learningListActive ? 'active' : ''}`}
              onClick={() => {
                toggleLearningList(vid.id || primaryVidId);
                showToast(learningListActive ? 'Removed from Learning List' : '➕ Added to Learning List');
              }}
            >
              {learningListActive ? '✓ In Learning List' : '➕ Add to List'}
            </button>

            <button type="button" className="action-btn" onClick={handleShare}>
              🔗 Share
            </button>
          </div>

          {/* Video Metadata Information */}
          <div style={{ background: 'var(--card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--line)', margin: '16px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '6px', background: '#dbeafe', color: 'var(--p)' }}>
                {vid.category || 'Education'}
              </span>
              <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '6px', background: '#ccfbf1', color: '#0f766e' }}>
                Level: {vid.level || 'Beginner to Advanced'}
              </span>
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '6px', background: '#f1f5f9', color: 'var(--muted)' }}>
                🌐 {vid.language || 'English'}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 700 }}>
                Duration: {activeLesson.duration || vid.duration || '18 min'}
              </span>
            </div>

            <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '8px 0 12px', color: 'var(--ink)', lineHeight: 1.3, letterSpacing: 'normal', wordBreak: 'break-word' }}>
              {activeLesson.title || courseTitle}
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>👤</span>
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
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 14px', color: 'var(--ink)' }}>
              🎯 What You'll Learn
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
              <span>📖 About This Lesson & Course Blueprint</span>
              <span>{isAccordionOpen ? '▲ Hide' : '▼ Expand'}</span>
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
              <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--accent)' }}>{progressPercent}%</span>
            </div>
            <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden', marginBottom: '10px' }}>
              <div style={{ width: `${progressPercent}%`, height: '100%', background: 'var(--accent)', transition: 'width 0.3s ease' }} />
            </div>
            <small style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>
              Lesson {activeLessonIdx + 1} of {lessons.length} active
            </small>
          </div>

          {/* Lessons Playlist Drawer */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>COURSE LESSONS ({lessons.length})</span>
              <span style={{ fontSize: '11px', color: 'var(--p)', fontWeight: 700 }}>Active #{activeLessonIdx + 1}</span>
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
                      background: isActive ? '#eff6ff' : '#f8fafc',
                      border: isActive ? '1px solid var(--p)' : '1px solid var(--line)',
                      color: isActive ? 'var(--p)' : 'var(--ink)',
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
            <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 10px' }}>
              📍 Video Chapters
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

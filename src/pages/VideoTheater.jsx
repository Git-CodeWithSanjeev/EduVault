import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { educationalVideos, getPlaylistLessons, getVideoId } from '../data/educationalVideos';
import { items } from '../data/openItems';
import { fetchYouTubePlaylistItems, fetchYouTubePlaylistDetails } from '../services/youtubeApi';

export function VideoTheater() {
  const { id } = useParams();
  const vid = educationalVideos.find((v) => v.id === id);
  const [activeLessonIdx, setActiveLessonIdx] = useState(0);
  const [dynamicLessons, setDynamicLessons] = useState(null);
  const [apiDetails, setApiDetails] = useState(null);
  const [apiSource, setApiSource] = useState(null);
  const [isLoadingApi, setIsLoadingApi] = useState(false);

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
          setApiSource(items[0]?.source || 'api');
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

  if (!vid) {
    return (
      <section className="page empty">
        Video course not found. <Link to="/videos">Back to video hub</Link>
      </section>
    );
  }

  const fallbackLessons = getPlaylistLessons(vid);
  const lessons = dynamicLessons || fallbackLessons;
  const activeLesson = lessons[activeLessonIdx] || lessons[0] || {};
  const primaryVidId = getVideoId(vid);

  const targetVidId = activeLesson.videoId || primaryVidId;

  const activeEmbedUrl = playlistId
    ? `https://www.youtube.com/embed/${targetVidId}?list=${playlistId}&autoplay=1`
    : `https://www.youtube.com/embed/${targetVidId}?autoplay=1`;

  const relatedBooks = items.filter(
    (x) => x.subject === vid.category || x.category === vid.category,
  ).slice(0, 3);

  const channelTitle = apiDetails?.channel || vid.channel;
  const courseTitle = apiDetails?.title || vid.title;

  return (
    <section className="page" style={{ maxWidth: '1380px' }}>
      <Link to="/videos" className="back">
        ← Back to Video Hub
      </Link>

      <div className="theater-container">
        {/* Main Embed Video Player */}
        <div className="theater-main">
          <div className="theater-embed-wrap">
            <iframe
              key={`${vid.id}-${targetVidId}-${activeLessonIdx}`}
              src={activeEmbedUrl}
              title={activeLesson.title || courseTitle}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <div style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 8px', borderRadius: '6px', background: '#efecff', color: 'var(--p)' }}>
                {vid.category}
              </span>
              {apiSource && (
                <span style={{ fontSize: '11px', fontWeight: 800, padding: '4px 8px', borderRadius: '6px', background: '#e6fffa', color: '#234e52' }}>
                  {apiSource === 'api' ? '⚡ Verified Live Course' : '📡 Live Course'}
                </span>
              )}
              <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 700 }}>
                Video {activeLessonIdx + 1} of {lessons.length}
              </span>
            </div>
            <h1 style={{ fontSize: '22px', margin: '14px 0 12px', lineHeight: 1.4, letterSpacing: '0.2px', wordBreak: 'break-word', color: 'var(--ink)' }}>
              {activeLesson.title || courseTitle}
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: 1.6, marginTop: '8px' }}>
              {apiDetails?.description || vid.description}
            </p>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '16px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, background: '#f5f4fa', border: '1px solid var(--line)', padding: '6px 12px', borderRadius: '6px' }}>
                Channel: {channelTitle}
              </span>
              <span style={{ fontSize: '12px', color: '#638c77', fontWeight: 700 }}>
                ✓ Verified Public Video Resource
              </span>
            </div>
          </div>
        </div>

        {/* Sidebar Interactive Playlist Lessons & Textbooks */}
        <div className="theater-sidebar">
          <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: '12px', padding: '16px' }}>
            <h3 style={{ fontSize: '15px', margin: '0 0 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>COURSE LESSONS ({lessons.length})</span>
              <span style={{ fontSize: '11px', color: '#725de0', fontWeight: 700 }}>Playing #{activeLessonIdx + 1}</span>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '420px', overflowY: 'auto' }}>
              {lessons.map((les, idx) => (
                <div
                  key={les.id || les.videoId || idx}
                  onClick={() => setActiveLessonIdx(idx)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    background: activeLessonIdx === idx ? '#efecff' : '#fcfbfd',
                    border: activeLessonIdx === idx ? '1px solid #725de0' : '1px solid var(--line)',
                    color: activeLessonIdx === idx ? '#725de0' : 'var(--ink)',
                    fontWeight: activeLessonIdx === idx ? 700 : 500,
                    display: 'flex',
                    justify: 'space-between',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {activeLessonIdx === idx ? '▶ ' : `${idx + 1}. `}{les.title.replace(/^\d+\.\s*/, '')}
                  </span>
                  <small style={{ opacity: 0.7, fontSize: '10px' }}>{les.duration || 'Video'}</small>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: '12px', padding: '16px', marginTop: '16px' }}>
            <h3 style={{ fontSize: '15px', margin: '0 0 8px' }}>Recommended Textbooks</h3>
            <p style={{ fontSize: '11px', color: 'var(--muted)', margin: '0 0 12px' }}>Read related open textbooks for this course:</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {relatedBooks.map((b) => (
                <div key={b.id} style={{ border: '1px solid var(--line)', borderRadius: '8px', padding: '10px', background: '#faf9fc' }}>
                  <strong style={{ fontSize: '12px', display: 'block', marginBottom: '3px' }}>{b.title}</strong>
                  <small style={{ color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>{b.source} · {b.level}</small>
                  <Link to={'/read/' + b.id} className="pdf-btn" style={{ padding: '4px 8px', fontSize: '10px' }}>
                    Read Book PDF →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default VideoTheater;

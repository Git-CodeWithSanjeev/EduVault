import React from 'react';
import { Link } from 'react-router-dom';
import { items } from '../data/openItems';
import { Cards } from '../components/ResourceGrid';
import { useVideoLearning } from '../hooks/useVideoLearning';
import { useAuth } from '../context/AuthContext';
import { VideoCard } from '../components/VideoCard';
import { educationalVideos } from '../data/educationalVideos';
import { educationalGalleryData } from '../data/educationalGalleryData';

export function SavedPage({ saved = [], toggle = () => {} }) {
  const { isLoggedIn } = useAuth();
  const { savedVideos, bookmarkedVideos } = useVideoLearning();

  const savedBooksList = items.filter((x) => (Array.isArray(saved) ? saved : []).includes(x.id));

  // Combine saved & bookmarked video IDs
  const allSavedVideoIds = Array.from(new Set([...savedVideos, ...bookmarkedVideos]));

  const savedVideosList = allSavedVideoIds.map((id) => {
    const foundStatic = educationalVideos.find((v) => v.id === id || v.videoId === id || v.playlistId === id);
    if (foundStatic) return foundStatic;
    const foundGallery = educationalGalleryData.find((v) => v.id === id || v.videoId === id || v.playlistId === id);
    if (foundGallery) return foundGallery;
    return {
      id: id,
      title: `Saved Video Course (${id})`,
      channel: 'Educational Channel',
      category: 'Saved Video',
    };
  });

  return (
    <section className="page" style={{ padding: '16px' }}>
      <p className="eyebrow">MY PERSONAL LIBRARY</p>
      <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '8px 0 20px', color: 'var(--ink)' }}>
        Saved Textbooks & Video Courses
      </h2>

      {!isLoggedIn && (
        <div
          style={{
            padding: '12px 16px',
            background: '#F0FDF4',
            border: '1px solid #BBF7D0',
            borderRadius: '12px',
            color: '#166534',
            fontSize: '13px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <span>
            💾 <strong>Saved Locally:</strong> Items are saved in this browser. <Link to="/register" style={{ color: '#0F5E53', fontWeight: 700, textDecoration: 'underline' }}>Create a free account</Link> or <Link to="/login" style={{ color: '#0F5E53', fontWeight: 700, textDecoration: 'underline' }}>Sign In</Link> to sync across all your devices.
          </span>
        </div>
      )}

      {/* Saved Video Courses Section */}
      <div style={{ marginBottom: '36px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 14px', color: 'var(--ink)' }}>
          🎬 Saved Video Courses ({savedVideosList.length})
        </h3>
        {savedVideosList.length > 0 ? (
          <div className="video-gallery-grid" style={{ '--desktop-cols': 3 }}>
            {savedVideosList.map((vid) => (
              <VideoCard key={vid.id || vid.videoId} video={vid} />
            ))}
          </div>
        ) : (
          <div style={{ padding: '24px', background: '#f8fafc', borderRadius: '12px', border: '1px solid var(--line)', color: 'var(--muted)', fontSize: '14px' }}>
            No saved video courses yet. Tap ❤️ Save or 🔖 Bookmark on any video course to add it here.
          </div>
        )}
      </div>

      {/* Saved Textbooks Section */}
      <div>
        <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 14px', color: 'var(--ink)' }}>
          📚 Saved Textbooks & Open Books ({savedBooksList.length})
        </h3>
        {savedBooksList.length > 0 ? (
          <Cards list={savedBooksList} saved={saved} toggle={toggle} />
        ) : (
          <div style={{ padding: '24px', background: '#f8fafc', borderRadius: '12px', border: '1px solid var(--line)', color: 'var(--muted)', fontSize: '14px' }}>
            No saved textbooks yet. Browse the Library to save open textbooks.
          </div>
        )}
      </div>
    </section>
  );
}

export default SavedPage;

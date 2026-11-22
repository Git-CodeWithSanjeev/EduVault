'use client';

import React, { useState } from 'react';
import { Link } from '../utils/routerCompat';
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
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'books', 'videos'

  // Filter saved books
  const savedBooksList = items.filter((x) => (Array.isArray(saved) ? saved : []).includes(x.id));

  // Combine saved & bookmarked video IDs
  const allSavedVideoIds = Array.from(new Set([...savedVideos, ...bookmarkedVideos]));
  const allVideos = [...educationalVideos, ...(educationalGalleryData || [])];

  const savedVideosList = allSavedVideoIds.map((id) => {
    const found = allVideos.find((v) => v.id === id || v.videoId === id || v.playlistId === id);
    if (found) return found;
    return {
      id: id,
      title: `Saved Video Course (${id})`,
      channel: 'Educational Channel',
      category: 'Saved Video',
    };
  });

  const totalCount = savedBooksList.length + savedVideosList.length;

  return (
    <section className="saved-library-page">
      {/* ── Page Header ── */}
      <div className="saved-header">
        <p className="eyebrow">MY PERSONAL LIBRARY</p>
        <h1 className="saved-title">Saved Textbooks &amp; Video Courses</h1>
        <p className="saved-subtitle">
          Your personal collection of bookmarked open textbooks, video courses, and study resources.
        </p>
      </div>

      {/* ── Case 1: Guest User with 0 saved items -> Inspiring Hero Card ── */}
      {!isLoggedIn && totalCount === 0 && (
        <div className="saved-guest-hero">
          <div className="saved-guest-icon">📚</div>
          <h3>Build Your Personal Study Vault</h3>
          <p>
            Sign in or create a free account to bookmark open textbooks, save video masterclasses, and pick up right where you left off on any device.
          </p>

          <div className="saved-guest-features">
            <span className="saved-feature-pill">
              <span>📖</span>
              <span>Save Any Textbook</span>
            </span>
            <span className="saved-feature-pill">
              <span>🎬</span>
              <span>Track Video Playlists</span>
            </span>
            <span className="saved-feature-pill">
              <span>☁️</span>
              <span>Sync Across All Devices</span>
            </span>
          </div>

          <div className="saved-guest-actions">
            <Link
              to="/login"
              state={{ from: '/saved', notice: 'Please sign in to access and manage your personal library.' }}
              className="auth-gate-btn-primary"
              style={{ width: 'auto', padding: '0 28px' }}
            >
              Sign In to My Library
            </Link>
            <Link
              to="/register"
              state={{ from: '/saved' }}
              className="auth-gate-btn-secondary"
              style={{ width: 'auto', padding: '0 24px' }}
            >
              Create Free Account
            </Link>
            <Link
              to="/library"
              style={{
                color: '#0F5E53',
                fontSize: '13.5px',
                fontWeight: 700,
                textDecoration: 'none',
                padding: '10px 14px',
              }}
            >
              Explore Open Textbooks →
            </Link>
          </div>
        </div>
      )}

      {/* ── Case 2: Guest User with saved items -> Show Sync Notice ── */}
      {!isLoggedIn && totalCount > 0 && (
        <div
          style={{
            padding: '14px 18px',
            background: '#F0FDF4',
            border: '1.5px solid #BBF7D0',
            borderRadius: '16px',
            color: '#166534',
            fontSize: '13.5px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>💾</span>
            <span>
              <strong>Local Library:</strong> You have <strong>{totalCount}</strong> item{totalCount === 1 ? '' : 's'} saved in this browser.
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link
              to="/login"
              state={{ from: '/saved' }}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                background: '#0F5E53',
                color: '#ffffff',
                fontSize: '12.5px',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              Sign In to Sync
            </Link>
            <Link
              to="/register"
              state={{ from: '/saved' }}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                background: '#ffffff',
                color: '#0F5E53',
                border: '1px solid rgba(15, 94, 83, 0.25)',
                fontSize: '12.5px',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              Register
            </Link>
          </div>
        </div>
      )}

      {/* ── Case 3: Logged In with 0 Items -> Inspiring Empty State ── */}
      {isLoggedIn && totalCount === 0 && (
        <div className="saved-empty-card" style={{ padding: '48px 24px', margin: '20px 0 40px' }}>
          <div className="saved-empty-icon">📚</div>
          <h4>Your personal library is empty</h4>
          <p>
            You haven't bookmarked any textbooks or video courses yet. Tap the bookmark star on any book or the save heart on any video course to build your collection.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
            <Link to="/library" className="saved-empty-btn">
              <span>📖</span>
              <span>Browse Open Textbooks</span>
            </Link>
            <Link
              to="/videos"
              className="saved-empty-btn"
              style={{ background: '#E6F4F1', color: '#0F5E53', border: '1px solid rgba(15, 94, 83, 0.2)' }}
            >
              <span>🎬</span>
              <span>Watch Video Courses</span>
            </Link>
          </div>
        </div>
      )}

      {/* ── Filter Tabs & Content (When items exist) ── */}
      {totalCount > 0 && (
        <>
          <div className="saved-tabs-row">
            <button
              type="button"
              className={`saved-tab-pill ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All Items ({totalCount})
            </button>
            <button
              type="button"
              className={`saved-tab-pill ${activeTab === 'books' ? 'active' : ''}`}
              onClick={() => setActiveTab('books')}
            >
              📚 Textbooks ({savedBooksList.length})
            </button>
            <button
              type="button"
              className={`saved-tab-pill ${activeTab === 'videos' ? 'active' : ''}`}
              onClick={() => setActiveTab('videos')}
            >
              🎬 Video Courses ({savedVideosList.length})
            </button>
          </div>

          {/* Section: Textbooks */}
          {(activeTab === 'all' || activeTab === 'books') && (
            <div style={{ marginBottom: '40px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--ink)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>📚</span>
                  <span>Saved Textbooks &amp; Open Books</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--muted)', background: '#f1f5f9', padding: '2px 8px', borderRadius: '12px' }}>
                    {savedBooksList.length}
                  </span>
                </h2>
                {savedBooksList.length > 0 && (
                  <Link to="/library" style={{ fontSize: '12.5px', color: '#0F5E53', fontWeight: 700, textDecoration: 'none' }}>
                    Browse more books →
                  </Link>
                )}
              </div>

              {savedBooksList.length > 0 ? (
                <Cards list={savedBooksList} saved={saved} toggle={toggle} />
              ) : (
                <div className="saved-empty-card">
                  <div className="saved-empty-icon" style={{ width: '44px', height: '44px', fontSize: '20px' }}>📖</div>
                  <h4>No saved textbooks yet</h4>
                  <p>Explore thousands of NCERT school books and OpenStax college textbooks.</p>
                  <Link to="/library" className="saved-empty-btn">
                    Browse Textbooks
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Section: Video Courses */}
          {(activeTab === 'all' || activeTab === 'videos') && (
            <div style={{ marginBottom: '40px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--ink)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🎬</span>
                  <span>Saved Video Courses</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--muted)', background: '#f1f5f9', padding: '2px 8px', borderRadius: '12px' }}>
                    {savedVideosList.length}
                  </span>
                </h2>
                {savedVideosList.length > 0 && (
                  <Link to="/videos" style={{ fontSize: '12.5px', color: '#0F5E53', fontWeight: 700, textDecoration: 'none' }}>
                    Browse video courses →
                  </Link>
                )}
              </div>

              {savedVideosList.length > 0 ? (
                <div className="video-gallery-grid" style={{ '--desktop-cols': 3 }}>
                  {savedVideosList.map((vid) => (
                    <VideoCard key={vid.id || vid.videoId} video={vid} />
                  ))}
                </div>
              ) : (
                <div className="saved-empty-card">
                  <div className="saved-empty-icon" style={{ width: '44px', height: '44px', fontSize: '20px' }}>🎬</div>
                  <h4>No saved video courses yet</h4>
                  <p>Save free computer science, physics, chemistry, and mathematics video courses.</p>
                  <Link to="/videos" className="saved-empty-btn">
                    Explore Video Hub
                  </Link>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default SavedPage;

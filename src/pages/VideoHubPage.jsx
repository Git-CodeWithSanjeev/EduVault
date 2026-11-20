import React from 'react';
import { VideoGallery } from '../components/VideoGallery';
import { educationalGalleryData } from '../data/educationalGalleryData';

export function VideoHub() {
  return (
    <div style={{ maxWidth: '1320px', margin: '0 auto', padding: '16px' }}>
      {/* Dedicated Video Hub Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(13, 148, 136, 0.08) 0%, rgba(20, 184, 166, 0.03) 100%)',
          border: '1px solid rgba(13, 148, 136, 0.18)',
          borderRadius: '16px',
          padding: '32px 24px',
          marginBottom: '28px',
          textAlign: 'center',
        }}
      >
        <span
          style={{
            fontSize: '11px',
            fontWeight: 800,
            letterSpacing: '1px',
            color: 'var(--p, #0d9488)',
            textTransform: 'uppercase',
            display: 'inline-block',
            marginBottom: '8px',
          }}
        >
          CURATED EDUCATIONAL VIDEO COURSES
        </span>
        <h1
          style={{
            fontSize: 'clamp(26px, 3.5vw, 38px)',
            fontWeight: 800,
            margin: '0 0 12px',
            color: 'var(--ink, #0f172a)',
            letterSpacing: '-0.02em',
          }}
        >
          Comprehensive Video Learning Vault
        </h1>
        <p
          style={{
            maxWidth: '680px',
            margin: '0 auto 18px',
            fontSize: '15px',
            color: 'var(--muted, #64748b)',
            lineHeight: 1.5,
          }}
        >
          Explore 100+ verified chapter-by-chapter playlists from top educators: NCERT K-12 foundational subjects, B.Tech &amp; Computer Science, and Quantitative Aptitude.
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, padding: '5px 12px', borderRadius: '20px', background: '#ccfbf1', color: '#0f766e' }}>
            ✓ Zero Ads or Paywalls
          </span>
          <span style={{ fontSize: '12px', fontWeight: 700, padding: '5px 12px', borderRadius: '20px', background: '#e0f2fe', color: '#0369a1' }}>
            ✓ Verified YouTube Playlists
          </span>
          <span style={{ fontSize: '12px', fontWeight: 700, padding: '5px 12px', borderRadius: '20px', background: '#fef3c7', color: '#92400e' }}>
            ✓ Classes 1–12 &amp; Higher Ed
          </span>
        </div>
      </div>

      <VideoGallery
        videos={educationalGalleryData}
        title="All Available Video Courses"
        subtitle="Filter by class, subject, or academic tier to find complete course playlists."
        showFilters={true}
        columns={3}
      />
    </div>
  );
}

export default VideoHub;


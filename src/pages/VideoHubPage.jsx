import React from 'react';
import { VideoGallery } from '../components/VideoGallery';
import { educationalGalleryData } from '../data/educationalGalleryData';

export function VideoHub() {
  return (
    <section className="page" style={{ padding: '16px' }}>
      {/* Featured High Quality Educational Video Gallery */}
      <VideoGallery
        videos={educationalGalleryData}
        title="Class 1 to 12 & Degree Video Vault"
        subtitle="Curated NCERT Class 1 to 12 playlists, B.Tech & Computer Science, Quantitative Aptitude, and Degree courses."
        showFilters={true}
        columns={3}
      />
    </section>
  );
}

export default VideoHub;


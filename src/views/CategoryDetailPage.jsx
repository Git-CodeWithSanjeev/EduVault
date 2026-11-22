'use client';

import React, { useMemo } from 'react';
import { useParams, Link } from '../utils/routerCompat';
import { cats, getCategorySlug, getResourcesForCategory } from '../data/openItems';
import { Cards } from '../components/ResourceGrid';
import { VideoCard } from '../components/VideoCard';
import { educationalGalleryData } from '../data/educationalGalleryData';

export function CategoryView({ saved = [], toggle = () => {} }) {
  const { slug } = useParams();
  const matchedCat = cats.find((c) => getCategorySlug(c) === slug);
  const title = matchedCat || slug.split('-').map((x) => x[0].toUpperCase() + x.slice(1)).join(' ');

  const categoryResources = useMemo(() => getResourcesForCategory(slug), [slug]);
  const categoryVideos = useMemo(() => {
    return educationalGalleryData.filter((v) => {
      const tSlug = v.tier ? getCategorySlug(v.tier) : '';
      const cSlug = v.category ? getCategorySlug(v.category) : '';
      const sSlug = v.subject ? getCategorySlug(v.subject) : '';
      return tSlug === slug || cSlug === slug || sSlug === slug;
    });
  }, [slug]);

  const totalCount = categoryResources.length + categoryVideos.length;

  return (
    <section className="page">
      <Link to="/categories" className="back">
        ← Back to categories
      </Link>
      <p className="eyebrow">CATEGORY ARCHIVE</p>
      <h2>{title}</h2>
      <p className="intro">
        Showing <strong>{totalCount}</strong> verified open learning resources in {title}.
        All external links open safely via EduVault's gateway.
      </p>

      {categoryResources.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px', color: 'var(--ink)' }}>
            Textbooks & Open Resources ({categoryResources.length})
          </h3>
          <Cards list={categoryResources} saved={saved} toggle={toggle} />
        </div>
      )}

      {categoryVideos.length > 0 && (
        <div style={{ marginTop: '36px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px', color: 'var(--ink)' }}>
            Video Courses & Masterclasses ({categoryVideos.length})
          </h3>
          <div className="video-gallery-grid" style={{ '--desktop-cols': 3 }}>
            {categoryVideos.map((vid, idx) => (
              <VideoCard key={(vid.id || vid.videoId || 'vid') + '-' + idx} video={vid} />
            ))}
          </div>
        </div>
      )}

      {totalCount === 0 && (
        <div className="empty">
          <p>No specific resources cataloged in this exact view yet.</p>
          <Link className="hero-link" to="/library">
            Explore complete library →
          </Link>
        </div>
      )}
    </section>
  );
}

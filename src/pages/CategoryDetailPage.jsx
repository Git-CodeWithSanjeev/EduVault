import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { cats, getCategorySlug, getResourcesForCategory } from '../data/openItems';
import { Cards } from '../components/ResourceGrid';

export function CategoryView({ saved = [], toggle = () => {} }) {
  const { slug } = useParams();
  const matchedCat = cats.find((c) => getCategorySlug(c) === slug);
  const title = matchedCat || slug.split('-').map((x) => x[0].toUpperCase() + x.slice(1)).join(' ');

  const categoryResources = useMemo(() => getResourcesForCategory(slug), [slug]);

  return (
    <section className="page">
      <Link to="/categories" className="back">
        ← Back to categories
      </Link>
      <p className="eyebrow">CATEGORY ARCHIVE</p>
      <h2>{title}</h2>
      <p className="intro">
        Showing <strong>{categoryResources.length}</strong> verified open learning resources in {title}.
        All external links open safely via EduVault's gateway.
      </p>

      {categoryResources.length > 0 ? (
        <div style={{ marginTop: '24px' }}>
          <Cards list={categoryResources} saved={saved} toggle={toggle} />
        </div>
      ) : (
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

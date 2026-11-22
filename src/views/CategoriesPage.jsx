'use client';

import React from 'react';
import { Link } from '../utils/routerCompat';
import { cats, getCategorySlug, getResourcesForCategory } from '../data/openItems';
import { educationalGalleryData } from '../data/educationalGalleryData';

export function Categories() {
  return (
    <section className="page">
      <p className="eyebrow">EDUCATION TAXONOMY</p>
      <h2>Browse every path.</h2>
      <div className="tree">
        {cats.map((x) => {
          const slug = getCategorySlug(x);
          const bookCount = getResourcesForCategory(slug).length;
          const videoCount = educationalGalleryData.filter((v) => {
            const tSlug = v.tier ? getCategorySlug(v.tier) : '';
            const cSlug = v.category ? getCategorySlug(v.category) : '';
            const sSlug = v.subject ? getCategorySlug(v.subject) : '';
            return tSlug === slug || cSlug === slug || sSlug === slug;
          }).length;
          const totalCount = bookCount + videoCount;

          return (
            <Link key={x} to={'/category/' + slug}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {x}
                {totalCount > 0 ? (
                  <small style={{ background: '#ccfbf1', color: 'var(--p-dark)', padding: '2px 7px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>
                    {totalCount}
                  </small>
                ) : (
                  <small style={{ background: '#f1f5f9', color: '#64748b', padding: '2px 7px', borderRadius: '12px', fontSize: '10px', fontWeight: 600 }}>
                    Coming Soon
                  </small>
                )}
              </span>
              <span>→</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

import React from 'react';
import { Link } from 'react-router-dom';
import { cats, getCategorySlug, getResourcesForCategory } from '../data/openItems';

export function Categories() {
  return (
    <section className="page">
      <p className="eyebrow">EDUCATION TAXONOMY</p>
      <h2>Browse every path.</h2>
      <div className="tree">
        {cats.map((x) => {
          const slug = getCategorySlug(x);
          const count = getResourcesForCategory(slug).length;
          return (
            <Link key={x} to={'/category/' + slug}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {x}
                <small style={{ background: '#ccfbf1', color: 'var(--p-dark)', padding: '2px 7px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>
                  {count}
                </small>
              </span>
              <span>→</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

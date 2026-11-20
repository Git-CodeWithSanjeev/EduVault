import React from 'react';
import { useLocation, Link } from 'react-router-dom';

const INFO_PAGES = {
  '/about': {
    eyebrow: 'ABOUT EDUVAULT',
    title: 'Open Education for Everyone',
    intro: 'EduVault is a free open educational resource library dedicated to making quality learning materials universally accessible.',
    content: (
      <>
        <h3>Our Mission</h3>
        <p>
          EduVault bridges the educational divide by curating verified open textbooks, NCERT school curriculum materials, OpenStax peer-reviewed college textbooks, and curated multi-lesson video masterclasses from verified educators.
        </p>
        <h3>Open Licensing &amp; Integrity</h3>
        <p>
          Every resource indexed on EduVault is hosted legally in accordance with open-access licenses (including Creative Commons, Public Domain, and NCERT official open publishing terms). We never charge fees, display ads, or paywall any public educational content.
        </p>
        <h3>Core Features</h3>
        <ul>
          <li><strong>Integrated Adobe PDF Reader:</strong> Read books and chapters directly in browser without downloading heavy files.</li>
          <li><strong>Curated Video Masterclasses:</strong> Structured playlists for school classes 1–12, engineering, web development, and quantitative aptitude.</li>
          <li><strong>Personal Library:</strong> Save and organize your textbooks, lessons, and reading lists seamlessly across sessions.</li>
        </ul>
      </>
    ),
  },
  '/privacy': {
    eyebrow: 'LEGAL & TRUST',
    title: 'Privacy Policy',
    intro: 'Your privacy is paramount. We believe in minimal data collection and maximum learner autonomy.',
    content: (
      <>
        <h3>Information We Collect</h3>
        <p>
          When you register or sign in with Google OAuth, we only store your basic email address and display name required to manage your saved library bookmarks and personal preferences.
        </p>
        <h3>Data Usage &amp; Protection</h3>
        <p>
          EduVault does not sell, rent, or monetize your personal data. We do not use third-party tracking cookies or targeted behavioral ad networks. All session tokens are securely handled.
        </p>
        <h3>Your Rights</h3>
        <p>
          You can clear your local search history at any time directly within the search modal, or delete saved library items from your profile.
        </p>
      </>
    ),
  },
  '/terms': {
    eyebrow: 'LEGAL & TERMS',
    title: 'Terms of Service',
    intro: 'Guidelines and conditions governing the use of EduVault open resources.',
    content: (
      <>
        <h3>Acceptable Educational Use</h3>
        <p>
          EduVault materials are provided freely for personal study, academic research, classroom teaching, and self-directed learning.
        </p>
        <h3>Intellectual Property</h3>
        <p>
          All textbooks and videos remain the intellectual property of their respective authors and publishers (e.g., NCERT, OpenStax, Rice University, individual YouTube content creators). Users must respect the open-access licenses under which each resource is distributed.
        </p>
        <h3>Takedown &amp; Infringement Policy</h3>
        <p>
          If you believe any content infringes upon your copyright, please visit our <Link to="/copyright">Copyright &amp; Takedown page</Link> to submit a report for immediate review.
        </p>
      </>
    ),
  },
  '/contact': {
    eyebrow: 'GET IN TOUCH',
    title: 'Contact EduVault',
    intro: 'Have a question, feedback, or open resource suggestion? We would love to hear from you.',
    content: (
      <>
        <h3>Support &amp; Inquiries</h3>
        <p>
          For general platform questions, textbook corrections, or feedback, reach out to our team at:
          <br />
          <strong>support@eduvault.org</strong>
        </p>
        <h3>Educator Contributions</h3>
        <p>
          Are you an educator or content creator wishing to index your open playlist or textbook on EduVault?
          Visit our <Link to="/upload">Contribute page</Link> or email <strong>collaborate@eduvault.org</strong>.
        </p>
      </>
    ),
  },
};

export function StaticInfoPage() {
  const { pathname } = useLocation();
  const info = INFO_PAGES[pathname] || INFO_PAGES['/about'];

  return (
    <section className="page" style={{ maxWidth: '820px', margin: '0 auto', padding: '32px 20px' }}>
      <p className="eyebrow">{info.eyebrow}</p>
      <h1 style={{ fontSize: '32px', fontWeight: 800, margin: '10px 0 14px', color: 'var(--ink)' }}>
        {info.title}
      </h1>
      <p className="intro" style={{ fontSize: '16px', lineHeight: 1.6, color: 'var(--muted)', marginBottom: '28px' }}>
        {info.intro}
      </p>

      <div
        style={{
          background: 'var(--card, #ffffff)',
          border: '1px solid var(--line)',
          borderRadius: '16px',
          padding: '28px 24px',
          lineHeight: 1.7,
          color: 'var(--ink)',
        }}
      >
        {info.content}
      </div>

      <div style={{ marginTop: '28px' }}>
        <Link to="/" style={{ color: 'var(--p-dark)', fontWeight: 700, textDecoration: 'none' }}>
          ← Back to EduVault Home
        </Link>
      </div>
    </section>
  );
}

export default StaticInfoPage;

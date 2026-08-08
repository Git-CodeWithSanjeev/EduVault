import React from 'react';

export function getSubjectColorClass(subject, category, title) {
  const s = ((subject || '') + ' ' + (category || '') + ' ' + (title || '')).toLowerCase();
  
  if (s.includes('physic')) return 'c-physics';
  if (s.includes('chem')) return 'c-chemistry';
  if (s.includes('bio') || s.includes('medic')) return 'c-biology';
  if (s.includes('math') || s.includes('stat') || s.includes('algebra')) return 'c-math';
  if (s.includes('computer') || s.includes('python') || s.includes('code') || s.includes('tech') || s.includes('engg') || s.includes('engineering')) return 'c-tech';
  if (s.includes('history') || s.includes('geography') || s.includes('polity') || s.includes('social') || s.includes('humanities')) return 'c-history';
  if (s.includes('law') || s.includes('const')) return 'c-law';
  if (s.includes('commerce') || s.includes('business') || s.includes('account') || s.includes('mgmt') || s.includes('econom')) return 'c-commerce';
  if (s.includes('hindi') || s.includes('sanskrit')) return 'c-hindi';
  if (s.includes('english')) return 'c-english';
  return 'c-general';
}

function SubjectWatermark({ subject, category, title }) {
  const s = ((subject || '') + ' ' + (category || '') + ' ' + (title || '')).toLowerCase();

  if (s.includes('physic')) {
    return (
      <svg className="cover-watermark" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5">
        <ellipse cx="50" cy="50" rx="40" ry="15" transform="rotate(30 50 50)" opacity="0.35" />
        <ellipse cx="50" cy="50" rx="40" ry="15" transform="rotate(90 50 50)" opacity="0.35" />
        <ellipse cx="50" cy="50" rx="40" ry="15" transform="rotate(150 50 50)" opacity="0.35" />
        <circle cx="50" cy="50" r="6" fill="currentColor" opacity="0.6" />
      </svg>
    );
  }
  if (s.includes('chem')) {
    return (
      <svg className="cover-watermark" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5">
        <polygon points="50,15 80,32 80,68 50,85 20,68 20,32" opacity="0.35" />
        <circle cx="50" cy="50" r="18" opacity="0.25" />
        <line x1="50" y1="15" x2="50" y2="35" opacity="0.4" />
        <line x1="80" y1="32" x2="63" y2="42" opacity="0.4" />
        <line x1="20" y1="68" x2="37" y2="58" opacity="0.4" />
      </svg>
    );
  }
  if (s.includes('bio') || s.includes('medic')) {
    return (
      <svg className="cover-watermark" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M25,10 Q50,50 75,90 M75,10 Q50,50 25,90" opacity="0.4" />
        <line x1="33" y1="23" x2="67" y2="23" opacity="0.4" />
        <line x1="42" y1="37" x2="58" y2="37" opacity="0.4" />
        <line x1="42" y1="63" x2="58" y2="63" opacity="0.4" />
        <line x1="33" y1="77" x2="67" y2="77" opacity="0.4" />
      </svg>
    );
  }
  if (s.includes('math') || s.includes('stat') || s.includes('algebra')) {
    return (
      <svg className="cover-watermark" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="50" cy="50" r="35" opacity="0.25" />
        <polygon points="50,15 80,75 20,75" opacity="0.35" />
        <line x1="15" y1="50" x2="85" y2="50" strokeDasharray="4 4" opacity="0.3" />
        <line x1="50" y1="15" x2="50" y2="85" strokeDasharray="4 4" opacity="0.3" />
      </svg>
    );
  }
  if (s.includes('computer') || s.includes('tech') || s.includes('python') || s.includes('code')) {
    return (
      <svg className="cover-watermark" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M30,30 L15,50 L30,70 M70,30 L85,50 L70,70" opacity="0.4" />
        <line x1="55" y1="25" x2="45" y2="75" opacity="0.4" />
      </svg>
    );
  }
  if (s.includes('history') || s.includes('geography') || s.includes('social') || s.includes('polity')) {
    return (
      <svg className="cover-watermark" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="50" cy="50" r="36" opacity="0.35" />
        <ellipse cx="50" cy="50" rx="16" ry="36" opacity="0.3" />
        <line x1="14" y1="50" x2="86" y2="50" opacity="0.3" />
        <line x1="20" y1="30" x2="80" y2="30" opacity="0.25" />
        <line x1="20" y1="70" x2="80" y2="70" opacity="0.25" />
      </svg>
    );
  }
  // Default book emblem
  return (
    <svg className="cover-watermark" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M20,35 Q50,25 80,35 L80,75 Q50,65 20,75 Z" opacity="0.3" />
      <line x1="50" y1="27" x2="50" y2="70" opacity="0.4" />
    </svg>
  );
}

export function BookCover({ item }) {
  const colorClass = getSubjectColorClass(item.subject, item.category, item.title);
  return (
    <div className={`cover ${colorClass}`}>
      {/* 3D Spine Fold & Linen Texture Overlay */}
      <div className="cover-spine-fold" />
      <div className="cover-gold-foil-top" />
      <div className="cover-gold-foil-bottom" />

      {/* Subject Watermark Icon */}
      <SubjectWatermark subject={item.subject} category={item.category} title={item.title} />

      <div className="cover-content">
        <span className="cover-tag">{item.source}</span>
        <div className="cover-title-box">
          <div className="cover-title">{item.title}</div>
        </div>
        <div className="cover-bottom">
          <span>{item.level}</span>
          <span className="cover-badge">{item.subject === 'All subjects' ? 'OPEN' : item.subject}</span>
        </div>
      </div>
    </div>
  );
}

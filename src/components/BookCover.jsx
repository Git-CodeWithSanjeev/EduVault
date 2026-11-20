import React from 'react';

export function BookCover({ item }) {
  const [imgError, setImgError] = React.useState(false);
  const s = ((item.subject || '') + ' ' + (item.category || '') + ' ' + (item.title || '')).toLowerCase();

  // If a valid external cover image exists and is not ncert.nic.in
  const hasValidExternalCover = item.coverUrl && !item.coverUrl.includes('ncert.nic.in') && !imgError;

  if (hasValidExternalCover) {
    return (
      <div
        style={{
          width: '100%',
          aspectRatio: '3 / 4',
          borderRadius: '12px',
          overflow: 'hidden',
          position: 'relative',
          background: '#0f172a',
          boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
        }}
      >
        <img
          src={item.coverUrl}
          alt=""
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'blur(16px)',
            opacity: 0.5,
            transform: 'scale(1.2)',
          }}
        />
        <img
          src={item.coverUrl}
          alt={item.title}
          loading="lazy"
          decoding="async"
          onError={() => setImgError(true)}
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 1,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            width: '8px',
            background: 'linear-gradient(90deg, rgba(0,0,0,0.35) 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
            zIndex: 3,
            pointerEvents: 'none',
          }}
        />
      </div>
    );
  }

  // Modern subject-coded gradient covers matching the attached UI design
  let gradient = 'linear-gradient(145deg, #134e4a 0%, #0F5E53 40%, #115e59 100%)';
  let badgeSource = `${item.source || 'NCERT'} · ${item.level || 'Class 12'}`;
  let watermarkSvg = null;

  if (s.includes('physic')) {
    gradient = 'linear-gradient(145deg, #1e1b4b 0%, #2e1065 40%, #4338ca 100%)';
    badgeSource = `${item.source || 'NCERT'} · Class 12`;
    watermarkSvg = (
      <svg width="90" height="90" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.35 }}>
        <ellipse cx="50" cy="50" rx="42" ry="16" transform="rotate(30 50 50)" />
        <ellipse cx="50" cy="50" rx="42" ry="16" transform="rotate(90 50 50)" />
        <ellipse cx="50" cy="50" rx="42" ry="16" transform="rotate(150 50 50)" />
        <circle cx="50" cy="50" r="7" fill="currentColor" opacity="0.8" />
      </svg>
    );
  } else if (s.includes('chem')) {
    gradient = 'linear-gradient(145deg, #7c2d12 0%, #9a3412 40%, #ea580c 100%)';
    badgeSource = `${item.source || 'NCERT'} · Class 11`;
    watermarkSvg = (
      <svg width="85" height="85" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.6" style={{ opacity: 0.35 }}>
        <circle cx="50" cy="30" r="14" fill="currentColor" opacity="0.6" />
        <circle cx="30" cy="70" r="12" fill="currentColor" opacity="0.5" />
        <circle cx="70" cy="70" r="12" fill="currentColor" opacity="0.5" />
        <line x1="50" y1="30" x2="30" y2="70" stroke="currentColor" strokeWidth="3" />
        <line x1="50" y1="30" x2="70" y2="70" stroke="currentColor" strokeWidth="3" />
        <line x1="30" y1="70" x2="70" y2="70" stroke="currentColor" strokeWidth="3" />
      </svg>
    );
  } else if (s.includes('bio') || s.includes('medic') || s.includes('life')) {
    gradient = 'linear-gradient(145deg, #064e3b 0%, #065f46 40%, #047857 100%)';
    badgeSource = `${item.source || 'OpenStax'} · Biology`;
    watermarkSvg = (
      <svg width="85" height="85" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ opacity: 0.38 }}>
        <path d="M50 15 C30 35 25 65 50 85 C75 65 70 35 50 15 Z" fill="currentColor" opacity="0.3" />
        <path d="M50 20 L50 80" stroke="currentColor" strokeWidth="2" />
        <path d="M50 40 Q38 35 32 45" stroke="currentColor" strokeWidth="1.5" />
        <path d="M50 55 Q62 50 68 60" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  } else if (s.includes('computer') || s.includes('tech') || s.includes('cs50') || s.includes('code')) {
    gradient = 'linear-gradient(145deg, #0f172a 0%, #1e293b 40%, #334155 100%)';
    badgeSource = `${item.source || 'Harvard'} · CS50`;
    watermarkSvg = (
      <svg width="90" height="90" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.3 }}>
        <text x="15" y="30" fill="currentColor" fontSize="11" fontFamily="monospace" opacity="0.6">10110 01</text>
        <text x="25" y="48" fill="currentColor" fontSize="11" fontFamily="monospace" opacity="0.8">010010 010</text>
        <text x="20" y="66" fill="currentColor" fontSize="11" fontFamily="monospace" opacity="0.6">001010 1110</text>
        <text x="35" y="84" fill="currentColor" fontSize="11" fontFamily="monospace" opacity="0.5">0 10 1</text>
      </svg>
    );
  } else if (s.includes('math') || s.includes('stat') || s.includes('algebra')) {
    gradient = 'linear-gradient(145deg, #172554 0%, #1e40af 40%, #2563eb 100%)';
    badgeSource = `${item.source || 'NCERT'} · Mathematics`;
    watermarkSvg = (
      <svg width="85" height="85" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.6" style={{ opacity: 0.32 }}>
        <circle cx="50" cy="50" r="36" opacity="0.3" />
        <polygon points="50,18 82,74 18,74" opacity="0.4" />
        <line x1="16" y1="50" x2="84" y2="50" strokeDasharray="3 3" opacity="0.3" />
      </svg>
    );
  } else {
    watermarkSvg = (
      <svg width="80" height="80" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.3 }}>
        <path d="M20,35 Q50,25 80,35 L80,75 Q50,65 20,75 Z" opacity="0.35" />
        <line x1="50" y1="27" x2="50" y2="72" opacity="0.45" />
      </svg>
    );
  }

  return (
    <div
      style={{
        width: '100%',
        aspectRatio: '3 / 4',
        borderRadius: '12px',
        background: gradient,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '16px 14px',
        color: '#ffffff',
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        userSelect: 'none',
      }}
    >
      {/* 3D Spine Fold Effect on Left */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: '7px',
          background: 'linear-gradient(90deg, rgba(0,0,0,0.38) 0%, rgba(255,255,255,0.18) 50%, transparent 100%)',
          zIndex: 4,
          pointerEvents: 'none',
        }}
      />

      {/* Top Source Badge */}
      <div style={{ zIndex: 2 }}>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            color: 'rgba(255, 255, 255, 0.85)',
            letterSpacing: '0.4px',
            textTransform: 'uppercase',
          }}
        >
          {badgeSource}
        </span>
      </div>

      {/* Title Block */}
      <div style={{ zIndex: 2, margin: 'auto 0' }}>
        <div
          style={{
            fontSize: '16px',
            fontWeight: 800,
            lineHeight: 1.3,
            color: '#ffffff',
            textShadow: '0 2px 6px rgba(0,0,0,0.3)',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {item.title}
        </div>
      </div>

      {/* Subject Watermark Graphic */}
      <div
        style={{
          position: 'absolute',
          right: '-5px',
          bottom: '15px',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      >
        {watermarkSvg}
      </div>

      {/* Bottom Level Pill inside cover */}
      <div style={{ zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
        <span
          style={{
            background: 'rgba(255, 255, 255, 0.22)',
            backdropFilter: 'blur(6px)',
            color: '#ffffff',
            fontSize: '11px',
            fontWeight: 700,
            padding: '3px 9px',
            borderRadius: '6px',
            letterSpacing: '0.2px',
          }}
        >
          {item.level || 'Class 12'}
        </span>
      </div>
    </div>
  );
}

export default BookCover;

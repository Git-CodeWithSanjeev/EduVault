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
    badgeSource = item.coverBadge || 'Indigo Cover';
    watermarkSvg = (
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none" style={{ opacity: 0.85 }}>
        <defs>
          <radialGradient id="physGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.9" />
            <stop offset="60%" stopColor="#ea580c" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#ea580c" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* Orbital Ellipses */}
        <ellipse cx="60" cy="70" rx="50" ry="18" stroke="#818cf8" strokeWidth="1.6" strokeDasharray="4 2" transform="rotate(-25 60 70)" opacity="0.6" />
        <ellipse cx="60" cy="70" rx="50" ry="18" stroke="#c084fc" strokeWidth="1.6" transform="rotate(35 60 70)" opacity="0.7" />
        <ellipse cx="60" cy="70" rx="52" ry="16" stroke="#38bdf8" strokeWidth="1.8" transform="rotate(95 60 70)" opacity="0.8" />
        {/* Wave lines */}
        <path d="M10 85 Q35 65 60 85 T110 85" stroke="#a78bfa" strokeWidth="2" fill="none" opacity="0.5" />
        <path d="M15 95 Q40 75 65 95 T115 95" stroke="#f472b6" strokeWidth="1.5" fill="none" opacity="0.4" />
        {/* Glowing Center Orb */}
        <circle cx="60" cy="70" r="14" fill="url(#physGlow)" />
        <circle cx="60" cy="70" r="7" fill="#fbbf24" />
      </svg>
    );
  } else if (s.includes('chem')) {
    gradient = 'linear-gradient(145deg, #7c2d12 0%, #9a3412 40%, #ea580c 100%)';
    badgeSource = item.coverBadge || 'Amber Cover';
    watermarkSvg = (
      <svg width="115" height="115" viewBox="0 0 120 120" fill="none" style={{ opacity: 0.85 }}>
        <defs>
          <radialGradient id="atomGlow1" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fed7aa" />
            <stop offset="70%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#c2410c" />
          </radialGradient>
          <radialGradient id="atomGlow2" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="80%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#ca8a04" />
          </radialGradient>
        </defs>
        {/* Bond Rods */}
        <line x1="60" y1="42" x2="35" y2="78" stroke="#fdba74" strokeWidth="4" strokeLinecap="round" opacity="0.7" />
        <line x1="60" y1="42" x2="85" y2="78" stroke="#fdba74" strokeWidth="4" strokeLinecap="round" opacity="0.7" />
        <line x1="35" y1="78" x2="85" y2="78" stroke="#fdba74" strokeWidth="4" strokeLinecap="round" opacity="0.7" />
        <line x1="85" y1="78" x2="105" y2="60" stroke="#fde047" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
        {/* 3D Atoms */}
        <circle cx="60" cy="42" r="15" fill="url(#atomGlow1)" filter="drop-shadow(0 4px 8px rgba(0,0,0,0.3))" />
        <circle cx="35" cy="78" r="13" fill="url(#atomGlow2)" filter="drop-shadow(0 4px 8px rgba(0,0,0,0.3))" />
        <circle cx="85" cy="78" r="14" fill="url(#atomGlow1)" filter="drop-shadow(0 4px 8px rgba(0,0,0,0.3))" />
        <circle cx="105" cy="60" r="9" fill="url(#atomGlow2)" />
      </svg>
    );
  } else if (s.includes('bio') || s.includes('medic') || s.includes('life')) {
    gradient = 'linear-gradient(145deg, #064e3b 0%, #065f46 40%, #047857 100%)';
    badgeSource = item.coverBadge || 'Emerald Cover';
    watermarkSvg = (
      <svg width="115" height="115" viewBox="0 0 120 120" fill="none" style={{ opacity: 0.75 }}>
        {/* Elegant Botanical Leaves */}
        <path d="M30 100 Q 55 70 85 40" stroke="#a7f3d0" strokeWidth="3" strokeLinecap="round" />
        <path d="M85 40 C 95 30 100 20 100 15 C 95 15 85 20 75 30 C 65 40 75 45 85 40 Z" fill="#6ee7b7" opacity="0.8" />
        <path d="M60 65 C 75 55 85 55 90 50 C 85 60 75 70 60 65 Z" fill="#34d399" opacity="0.85" />
        <path d="M48 78 C 32 70 25 72 20 68 C 28 80 38 85 48 78 Z" fill="#10b981" opacity="0.9" />
        <path d="M68 52 C 55 42 48 45 42 40 C 50 52 60 56 68 52 Z" fill="#6ee7b7" opacity="0.75" />
      </svg>
    );
  } else if (s.includes('computer') || s.includes('tech') || s.includes('cs50') || s.includes('code')) {
    gradient = 'linear-gradient(145deg, #0f172a 0%, #1e293b 40%, #334155 100%)';
    badgeSource = item.coverBadge || `${item.source || 'Harvard'} · CS50`;
    watermarkSvg = (
      <svg width="115" height="115" viewBox="0 0 120 120" fill="none" style={{ opacity: 0.8 }}>
        <g fontFamily="monospace" fontSize="12" fontWeight="700" letterSpacing="1.5">
          <text x="35" y="45" fill="#38bdf8" opacity="0.6">10110 0</text>
          <text x="20" y="65" fill="#4ade80" opacity="0.9">010010 010</text>
          <text x="15" y="85" fill="#38bdf8" opacity="0.7">001010 1110</text>
          <text x="40" y="105" fill="#facc15" opacity="0.8">0 10 1</text>
        </g>
      </svg>
    );
  } else if (s.includes('math') || s.includes('stat') || s.includes('algebra')) {
    gradient = 'linear-gradient(145deg, #172554 0%, #1e40af 40%, #2563eb 100%)';
    badgeSource = item.coverBadge || `${item.source || 'NCERT'} · Mathematics`;
    watermarkSvg = (
      <svg width="100" height="100" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.6" style={{ opacity: 0.45 }}>
        <circle cx="50" cy="50" r="36" opacity="0.3" />
        <polygon points="50,18 82,74 18,74" opacity="0.5" />
        <line x1="16" y1="50" x2="84" y2="50" strokeDasharray="3 3" opacity="0.4" />
      </svg>
    );
  } else {
    watermarkSvg = (
      <svg width="85" height="85" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.4 }}>
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

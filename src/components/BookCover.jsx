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

  // Exact cover layouts matching the target design
  let gradient = 'linear-gradient(160deg, #1e1b4b 0%, #2e1065 50%, #312e81 100%)';
  let badgeSource = item.coverBadge || 'Indigo Cover';
  let levelPill = item.level || 'Class 12';
  let artworkSvg = null;

  if (s.includes('physic')) {
    gradient = 'linear-gradient(160deg, #261958 0%, #351c75 45%, #25124d 100%)';
    badgeSource = item.coverBadge || 'Indigo Cover';
    levelPill = 'Class 12';
    artworkSvg = (
      <svg viewBox="0 0 200 120" style={{ width: '100%', height: '100%' }}>
        <defs>
          <radialGradient id="physicSun" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="40%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#dc2626" stopOpacity="0.8" />
          </radialGradient>
        </defs>
        {/* Sinusoidal Glowing Wave Ribbons */}
        <path d="M-10,90 Q40,40 100,85 T210,60" fill="none" stroke="#60a5fa" strokeWidth="2.5" opacity="0.8" />
        <path d="M-10,80 Q45,110 110,65 T210,80" fill="none" stroke="#c084fc" strokeWidth="2" opacity="0.75" />
        <path d="M-10,60 Q50,20 120,70 T210,50" fill="none" stroke="#38bdf8" strokeWidth="1.8" opacity="0.6" />
        <path d="M-10,100 Q60,60 130,95 T210,75" fill="none" stroke="#f472b6" strokeWidth="1.5" opacity="0.55" />
        {/* Glowing Orange Sun Core */}
        <circle cx="115" cy="76" r="16" fill="url(#physicSun)" filter="drop-shadow(0 0 10px #f97316)" />
        <circle cx="160" cy="85" r="4" fill="#a78bfa" opacity="0.8" />
        <circle cx="70" cy="55" r="3" fill="#38bdf8" opacity="0.8" />
      </svg>
    );
  } else if (s.includes('chem')) {
    gradient = 'linear-gradient(160deg, #c2410c 0%, #ea580c 45%, #9a3412 100%)';
    badgeSource = item.coverBadge || 'Amber Cover';
    levelPill = 'Class 11';
    artworkSvg = (
      <svg viewBox="0 0 200 120" style={{ width: '100%', height: '100%' }}>
        <defs>
          <radialGradient id="chemBall1" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#fed7aa" />
            <stop offset="60%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#9a3412" />
          </radialGradient>
          <radialGradient id="chemBall2" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="70%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#854d0e" />
          </radialGradient>
          <radialGradient id="chemBall3" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#fca5a5" />
            <stop offset="65%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#7f1d1d" />
          </radialGradient>
        </defs>
        {/* Connecting Rods */}
        <line x1="75" y1="85" x2="120" y2="70" stroke="#ffedd5" strokeWidth="5" strokeLinecap="round" opacity="0.8" />
        <line x1="120" y1="70" x2="155" y2="95" stroke="#ffedd5" strokeWidth="5" strokeLinecap="round" opacity="0.8" />
        <line x1="120" y1="70" x2="110" y2="35" stroke="#ffedd5" strokeWidth="5" strokeLinecap="round" opacity="0.8" />
        <line x1="120" y1="70" x2="165" y2="55" stroke="#ffedd5" strokeWidth="5" strokeLinecap="round" opacity="0.8" />
        {/* 3D Atoms */}
        <circle cx="75" cy="85" r="13" fill="url(#chemBall2)" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.3))" />
        <circle cx="110" cy="35" r="10" fill="url(#chemBall1)" filter="drop-shadow(0 3px 5px rgba(0,0,0,0.3))" />
        <circle cx="165" cy="55" r="11" fill="url(#chemBall2)" filter="drop-shadow(0 3px 5px rgba(0,0,0,0.3))" />
        <circle cx="155" cy="95" r="10" fill="url(#chemBall1)" filter="drop-shadow(0 3px 5px rgba(0,0,0,0.3))" />
        <circle cx="120" cy="70" r="18" fill="url(#chemBall3)" filter="drop-shadow(0 6px 10px rgba(0,0,0,0.35))" />
      </svg>
    );
  } else if (s.includes('bio') || s.includes('life')) {
    gradient = 'linear-gradient(160deg, #064e3b 0%, #065f46 45%, #047857 100%)';
    badgeSource = item.coverBadge || 'Emerald Cover';
    levelPill = 'Class 12';
    artworkSvg = (
      <svg viewBox="0 0 200 120" style={{ width: '100%', height: '100%' }}>
        {/* Lush Botanical Leaves Artwork */}
        <path d="M120,115 Q135,75 160,35" fill="none" stroke="#6ee7b7" strokeWidth="3" strokeLinecap="round" opacity="0.9" />
        <path d="M160,35 C175,25 180,15 180,10 C170,10 160,18 150,28 C140,38 150,42 160,35 Z" fill="#34d399" opacity="0.9" />
        <path d="M140,55 C160,45 170,45 175,40 C170,52 160,60 145,55 Z" fill="#6ee7b7" opacity="0.95" />
        <path d="M130,70 C110,60 102,62 98,58 C108,70 120,75 130,70 Z" fill="#10b981" opacity="0.95" />
        <path d="M148,45 C135,35 128,38 122,33 C130,45 140,49 148,45 Z" fill="#34d399" opacity="0.85" />
        <path d="M136,88 C155,80 165,82 170,78 C164,90 152,95 136,88 Z" fill="#6ee7b7" opacity="0.9" />
        <path d="M124,98 C108,90 100,92 96,88 C104,100 115,103 124,98 Z" fill="#34d399" opacity="0.85" />
      </svg>
    );
  } else {
    gradient = 'linear-gradient(160deg, #0f172a 0%, #1e293b 50%, #334155 100%)';
    badgeSource = item.coverBadge || `${item.source || 'Harvard'} · CS50`;
    levelPill = 'Class 12';
    artworkSvg = (
      <svg viewBox="0 0 200 120" style={{ width: '100%', height: '100%' }}>
        <g fontFamily="monospace" fontSize="12" fontWeight="700" letterSpacing="2">
          <text x="60" y="45" fill="#38bdf8" opacity="0.6">10110 0</text>
          <text x="40" y="65" fill="#4ade80" opacity="0.9">010010 010</text>
          <text x="35" y="85" fill="#38bdf8" opacity="0.7">001010 1110</text>
          <text x="70" y="105" fill="#facc15" opacity="0.8">0 10 1</text>
        </g>
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
        padding: '14px 14px 0',
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

      {/* Top Section: Badge, Title, Level Pill directly below title */}
      <div style={{ zIndex: 2, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: 'rgba(255, 255, 255, 0.82)',
            letterSpacing: '0.2px',
          }}
        >
          {badgeSource}
        </span>

        <h4
          style={{
            fontSize: '15.5px',
            fontWeight: 800,
            lineHeight: 1.25,
            color: '#ffffff',
            margin: '2px 0 6px',
            textShadow: '0 2px 4px rgba(0,0,0,0.25)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {item.title}
        </h4>

        {/* Level Pill directly below title (Class 12, Class 11) */}
        <div>
          <span
            style={{
              display: 'inline-block',
              background: 'rgba(255, 255, 255, 0.22)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              color: '#ffffff',
              fontSize: '10.5px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '5px',
              letterSpacing: '0.2px',
            }}
          >
            {levelPill}
          </span>
        </div>
      </div>

      {/* Bottom Section: Artwork takes up lower half */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '52%',
          pointerEvents: 'none',
          zIndex: 1,
          marginTop: 'auto',
          overflow: 'hidden',
        }}
      >
        {artworkSvg}
      </div>
    </div>
  );
}

export default BookCover;

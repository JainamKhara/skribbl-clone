"use client";

import React from "react";

interface AvatarProps {
  index: number;
  name: string;
  className?: string;
}

export default function Avatar({ index, name, className = "w-8 h-8" }: AvatarProps) {
  // Deterministic attributes based on the player index
  const baseHue = (index * 73) % 360;
  const secondaryHue = (baseHue + 120) % 360;
  const accentHue = (baseHue + 240) % 360;

  const headStyle = index % 4;
  const eyeStyle = (index + 2) % 4;
  const earStyle = (index + 3) % 3;
  const mouthStyle = (index + 1) % 4;

  return (
    <svg
      viewBox="0 0 100 100"
      className={`${className} rounded-xl border-2 border-border/80 overflow-hidden shrink-0 shadow-sm`}
    >
      <defs>
        {/* Background Gradients */}
        <radialGradient id={`bg-grad-${index}`} cx="50%" cy="40%" r="70%">
          <stop offset="0%" stopColor={`hsl(${baseHue}, 85%, 45%)`} />
          <stop offset="100%" stopColor={`hsl(${baseHue}, 95%, 12%)`} />
        </radialGradient>

        {/* Head Solid Highlight Gradient */}
        <linearGradient id={`head-grad-${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={`hsl(${secondaryHue}, 85%, 65%)`} />
          <stop offset="100%" stopColor={`hsl(${secondaryHue}, 75%, 25%)`} />
        </linearGradient>

        {/* Gloss Overlay */}
        <linearGradient id="gloss" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
          <stop offset="35%" stopColor="#ffffff" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* 1. Cyber Grid Background */}
      <rect width="100" height="100" fill={`url(#bg-grad-${index})`} />
      <g stroke="white" strokeOpacity="0.08" strokeWidth="0.75">
        <line x1="0" y1="20" x2="100" y2="20" />
        <line x1="0" y1="40" x2="100" y2="40" />
        <line x1="0" y1="60" x2="100" y2="60" />
        <line x1="0" y1="80" x2="100" y2="80" />
        <line x1="20" y1="0" x2="20" y2="100" />
        <line x1="40" y1="0" x2="40" y2="100" />
        <line x1="60" y1="0" x2="60" y2="100" />
        <line x1="80" y1="0" x2="80" y2="100" />
      </g>

      {/* Background Aura */}
      <circle cx="50" cy="50" r="32" fill={`hsl(${accentHue}, 90%, 55%)`} opacity="0.18" filter="blur(6px)" />

      {/* 2. Side Attachments / Ears / Headsets */}
      {earStyle === 0 && (
        <g fill={`hsl(${accentHue}, 90%, 50%)`} stroke="#000" strokeWidth="2" strokeLinejoin="round">
          {/* Cyber Headset / Ear cups */}
          <rect x="12" y="38" width="10" height="24" rx="4" />
          <rect x="78" y="38" width="10" height="24" rx="4" />
          {/* Headband */}
          <path d="M 20 40 A 30 30 0 0 1 80 40" fill="none" strokeWidth="3" />
        </g>
      )}

      {earStyle === 1 && (
        <g fill={`hsl(${accentHue}, 95%, 60%)`} stroke="#000" strokeWidth="2">
          {/* Double Antennae */}
          <path d="M 25 35 L 12 18" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 75 35 L 88 18" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="12" cy="18" r="4.5" />
          <circle cx="88" cy="18" r="4.5" />
        </g>
      )}

      {earStyle === 2 && (
        <g fill="#1a1c24" stroke="#000" strokeWidth="2">
          {/* Mechanical bolts */}
          <polygon points="12,45 20,41 20,59 12,55" />
          <polygon points="88,45 80,41 80,59 88,55" />
        </g>
      )}

      {/* 3. Main Head Structure */}
      <g stroke="#000" strokeWidth="2.5" strokeLinejoin="round">
        {/* Head base */}
        {headStyle === 0 && (
          // Retro CRT Screen shape
          <rect x="22" y="26" width="56" height="48" rx="14" fill={`url(#head-grad-${index})`} />
        )}
        {headStyle === 1 && (
          // Cyber Octagonal Helmet
          <polygon
            points="32,24 68,24 80,38 80,62 68,74 32,74 20,62 20,38"
            fill={`url(#head-grad-${index})`}
          />
        )}
        {headStyle === 2 && (
          // Rounded Dome / Space Helmet
          <path
            d="M 22 55 A 28 28 0 0 1 78 55 L 75 74 L 25 74 Z"
            fill={`url(#head-grad-${index})`}
          />
        )}
        {headStyle === 3 && (
          // Angular droid
          <rect x="24" y="28" width="52" height="44" rx="4" fill={`url(#head-grad-${index})`} />
        )}
      </g>

      {/* 4. Facial Panel / Visor Screen */}
      <g stroke="#000" strokeWidth="2" fill="#101115" strokeLinejoin="round">
        <rect x="28" y="34" width="44" height="24" rx="6" />
      </g>

      {/* Visor Grid Detail */}
      <g stroke={`hsl(${secondaryHue}, 50%, 15%)`} strokeWidth="0.5">
        <line x1="30" y1="40" x2="70" y2="40" />
        <line x1="30" y1="46" x2="70" y2="46" />
        <line x1="30" y1="52" x2="70" y2="52" />
      </g>

      {/* 5. Glowing Eyes / Optical Elements */}
      <g fill={`hsl(${accentHue}, 95%, 70%)`}>
        {eyeStyle === 0 && (
          <>
            {/* Retro visor line */}
            <rect x="32" y="39" width="36" height="5" rx="2.5" />
            <rect x="42" y="40" width="16" height="3" fill="#ffffff" rx="1.5" />
          </>
        )}

        {eyeStyle === 1 && (
          <>
            {/* Twin Laser Eyes */}
            <circle cx="41" cy="42" r="5" stroke="#000" strokeWidth="1.5" />
            <circle cx="59" cy="42" r="5" stroke="#000" strokeWidth="1.5" />
            <circle cx="41" cy="42" r="2" fill="#ffffff" />
            <circle cx="59" cy="42" r="2" fill="#ffffff" />
          </>
        )}

        {eyeStyle === 2 && (
          <>
            {/* Target Reticle / Cyclops */}
            <circle cx="50" cy="41" r="7.5" stroke="#000" strokeWidth="1.5" />
            <circle cx="50" cy="41" r="3" fill="#ffffff" />
            <line x1="34" y1="41" x2="66" y2="41" stroke={`hsl(${accentHue}, 95%, 70%)`} strokeWidth="1.5" />
          </>
        )}

        {eyeStyle === 3 && (
          <>
            {/* Square Digital matrix eyes */}
            <rect x="37" y="39" width="6" height="6" rx="1" />
            <rect x="57" y="39" width="6" height="6" rx="1" />
          </>
        )}
      </g>

      {/* 6. Mouth / Vocal Indicator */}
      <g stroke={`hsl(${accentHue}, 95%, 70%)`} strokeWidth="2.5" strokeLinecap="round" fill="none">
        {mouthStyle === 0 && (
          // Digital Waveform
          <path d="M 40 51 L 45 49 L 50 53 L 55 49 L 60 51" />
        )}
        {mouthStyle === 1 && (
          // Simple smile
          <path d="M 44 50 A 6 6 0 0 0 56 50" />
        )}
        {mouthStyle === 2 && (
          // Laser beam mouth
          <line x1="42" y1="51" x2="58" y2="51" strokeWidth="3" />
        )}
        {mouthStyle === 3 && (
          // Tech slot grin
          <path d="M 42 50 C 45 53, 55 53, 58 50" />
        )}
      </g>

      {/* Cyber cheek markings */}
      <g fill={`hsl(${secondaryHue}, 95%, 70%)`} opacity="0.5">
        <circle cx="33" cy="51" r="1.5" />
        <circle cx="67" cy="51" r="1.5" />
      </g>

      {/* Gloss / Light reflection overlay */}
      <rect width="100" height="100" fill="url(#gloss)" style={{ pointerEvents: "none" }} />
    </svg>
  );
}

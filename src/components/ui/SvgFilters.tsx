import React from 'react';

export const SvgFilters: React.FC = () => {
  return (
    <defs>
      {/* Hand-drawn / jittery effect filter */}
      <filter id="ink-stroke" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence
          type="turbulence"
          baseFrequency="0.03"
          numOctaves="3"
          result="turbulence"
          seed="2"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="turbulence"
          scale="2"
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>

      {/* Glow effect */}
      <filter id="glow">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* Drop shadow for connections */}
      <filter id="connection-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.15" />
      </filter>

      {/* Paper texture */}
      <filter id="paper-texture">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.04"
          numOctaves="5"
          stitchTiles="stitch"
          result="noise"
        />
        <feColorMatrix
          type="saturate"
          values="0"
          in="noise"
          result="monoNoise"
        />
        <feBlend in="SourceGraphic" in2="monoNoise" mode="multiply" />
      </filter>
    </defs>
  );
};

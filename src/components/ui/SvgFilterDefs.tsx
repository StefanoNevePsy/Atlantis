import React from 'react';

export const SvgFilterDefs: React.FC = () => {
  return (
    <svg
      style={{
        position: 'absolute',
        width: 0,
        height: 0,
        overflow: 'hidden',
      }}
    >
      <defs>
        {/* Hand-drawn border effect */}
        <filter id="ink-stroke">
          <feTurbulence
            type="turbulence"
            baseFrequency="0.02"
            numOctaves="4"
            result="turbulence"
            seed="3"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="turbulence"
            scale="1.5"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        {/* Glow effect for cyberpunk */}
        <filter id="neon-glow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Rough/paper texture */}
        <filter id="rough-paper" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.04"
            numOctaves="5"
            stitchTiles="stitch"
            result="noise"
          />
          <feDiffuseLighting
            in="noise"
            lightingColor="white"
            surfaceScale="1.5"
            result="diffLight"
          >
            <feDistantLight azimuth="45" elevation="55" />
          </feDiffuseLighting>
          <feComposite
            in="SourceGraphic"
            in2="diffLight"
            operator="arithmetic"
            k1="1"
            k2="0"
            k3="0"
            k4="0"
          />
        </filter>
      </defs>
    </svg>
  );
};

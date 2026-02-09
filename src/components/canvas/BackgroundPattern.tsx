import React from 'react';
import { useThemeStore } from '../../store/themeStore';
import type { Point } from '../../types';

interface Props {
  pattern: 'dots' | 'grid' | 'noise' | 'none';
  offset: Point;
  zoom: number;
}

export const BackgroundPattern: React.FC<Props> = ({ pattern, offset, zoom }) => {
  const { currentTheme } = useThemeStore();

  if (pattern === 'none') return null;

  const dotColor = currentTheme.colors.border + '20';
  const gridColor = currentTheme.colors.border + '15';
  const gap = 30;

  if (pattern === 'dots') {
    return (
      <svg
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      >
        <defs>
          <pattern
            id="bg-dots"
            x={offset.x % (gap * zoom)}
            y={offset.y % (gap * zoom)}
            width={gap * zoom}
            height={gap * zoom}
            patternUnits="userSpaceOnUse"
          >
            <circle
              cx={gap * zoom * 0.5}
              cy={gap * zoom * 0.5}
              r={Math.max(1, 1.5 * zoom)}
              fill={dotColor}
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#bg-dots)" />
      </svg>
    );
  }

  if (pattern === 'grid') {
    return (
      <svg
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      >
        <defs>
          <pattern
            id="bg-grid"
            x={offset.x % (gap * zoom)}
            y={offset.y % (gap * zoom)}
            width={gap * zoom}
            height={gap * zoom}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${gap * zoom} 0 L 0 0 0 ${gap * zoom}`}
              fill="none"
              stroke={gridColor}
              strokeWidth={Math.max(0.5, zoom * 0.5)}
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#bg-grid)" />
      </svg>
    );
  }

  if (pattern === 'noise') {
    return (
      <svg
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          opacity: 0.06,
        }}
      >
        <defs>
          <filter id="noise-filter">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.9"
              numOctaves="4"
              stitchTiles="stitch"
            />
          </filter>
        </defs>
        <rect width="100%" height="100%" filter="url(#noise-filter)" />
      </svg>
    );
  }

  return null;
};

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
    // Use a CSS-based grain texture that works reliably across browsers
    const isDark = currentTheme.variant === 'dark';
    const noiseOpacity = isDark ? 0.12 : 0.08;
    const dotSpacing = 4;
    const dotSize = 1;
    const noiseColor = isDark
      ? 'rgba(255,255,255,' + noiseOpacity + ')'
      : 'rgba(0,0,0,' + noiseOpacity + ')';

    return (
      <>
        {/* Primary grain layer - fine dots */}
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
              id="bg-noise-fine"
              x={(offset.x * 0.3) % (dotSpacing * 2 * zoom)}
              y={(offset.y * 0.3) % (dotSpacing * 2 * zoom)}
              width={dotSpacing * 2 * zoom}
              height={dotSpacing * 2 * zoom}
              patternUnits="userSpaceOnUse"
            >
              <circle cx={dotSpacing * 0.5 * zoom} cy={dotSpacing * 0.3 * zoom} r={dotSize * zoom * 0.4} fill={noiseColor} />
              <circle cx={dotSpacing * 1.7 * zoom} cy={dotSpacing * 1.1 * zoom} r={dotSize * zoom * 0.3} fill={noiseColor} />
              <circle cx={dotSpacing * 0.2 * zoom} cy={dotSpacing * 1.6 * zoom} r={dotSize * zoom * 0.5} fill={noiseColor} />
              <circle cx={dotSpacing * 1.3 * zoom} cy={dotSpacing * 0.7 * zoom} r={dotSize * zoom * 0.35} fill={noiseColor} />
            </pattern>
            <pattern
              id="bg-noise-coarse"
              x={(offset.x * 0.15) % (dotSpacing * 6 * zoom)}
              y={(offset.y * 0.15) % (dotSpacing * 6 * zoom)}
              width={dotSpacing * 6 * zoom}
              height={dotSpacing * 6 * zoom}
              patternUnits="userSpaceOnUse"
            >
              <circle cx={dotSpacing * 1.2 * zoom} cy={dotSpacing * 2.8 * zoom} r={dotSize * zoom * 0.6} fill={noiseColor} />
              <circle cx={dotSpacing * 4.5 * zoom} cy={dotSpacing * 0.8 * zoom} r={dotSize * zoom * 0.45} fill={noiseColor} />
              <circle cx={dotSpacing * 3.0 * zoom} cy={dotSpacing * 4.5 * zoom} r={dotSize * zoom * 0.55} fill={noiseColor} />
              <circle cx={dotSpacing * 5.2 * zoom} cy={dotSpacing * 3.2 * zoom} r={dotSize * zoom * 0.4} fill={noiseColor} />
              <circle cx={dotSpacing * 0.8 * zoom} cy={dotSpacing * 5.0 * zoom} r={dotSize * zoom * 0.5} fill={noiseColor} />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#bg-noise-fine)" />
          <rect width="100%" height="100%" fill="url(#bg-noise-coarse)" />
        </svg>
      </>
    );
  }

  return null;
};

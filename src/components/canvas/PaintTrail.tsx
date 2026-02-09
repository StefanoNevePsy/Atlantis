import React from 'react';
import type { Point } from '../../types';
import { useThemeStore } from '../../store/themeStore';

interface Props {
  points: Point[];
  offset: Point;
  zoom: number;
}

export const PaintTrail: React.FC<Props> = ({ points, offset, zoom }) => {
  const { currentTheme } = useThemeStore();

  if (points.length < 2) return null;

  const pathData = points
    .map((p, i) => {
      const sx = p.x * zoom + offset.x;
      const sy = p.y * zoom + offset.y;
      return i === 0 ? `M ${sx} ${sy}` : `L ${sx} ${sy}`;
    })
    .join(' ');

  return (
    <svg
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    >
      <path
        d={pathData}
        fill="none"
        stroke={currentTheme.colors.selectionStroke}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="8 4"
        opacity={0.7}
      />
      {/* Dot at end */}
      {points.length > 0 && (
        <circle
          cx={points[points.length - 1].x * zoom + offset.x}
          cy={points[points.length - 1].y * zoom + offset.y}
          r={6}
          fill={currentTheme.colors.selectionStroke}
          opacity={0.5}
        />
      )}
    </svg>
  );
};

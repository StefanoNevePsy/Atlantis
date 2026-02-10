import React from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { useThemeStore } from '../../store/themeStore';

export const DrawLayer: React.FC = () => {
  const { drawStrokes } = useCanvasStore();
  const { currentTheme } = useThemeStore();

  if (drawStrokes.length === 0) return null;

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        overflow: 'visible',
      }}
    >
      {drawStrokes.map((stroke) => {
        if (stroke.points.length < 2) return null;

        // Build smooth path through points
        let d = `M ${stroke.points[0].x} ${stroke.points[0].y}`;
        for (let i = 1; i < stroke.points.length - 1; i++) {
          const curr = stroke.points[i];
          const next = stroke.points[i + 1];
          const mx = (curr.x + next.x) / 2;
          const my = (curr.y + next.y) / 2;
          d += ` Q ${curr.x} ${curr.y} ${mx} ${my}`;
        }
        const last = stroke.points[stroke.points.length - 1];
        d += ` L ${last.x} ${last.y}`;

        return (
          <path
            key={stroke.id}
            d={d}
            stroke={stroke.color || currentTheme.colors.text}
            strokeWidth={stroke.width || 2}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity={stroke.opacity ?? 1}
          />
        );
      })}
    </svg>
  );
};

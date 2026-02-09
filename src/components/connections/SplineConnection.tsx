import React, { useState } from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { useThemeStore } from '../../store/themeStore';
import { computeSplineControlPoints } from '../../utils/geometry';
import type { ConnectionData, CardData } from '../../types';

interface Props {
  connection: ConnectionData;
  source: CardData;
  target: CardData;
  offsetX: number;
  offsetY: number;
}

export const SplineConnection: React.FC<Props> = ({
  connection,
  source,
  target,
  offsetX,
  offsetY,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const { updateConnection, removeConnection } = useCanvasStore();
  const { currentTheme } = useThemeStore();

  const sx = source.position.x + source.size.width / 2 + offsetX;
  const sy = source.position.y + source.size.height / 2 + offsetY;
  const tx = target.position.x + target.size.width / 2 + offsetX;
  const ty = target.position.y + target.size.height / 2 + offsetY;

  const { cp1, cp2 } = computeSplineControlPoints(source, target);
  const cp1x = cp1.x + offsetX;
  const cp1y = cp1.y + offsetY;
  const cp2x = cp2.x + offsetX;
  const cp2y = cp2.y + offsetY;

  const path = `M ${sx} ${sy} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${tx} ${ty}`;
  const midX = (sx + tx) / 2;
  const midY = (sy + ty) / 2;

  const lineColor = connection.color || currentTheme.colors.connectionLine;

  // Arrow head
  const angle = Math.atan2(ty - cp2y, tx - cp2x);
  const arrowSize = 10;

  return (
    <g>
      {/* Hit area (wider invisible path for easier interaction) */}
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={(e) => {
          e.stopPropagation();
          if (e.detail === 2) {
            setIsEditingLabel(true);
          }
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          removeConnection(connection.id);
        }}
      />

      {/* Visible path */}
      <path
        d={path}
        fill="none"
        stroke={isHovered ? currentTheme.colors.selectionStroke : lineColor}
        strokeWidth={isHovered ? 3 : 2}
        strokeLinecap="round"
        style={{ transition: 'stroke 0.2s, stroke-width 0.2s' }}
      />

      {/* Arrow heads */}
      {(connection.direction === 'forward' || connection.direction === 'bidirectional') && (
        <path
          d={`M ${tx} ${ty} L ${tx + Math.cos(angle + Math.PI * 0.8) * arrowSize} ${ty + Math.sin(angle + Math.PI * 0.8) * arrowSize} M ${tx} ${ty} L ${tx + Math.cos(angle - Math.PI * 0.8) * arrowSize} ${ty + Math.sin(angle - Math.PI * 0.8) * arrowSize}`}
          fill="none"
          stroke={isHovered ? currentTheme.colors.selectionStroke : lineColor}
          strokeWidth={2}
          strokeLinecap="round"
        />
      )}

      {(connection.direction === 'backward' || connection.direction === 'bidirectional') && (() => {
        const reverseAngle = Math.atan2(sy - cp1y, sx - cp1x);
        return (
          <path
            d={`M ${sx} ${sy} L ${sx + Math.cos(reverseAngle + Math.PI * 0.8) * arrowSize} ${sy + Math.sin(reverseAngle + Math.PI * 0.8) * arrowSize} M ${sx} ${sy} L ${sx + Math.cos(reverseAngle - Math.PI * 0.8) * arrowSize} ${sy + Math.sin(reverseAngle - Math.PI * 0.8) * arrowSize}`}
            fill="none"
            stroke={isHovered ? currentTheme.colors.selectionStroke : lineColor}
            strokeWidth={2}
            strokeLinecap="round"
          />
        );
      })()}

      {/* Label */}
      {(connection.label || isEditingLabel) && (
        <foreignObject
          x={midX - 60}
          y={midY - 14}
          width={120}
          height={28}
          style={{ pointerEvents: 'all' }}
        >
          {isEditingLabel ? (
            <input
              autoFocus
              value={connection.label}
              onChange={(e) =>
                updateConnection(connection.id, { label: e.target.value })
              }
              onBlur={() => setIsEditingLabel(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingLabel(false)}
              style={{
                width: '100%',
                textAlign: 'center',
                border: `1px solid ${currentTheme.colors.border}`,
                borderRadius: currentTheme.decorations.borderRadius,
                background: currentTheme.colors.surface,
                color: currentTheme.colors.text,
                fontSize: currentTheme.typography.fontSize.xs,
                fontFamily: currentTheme.typography.fontFamilyMono,
                padding: '2px 4px',
                outline: 'none',
              }}
            />
          ) : (
            <div
              style={{
                textAlign: 'center',
                background: currentTheme.colors.surface + 'dd',
                padding: '2px 8px',
                borderRadius: currentTheme.decorations.borderRadius,
                fontSize: currentTheme.typography.fontSize.xs,
                fontFamily: currentTheme.typography.fontFamilyMono,
                color: currentTheme.colors.textMuted,
                cursor: 'pointer',
              }}
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingLabel(true);
              }}
            >
              {connection.label}
            </div>
          )}
        </foreignObject>
      )}

      {/* Hover hint */}
      {isHovered && !connection.label && (
        <foreignObject
          x={midX - 40}
          y={midY - 10}
          width={80}
          height={20}
          style={{ pointerEvents: 'none' }}
        >
          <div
            style={{
              textAlign: 'center',
              fontSize: '10px',
              color: currentTheme.colors.textMuted,
              fontFamily: currentTheme.typography.fontFamilyMono,
            }}
          >
            dbl-click: label
          </div>
        </foreignObject>
      )}
    </g>
  );
};

import React, { useState } from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { useThemeStore } from '../../store/themeStore';
import { computeEdgeSplineControlPoints, getRectEdgePoint } from '../../utils/geometry';
import type { ConnectionData, CardData, LineStyle, CurveStyle } from '../../types';

interface Props {
  connection: ConnectionData;
  source: CardData;
  target: CardData;
  offsetX: number;
  offsetY: number;
  isSelected?: boolean;
}

function getStrokeDasharray(lineStyle?: LineStyle): string | undefined {
  switch (lineStyle) {
    case 'dashed': return '12 6';
    case 'dotted': return '3 6';
    default: return undefined;
  }
}

export const SplineConnection: React.FC<Props> = ({
  connection,
  source,
  target,
  offsetX,
  offsetY,
  isSelected = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const { updateConnection, removeConnection, selectConnection } = useCanvasStore();
  const { currentTheme } = useThemeStore();

  // Get center points
  const srcCenter = {
    x: source.position.x + source.size.width / 2,
    y: source.position.y + source.size.height / 2,
  };
  const tgtCenter = {
    x: target.position.x + target.size.width / 2,
    y: target.position.y + target.size.height / 2,
  };

  // Get edge points
  const srcEdge = getRectEdgePoint(source, tgtCenter);
  const tgtEdge = getRectEdgePoint(target, srcCenter);

  // Apply SVG offset
  const sx = srcEdge.x + offsetX;
  const sy = srcEdge.y + offsetY;
  const tx = tgtEdge.x + offsetX;
  const ty = tgtEdge.y + offsetY;

  // Determine curve style - default to curved
  const curveStyle: CurveStyle = connection.curveStyle || 'curved';

  let path: string;
  let cp1x = sx, cp1y = sy, cp2x = tx, cp2y = ty;

  if (curveStyle === 'straight') {
    path = `M ${sx} ${sy} L ${tx} ${ty}`;
  } else {
    const { cp1, cp2 } = computeEdgeSplineControlPoints(
      srcEdge, srcCenter, tgtEdge, tgtCenter
    );
    cp1x = cp1.x + offsetX;
    cp1y = cp1.y + offsetY;
    cp2x = cp2.x + offsetX;
    cp2y = cp2.y + offsetY;
    path = `M ${sx} ${sy} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${tx} ${ty}`;
  }

  const midX = (sx + tx) / 2;
  const midY = (sy + ty) / 2;

  const lineColor = connection.color || currentTheme.colors.connectionLine;
  const dashArray = getStrokeDasharray(connection.lineStyle);

  // Arrow head angle
  const angle = curveStyle === 'straight'
    ? Math.atan2(ty - sy, tx - sx)
    : Math.atan2(ty - cp2y, tx - cp2x);
  const reverseAngle = curveStyle === 'straight'
    ? Math.atan2(sy - ty, sx - tx)
    : Math.atan2(sy - cp1y, sx - cp1x);
  const arrowSize = 10;

  const activeColor = isSelected
    ? currentTheme.colors.primary
    : isHovered
    ? currentTheme.colors.selectionStroke
    : lineColor;

  // Unique animation ID per connection
  const animId = `flow-${connection.id}`;

  return (
    <g>
      {/* CSS animation for flowing dashes */}
      <defs>
        <style>{`
          @keyframes ${animId} {
            to { stroke-dashoffset: -24; }
          }
        `}</style>
      </defs>

      {/* Hit area */}
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
          if (e.detail === 2) setIsEditingLabel(true);
          else selectConnection(connection.id, e.shiftKey || e.ctrlKey);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          removeConnection(connection.id);
        }}
      />

      {/* Selection highlight */}
      {isSelected && (
        <path
          d={path}
          fill="none"
          stroke={currentTheme.colors.primary + '30'}
          strokeWidth={10}
          strokeLinecap="round"
        />
      )}

      {/* Visible path with flow animation on dashed/dotted */}
      <path
        d={path}
        fill="none"
        stroke={activeColor}
        strokeWidth={isSelected ? 3 : isHovered ? 2.5 : 2}
        strokeLinecap="round"
        strokeDasharray={dashArray}
        style={{
          transition: 'stroke 0.3s ease, stroke-width 0.2s ease',
          animation: dashArray ? `${animId} 0.6s linear infinite` : undefined,
        }}
      />

      {/* Arrow heads */}
      {(connection.direction === 'forward' || connection.direction === 'bidirectional') && (
        <path
          d={`M ${tx} ${ty} L ${tx + Math.cos(angle + Math.PI * 0.8) * arrowSize} ${ty + Math.sin(angle + Math.PI * 0.8) * arrowSize} M ${tx} ${ty} L ${tx + Math.cos(angle - Math.PI * 0.8) * arrowSize} ${ty + Math.sin(angle - Math.PI * 0.8) * arrowSize}`}
          fill="none"
          stroke={activeColor}
          strokeWidth={2}
          strokeLinecap="round"
          style={{ transition: 'stroke 0.3s ease' }}
        />
      )}

      {(connection.direction === 'backward' || connection.direction === 'bidirectional') && (
        <path
          d={`M ${sx} ${sy} L ${sx + Math.cos(reverseAngle + Math.PI * 0.8) * arrowSize} ${sy + Math.sin(reverseAngle + Math.PI * 0.8) * arrowSize} M ${sx} ${sy} L ${sx + Math.cos(reverseAngle - Math.PI * 0.8) * arrowSize} ${sy + Math.sin(reverseAngle - Math.PI * 0.8) * arrowSize}`}
          fill="none"
          stroke={activeColor}
          strokeWidth={2}
          strokeLinecap="round"
          style={{ transition: 'stroke 0.3s ease' }}
        />
      )}

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
              onChange={(e) => updateConnection(connection.id, { label: e.target.value })}
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
              onClick={(e) => { e.stopPropagation(); setIsEditingLabel(true); }}
            >
              {connection.label}
            </div>
          )}
        </foreignObject>
      )}

      {/* Hover hint */}
      {isHovered && !connection.label && !isSelected && (
        <foreignObject x={midX - 40} y={midY - 10} width={80} height={20} style={{ pointerEvents: 'none' }}>
          <div style={{ textAlign: 'center', fontSize: '10px', color: currentTheme.colors.textMuted, fontFamily: currentTheme.typography.fontFamilyMono }}>
            dbl-click: label
          </div>
        </foreignObject>
      )}
    </g>
  );
};

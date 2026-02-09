import React, { useEffect } from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { useThemeStore } from '../../store/themeStore';
import { computeLayout, computeBoundaryRect } from '../../utils/layout';

export const StructureOverlay: React.FC = () => {
  const { structures, cards, moveCard } = useCanvasStore();
  const { currentTheme } = useThemeStore();

  // Build a stable dependency key from structures and their cards
  const layoutKey = Object.values(structures)
    .map((s) => {
      const root = cards[s.rootId];
      const rootPos = root ? `${Math.round(root.position.x)},${Math.round(root.position.y)}` : '0,0';
      const nodeStates = s.nodeIds
        .map((nid) => {
          const c = cards[nid];
          return c ? `${nid}:${c.collapsed}:${c.childrenIds.length}:${c.size.width}x${c.size.height}` : nid;
        })
        .join('|');
      return `${s.id}:${s.type}:${s.layoutDirection}:${rootPos}:${nodeStates}`;
    })
    .join(';;');

  // Apply auto-layout when structures change
  useEffect(() => {
    Object.values(structures).forEach((structure) => {
      const positions = computeLayout(structure, cards);
      positions.forEach((pos, nodeId) => {
        const card = cards[nodeId];
        if (!card || card.structureId !== structure.id) return;
        // Don't move root card (user drags it to position the whole structure)
        if (nodeId === structure.rootId) return;
        if (Math.abs(card.position.x - pos.x) > 1 || Math.abs(card.position.y - pos.y) > 1) {
          moveCard(nodeId, pos);
        }
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutKey]);

  return (
    <>
      {Object.values(structures).map((structure) => {
        // Render boundaries
        return structure.boundaries.map((boundary) => {
          const rect = computeBoundaryRect(boundary.nodeIds, cards);
          if (!rect) return null;
          return (
            <div
              key={boundary.id}
              style={{
                position: 'absolute',
                left: rect.x,
                top: rect.y,
                width: rect.width,
                height: rect.height,
                border: `2px dashed ${boundary.color || currentTheme.colors.primary}40`,
                borderRadius: currentTheme.decorations.borderRadiusLg,
                background: `${boundary.color || currentTheme.colors.primary}08`,
                pointerEvents: 'none',
                zIndex: -1,
              }}
            >
              {boundary.label && (
                <div
                  style={{
                    position: 'absolute',
                    top: -10,
                    left: 12,
                    background: currentTheme.colors.surface,
                    padding: '0 6px',
                    fontSize: currentTheme.typography.fontSize.xs,
                    color: boundary.color || currentTheme.colors.primary,
                    fontFamily: currentTheme.typography.fontFamilyMono,
                  }}
                >
                  {boundary.label}
                </div>
              )}
            </div>
          );
        });
      })}

      {/* Summary brackets */}
      {Object.values(structures).map((structure) =>
        structure.summaries.map((summary) => {
          const rect = computeBoundaryRect(summary.sourceNodeIds, cards);
          if (!rect) return null;
          const summaryCard = cards[summary.summaryNodeId];
          if (!summaryCard) return null;

          return (
            <svg
              key={summary.id}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                overflow: 'visible',
              }}
            >
              {/* Bracket */}
              <path
                d={`M ${rect.x + rect.width + 10} ${rect.y} Q ${rect.x + rect.width + 30} ${rect.y + rect.height / 2}, ${rect.x + rect.width + 10} ${rect.y + rect.height}`}
                fill="none"
                stroke={currentTheme.colors.connectionLine}
                strokeWidth={2}
                strokeLinecap="round"
              />
              {/* Connector to summary */}
              <line
                x1={rect.x + rect.width + 30}
                y1={rect.y + rect.height / 2}
                x2={summaryCard.position.x}
                y2={summaryCard.position.y + summaryCard.size.height / 2}
                stroke={currentTheme.colors.connectionLine}
                strokeWidth={1.5}
                strokeDasharray="4 2"
              />
            </svg>
          );
        })
      )}
    </>
  );
};

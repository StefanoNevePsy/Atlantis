import React from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { SplineConnection } from './SplineConnection';
import { ElbowConnection } from './ElbowConnection';
import { SvgFilters } from '../ui/SvgFilters';
import type { CardData } from '../../types';

// Create a virtual "CardData" from a group so connections can render to/from groups
function groupAsCard(group: { position: { x: number; y: number }; size: { width: number; height: number } }): CardData {
  return {
    id: '',
    position: group.position,
    size: group.size,
    content: '',
    contentType: 'text',
    metadata: { createdAt: 0, updatedAt: 0, tags: [] },
    zIndex: 0,
    childrenIds: [],
    collapsed: false,
    isRoot: false,
  };
}

export const ConnectionLayer: React.FC = () => {
  const { connections, cards, groups, selectedConnectionIds } = useCanvasStore();

  // Compute bounding box for SVG
  const minX = -10000, minY = -10000;
  const svgW = 20000;
  const svgH = 20000;

  return (
    <svg
      style={{
        position: 'absolute',
        left: minX,
        top: minY,
        width: svgW,
        height: svgH,
        pointerEvents: 'none',
        overflow: 'visible',
        zIndex: 0,
      }}
    >
      <SvgFilters />
      {Object.values(connections).map((conn) => {
        // Resolve source: can be a card or a group
        let source: CardData | null = null;
        if (conn.sourceType === 'group') {
          const g = groups[conn.sourceId];
          if (g) source = groupAsCard(g);
        } else {
          source = cards[conn.sourceId] || null;
        }

        // Resolve target: can be a card or a group
        let target: CardData | null = null;
        if (conn.targetType === 'group') {
          const g = groups[conn.targetId];
          if (g) target = groupAsCard(g);
        } else {
          target = cards[conn.targetId] || null;
        }

        if (!source || !target) return null;

        // Check if target card is hidden (parent is collapsed in tree)
        if (conn.targetType === 'card') {
          const targetCard = cards[conn.targetId];
          if (targetCard?.parentId) {
            const parent = cards[targetCard.parentId];
            if (parent?.collapsed) return null;
          }
          // Hide if in collapsed group
          if (targetCard?.groupId) {
            const g = groups[targetCard.groupId];
            if (g?.collapsed) return null;
          }
        }

        const isSelected = selectedConnectionIds.has(conn.id);

        // Determine connection style
        const isStructural = conn.styleOverride === 'elbow';

        if (isStructural) {
          const srcCard = cards[conn.sourceId];
          const structure = srcCard?.structureId
            ? Object.values(useCanvasStore.getState().structures).find(
                (s) => s.id === srcCard.structureId
              )
            : null;
          const direction =
            structure?.type === 'org-chart' ? 'vertical' : 'horizontal';
          return (
            <ElbowConnection
              key={conn.id}
              connection={conn}
              source={source}
              target={target}
              direction={direction}
              offsetX={-minX}
              offsetY={-minY}
            />
          );
        }

        return (
          <SplineConnection
            key={conn.id}
            connection={conn}
            source={source}
            target={target}
            offsetX={-minX}
            offsetY={-minY}
            isSelected={isSelected}
          />
        );
      })}
    </svg>
  );
};

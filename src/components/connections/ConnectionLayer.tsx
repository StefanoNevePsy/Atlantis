import React from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { SplineConnection } from './SplineConnection';
import { ElbowConnection } from './ElbowConnection';
import { SvgFilters } from '../ui/SvgFilters';

export const ConnectionLayer: React.FC = () => {
  const { connections, cards } = useCanvasStore();

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
        const source = cards[conn.sourceId];
        const target = cards[conn.targetId];
        if (!source || !target) return null;

        // Check if target is hidden (parent is collapsed)
        if (target.parentId) {
          const parent = cards[target.parentId];
          if (parent?.collapsed) return null;
        }

        // Determine connection style
        const isStructural = conn.styleOverride === 'elbow';

        if (isStructural) {
          // Determine direction based on structure
          const structure = source.structureId
            ? Object.values(useCanvasStore.getState().structures).find(
                (s) => s.id === source.structureId
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
          />
        );
      })}
    </svg>
  );
};

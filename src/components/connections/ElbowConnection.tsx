import React from 'react';
import { useThemeStore } from '../../store/themeStore';
import { computeElbowPath } from '../../utils/geometry';
import type { ConnectionData, CardData } from '../../types';

interface Props {
  connection: ConnectionData;
  source: CardData;
  target: CardData;
  direction: 'horizontal' | 'vertical';
  offsetX: number;
  offsetY: number;
}

export const ElbowConnection: React.FC<Props> = ({
  connection,
  source,
  target,
  direction,
  offsetX,
  offsetY,
}) => {
  const { currentTheme } = useThemeStore();

  // Create offset-adjusted card copies for path calculation
  const offsetSource = {
    ...source,
    position: {
      x: source.position.x + offsetX,
      y: source.position.y + offsetY,
    },
  };
  const offsetTarget = {
    ...target,
    position: {
      x: target.position.x + offsetX,
      y: target.position.y + offsetY,
    },
  };

  const path = computeElbowPath(offsetSource, offsetTarget, direction);
  const lineColor = connection.color || currentTheme.colors.connectionLine;

  // Arrow at target
  let arrowPath = '';
  if (connection.direction === 'forward' || connection.direction === 'bidirectional') {
    const tx =
      direction === 'horizontal'
        ? offsetTarget.position.x
        : offsetTarget.position.x + target.size.width / 2;
    const ty =
      direction === 'horizontal'
        ? offsetTarget.position.y + target.size.height / 2
        : offsetTarget.position.y;
    const size = 8;
    if (direction === 'horizontal') {
      arrowPath = `M ${tx} ${ty} L ${tx - size} ${ty - size / 2} M ${tx} ${ty} L ${tx - size} ${ty + size / 2}`;
    } else {
      arrowPath = `M ${tx} ${ty} L ${tx - size / 2} ${ty - size} M ${tx} ${ty} L ${tx + size / 2} ${ty - size}`;
    }
  }

  return (
    <g>
      <path
        d={path}
        fill="none"
        stroke={lineColor}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {arrowPath && (
        <path
          d={arrowPath}
          fill="none"
          stroke={lineColor}
          strokeWidth={2}
          strokeLinecap="round"
        />
      )}
    </g>
  );
};

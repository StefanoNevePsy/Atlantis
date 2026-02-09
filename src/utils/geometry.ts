import type { Point, CardData } from '../types';

// Convert screen coordinates to canvas coordinates
export function screenToCanvas(
  screenX: number,
  screenY: number,
  offset: Point,
  zoom: number
): Point {
  return {
    x: (screenX - offset.x) / zoom,
    y: (screenY - offset.y) / zoom,
  };
}

// Convert canvas coordinates to screen coordinates
export function canvasToScreen(
  canvasX: number,
  canvasY: number,
  offset: Point,
  zoom: number
): Point {
  return {
    x: canvasX * zoom + offset.x,
    y: canvasY * zoom + offset.y,
  };
}

// Compute Bézier control points for a spline between two edge points
// Control points extend outward from each rectangle face for smooth curves
export function computeEdgeSplineControlPoints(
  srcEdge: Point,
  srcCenter: Point,
  tgtEdge: Point,
  tgtCenter: Point
): { cp1: Point; cp2: Point } {
  // Direction from center to edge = outward normal
  const srcDx = srcEdge.x - srcCenter.x;
  const srcDy = srcEdge.y - srcCenter.y;
  const srcDist = Math.sqrt(srcDx * srcDx + srcDy * srcDy) || 1;

  const tgtDx = tgtEdge.x - tgtCenter.x;
  const tgtDy = tgtEdge.y - tgtCenter.y;
  const tgtDist = Math.sqrt(tgtDx * tgtDx + tgtDy * tgtDy) || 1;

  // Tension proportional to distance between edge points
  const edgeDx = tgtEdge.x - srcEdge.x;
  const edgeDy = tgtEdge.y - srcEdge.y;
  const edgeDist = Math.sqrt(edgeDx * edgeDx + edgeDy * edgeDy);
  const tension = Math.min(edgeDist * 0.35, 180);

  return {
    cp1: {
      x: srcEdge.x + (srcDx / srcDist) * tension,
      y: srcEdge.y + (srcDy / srcDist) * tension,
    },
    cp2: {
      x: tgtEdge.x + (tgtDx / tgtDist) * tension,
      y: tgtEdge.y + (tgtDy / tgtDist) * tension,
    },
  };
}

// Compute elbow path points for structured connections
export function computeElbowPath(
  source: CardData,
  target: CardData,
  direction: 'horizontal' | 'vertical' = 'horizontal'
): string {
  if (direction === 'horizontal') {
    // Determine which side the target is on
    const srcCenterX = source.position.x + source.size.width / 2;
    const tgtCenterX = target.position.x + target.size.width / 2;
    const goingRight = tgtCenterX >= srcCenterX;

    const sx = goingRight ? source.position.x + source.size.width : source.position.x;
    const sy = source.position.y + source.size.height / 2;
    const tx = goingRight ? target.position.x : target.position.x + target.size.width;
    const ty = target.position.y + target.size.height / 2;
    const midX = (sx + tx) / 2;
    return `M ${sx} ${sy} L ${midX} ${sy} L ${midX} ${ty} L ${tx} ${ty}`;
  } else {
    // Determine which side the target is on
    const srcCenterY = source.position.y + source.size.height / 2;
    const tgtCenterY = target.position.y + target.size.height / 2;
    const goingDown = tgtCenterY >= srcCenterY;

    const bsx = source.position.x + source.size.width / 2;
    const bsy = goingDown ? source.position.y + source.size.height : source.position.y;
    const btx = target.position.x + target.size.width / 2;
    const bty = goingDown ? target.position.y : target.position.y + target.size.height;
    const midY = (bsy + bty) / 2;
    return `M ${bsx} ${bsy} L ${bsx} ${midY} L ${btx} ${midY} L ${btx} ${bty}`;
  }
}

// Get connection anchor point on card edge
export function getCardEdgePoint(
  card: CardData,
  side: 'top' | 'bottom' | 'left' | 'right'
): Point {
  const { position, size } = card;
  switch (side) {
    case 'top':
      return { x: position.x + size.width / 2, y: position.y };
    case 'bottom':
      return { x: position.x + size.width / 2, y: position.y + size.height };
    case 'left':
      return { x: position.x, y: position.y + size.height / 2 };
    case 'right':
      return { x: position.x + size.width, y: position.y + size.height / 2 };
  }
}

// Arrow head path
export function arrowHeadPath(tip: Point, angle: number, size: number = 10): string {
  const a1 = angle + Math.PI * 0.8;
  const a2 = angle - Math.PI * 0.8;
  return `M ${tip.x} ${tip.y} L ${tip.x + Math.cos(a1) * size} ${tip.y + Math.sin(a1) * size} M ${tip.x} ${tip.y} L ${tip.x + Math.cos(a2) * size} ${tip.y + Math.sin(a2) * size}`;
}

// Get the point where a line from rect center to targetPoint exits the rect boundary
export function getRectEdgePoint(
  rect: { position: Point; size: { width: number; height: number } },
  targetPoint: Point
): Point {
  const cx = rect.position.x + rect.size.width / 2;
  const cy = rect.position.y + rect.size.height / 2;
  const hw = rect.size.width / 2;
  const hh = rect.size.height / 2;

  const dx = targetPoint.x - cx;
  const dy = targetPoint.y - cy;

  if (dx === 0 && dy === 0) return { x: cx + hw, y: cy };

  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  let t: number;
  if (absDx * hh > absDy * hw) {
    t = hw / absDx;
  } else {
    t = hh / absDy;
  }

  return { x: cx + dx * t, y: cy + dy * t };
}

// Distance from point to line segment
export function distToSegment(p: Point, v: Point, w: Point): number {
  const l2 = (w.x - v.x) ** 2 + (w.y - v.y) ** 2;
  if (l2 === 0) return Math.sqrt((p.x - v.x) ** 2 + (p.y - v.y) ** 2);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.sqrt(
    (p.x - (v.x + t * (w.x - v.x))) ** 2 +
    (p.y - (v.y + t * (w.y - v.y))) ** 2
  );
}

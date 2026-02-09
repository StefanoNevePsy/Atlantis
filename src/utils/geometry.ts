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

// Compute Bézier control points for a spline between two cards
export function computeSplineControlPoints(
  source: CardData,
  target: CardData
): { cp1: Point; cp2: Point } {
  const sx = source.position.x + source.size.width / 2;
  const sy = source.position.y + source.size.height / 2;
  const tx = target.position.x + target.size.width / 2;
  const ty = target.position.y + target.size.height / 2;

  const dx = tx - sx;
  const dy = ty - sy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const tension = Math.min(dist * 0.4, 150);

  return {
    cp1: { x: sx + tension, y: sy },
    cp2: { x: tx - tension, y: ty },
  };
}

// Compute elbow path points for structured connections
export function computeElbowPath(
  source: CardData,
  target: CardData,
  direction: 'horizontal' | 'vertical' = 'horizontal'
): string {
  const sx = source.position.x + source.size.width;
  const sy = source.position.y + source.size.height / 2;
  const tx = target.position.x;
  const ty = target.position.y + target.size.height / 2;

  if (direction === 'horizontal') {
    const midX = (sx + tx) / 2;
    return `M ${sx} ${sy} L ${midX} ${sy} L ${midX} ${ty} L ${tx} ${ty}`;
  } else {
    const bsx = source.position.x + source.size.width / 2;
    const bsy = source.position.y + source.size.height;
    const btx = target.position.x + target.size.width / 2;
    const bty = target.position.y;
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

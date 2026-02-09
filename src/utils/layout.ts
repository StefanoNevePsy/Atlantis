import type { CardData, StructureData, Point } from '../types';

const H_GAP = 60;
const V_GAP = 40;

interface LayoutNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  children: LayoutNode[];
  subtreeWidth: number;
  subtreeHeight: number;
}

function buildLayoutTree(
  rootId: string,
  cards: Record<string, CardData>
): LayoutNode | null {
  const card = cards[rootId];
  if (!card) return null;

  const children: LayoutNode[] = [];
  if (!card.collapsed) {
    for (const childId of card.childrenIds) {
      const childNode = buildLayoutTree(childId, cards);
      if (childNode) children.push(childNode);
    }
  }

  return {
    id: rootId,
    x: 0,
    y: 0,
    width: card.size.width,
    height: card.size.height,
    children,
    subtreeWidth: 0,
    subtreeHeight: 0,
  };
}

// ===== Mind Map (Radial) =====
function layoutMindMapRadial(
  node: LayoutNode,
  cx: number,
  cy: number,
  startAngle: number,
  endAngle: number,
  radius: number
): Map<string, Point> {
  const positions = new Map<string, Point>();
  positions.set(node.id, { x: cx - node.width / 2, y: cy - node.height / 2 });

  if (node.children.length === 0) return positions;

  const angleStep = (endAngle - startAngle) / node.children.length;
  node.children.forEach((child, i) => {
    const angle = startAngle + angleStep * i + angleStep / 2;
    const childX = cx + Math.cos(angle) * radius;
    const childY = cy + Math.sin(angle) * radius;

    const childPositions = layoutMindMapRadial(
      child, childX, childY,
      angle - angleStep / 2, angle + angleStep / 2,
      radius * 0.7
    );
    childPositions.forEach((pos, id) => positions.set(id, pos));
  });

  return positions;
}

// ===== Mind Map (Horizontal) =====
function measureSubtreeHorizontal(node: LayoutNode): number {
  if (node.children.length === 0) {
    node.subtreeHeight = node.height;
    return node.subtreeHeight;
  }
  let totalHeight = 0;
  node.children.forEach((child) => {
    totalHeight += measureSubtreeHorizontal(child);
  });
  totalHeight += (node.children.length - 1) * V_GAP;
  node.subtreeHeight = Math.max(node.height, totalHeight);
  return node.subtreeHeight;
}

function layoutMindMapHorizontal(
  node: LayoutNode,
  x: number,
  y: number
): Map<string, Point> {
  const positions = new Map<string, Point>();
  positions.set(node.id, { x, y: y + node.subtreeHeight / 2 - node.height / 2 });

  if (node.children.length === 0) return positions;

  let childY = y;
  const childX = x + node.width + H_GAP;
  node.children.forEach((child) => {
    const childPositions = layoutMindMapHorizontal(child, childX, childY);
    childPositions.forEach((pos, id) => positions.set(id, pos));
    childY += child.subtreeHeight + V_GAP;
  });

  return positions;
}

// ===== Org Chart (Top-Down) =====
function measureSubtreeVertical(node: LayoutNode): number {
  if (node.children.length === 0) {
    node.subtreeWidth = node.width;
    return node.subtreeWidth;
  }
  let totalWidth = 0;
  node.children.forEach((child) => {
    totalWidth += measureSubtreeVertical(child);
  });
  totalWidth += (node.children.length - 1) * H_GAP;
  node.subtreeWidth = Math.max(node.width, totalWidth);
  return node.subtreeWidth;
}

function layoutOrgChart(
  node: LayoutNode,
  x: number,
  y: number
): Map<string, Point> {
  const positions = new Map<string, Point>();
  positions.set(node.id, { x: x + node.subtreeWidth / 2 - node.width / 2, y });

  if (node.children.length === 0) return positions;

  let childX = x;
  const childY = y + node.height + V_GAP * 1.5;
  node.children.forEach((child) => {
    const childPositions = layoutOrgChart(child, childX, childY);
    childPositions.forEach((pos, id) => positions.set(id, pos));
    childX += child.subtreeWidth + H_GAP;
  });

  return positions;
}

// ===== Logic Chart (Left-to-Right, strict) =====
function layoutLogicChart(
  node: LayoutNode,
  x: number,
  y: number
): Map<string, Point> {
  // Same as horizontal mind map but with straight connectors
  return layoutMindMapHorizontal(node, x, y);
}

// ===== Fishbone =====
function layoutFishbone(
  node: LayoutNode,
  x: number,
  y: number
): Map<string, Point> {
  const positions = new Map<string, Point>();
  positions.set(node.id, { x, y });

  if (node.children.length === 0) return positions;

  const spineLength = node.children.length * 200;
  node.children.forEach((child, i) => {
    const cx = x + (i + 1) * (spineLength / (node.children.length + 1));
    const direction = i % 2 === 0 ? -1 : 1;
    const cy = y + direction * 120;

    positions.set(child.id, { x: cx, y: cy });

    // Layout grandchildren along the rib
    child.children.forEach((grandchild, j) => {
      const gx = cx + (j + 1) * 60 * direction * -0.3;
      const gy = cy + direction * (j + 1) * 60;
      positions.set(grandchild.id, { x: gx, y: gy });
    });
  });

  return positions;
}

// ===== Main layout function =====
export function computeLayout(
  structure: StructureData,
  cards: Record<string, CardData>
): Map<string, Point> {
  const tree = buildLayoutTree(structure.rootId, cards);
  if (!tree) return new Map();

  const root = cards[structure.rootId];
  const baseX = root?.position.x ?? 0;
  const baseY = root?.position.y ?? 0;

  switch (structure.type) {
    case 'mindmap': {
      if (structure.layoutDirection === 'radial') {
        return layoutMindMapRadial(tree, baseX + tree.width / 2, baseY + tree.height / 2, 0, Math.PI * 2, 250);
      }
      measureSubtreeHorizontal(tree);
      return layoutMindMapHorizontal(tree, baseX, baseY);
    }
    case 'org-chart': {
      measureSubtreeVertical(tree);
      return layoutOrgChart(tree, baseX, baseY);
    }
    case 'logic-chart': {
      measureSubtreeHorizontal(tree);
      return layoutLogicChart(tree, baseX, baseY);
    }
    case 'fishbone': {
      return layoutFishbone(tree, baseX, baseY);
    }
    default: {
      measureSubtreeHorizontal(tree);
      return layoutMindMapHorizontal(tree, baseX, baseY);
    }
  }
}

// Compute boundary bounding box
export function computeBoundaryRect(
  nodeIds: string[],
  cards: Record<string, CardData>
): { x: number; y: number; width: number; height: number } | null {
  const padding = 20;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  for (const id of nodeIds) {
    const card = cards[id];
    if (!card) continue;
    minX = Math.min(minX, card.position.x);
    minY = Math.min(minY, card.position.y);
    maxX = Math.max(maxX, card.position.x + card.size.width);
    maxY = Math.max(maxY, card.position.y + card.size.height);
  }

  if (minX === Infinity) return null;

  return {
    x: minX - padding,
    y: minY - padding,
    width: maxX - minX + padding * 2,
    height: maxY - minY + padding * 2,
  };
}

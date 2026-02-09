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
// Compute the "weight" of each subtree for proportional angle distribution
function countDescendants(node: LayoutNode): number {
  if (node.children.length === 0) return 1;
  let total = 0;
  for (const child of node.children) {
    total += countDescendants(child);
  }
  return total;
}

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

  // Distribute angles proportionally to subtree weight
  const totalWeight = node.children.reduce(
    (sum, child) => sum + countDescendants(child),
    0
  );

  const angleRange = endAngle - startAngle;
  let currentAngle = startAngle;

  node.children.forEach((child) => {
    const childWeight = countDescendants(child);
    const childAngleSpan = (childWeight / totalWeight) * angleRange;
    const angle = currentAngle + childAngleSpan / 2;

    // Adaptive radius based on depth and number of siblings
    const adaptiveRadius = Math.max(
      radius,
      node.children.length * 40 // Ensure min spacing for many siblings
    );

    const childX = cx + Math.cos(angle) * adaptiveRadius;
    const childY = cy + Math.sin(angle) * adaptiveRadius;

    const childPositions = layoutMindMapRadial(
      child,
      childX,
      childY,
      currentAngle,
      currentAngle + childAngleSpan,
      adaptiveRadius * 0.65
    );
    childPositions.forEach((pos, id) => positions.set(id, pos));

    currentAngle += childAngleSpan;
  });

  return positions;
}

// ===== Mind Map (Horizontal - right-to-left tree) =====
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

  // Center the node vertically within its subtree band
  const nodeY = y + node.subtreeHeight / 2 - node.height / 2;
  positions.set(node.id, { x, y: nodeY });

  if (node.children.length === 0) return positions;

  // Position children stacked vertically, centered within parent's subtree
  const childrenTotalHeight =
    node.children.reduce((sum, c) => sum + c.subtreeHeight, 0) +
    (node.children.length - 1) * V_GAP;
  let childY = y + (node.subtreeHeight - childrenTotalHeight) / 2;
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

  // Center the node horizontally within its subtree band
  const nodeX = x + node.subtreeWidth / 2 - node.width / 2;
  positions.set(node.id, { x: nodeX, y });

  if (node.children.length === 0) return positions;

  // Position children side-by-side, centered under parent
  const childrenTotalWidth =
    node.children.reduce((sum, c) => sum + c.subtreeWidth, 0) +
    (node.children.length - 1) * H_GAP;
  let childX = x + (node.subtreeWidth - childrenTotalWidth) / 2;
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
  return layoutMindMapHorizontal(node, x, y);
}

// ===== Fishbone (Ishikawa diagram) =====
function layoutFishbone(
  node: LayoutNode,
  x: number,
  y: number
): Map<string, Point> {
  const positions = new Map<string, Point>();
  positions.set(node.id, { x, y });

  if (node.children.length === 0) return positions;

  const ribSpacing = Math.max(180, node.width + 60);
  const ribAngle = Math.PI / 4; // 45 degrees
  const ribLength = 130;
  const subRibSpacing = 50;

  node.children.forEach((child, i) => {
    // Alternate top/bottom
    const direction = i % 2 === 0 ? -1 : 1;
    const spineX = x + node.width + (i + 1) * ribSpacing;

    // Position main rib nodes along the diagonal
    const cx = spineX - Math.cos(ribAngle) * ribLength * 0.5;
    const cy = y + direction * Math.sin(ribAngle) * ribLength;
    positions.set(child.id, { x: cx - child.width / 2, y: cy - child.height / 2 });

    // Sub-ribs (children of children) extend further along the rib
    child.children.forEach((grandchild, j) => {
      const offsetAlongRib = (j + 1) * subRibSpacing;
      const gx = cx - Math.cos(ribAngle) * offsetAlongRib;
      const gy = cy + direction * Math.sin(ribAngle) * offsetAlongRib * 0.4;
      positions.set(grandchild.id, { x: gx - grandchild.width / 2, y: gy - grandchild.height / 2 });

      // Third level: horizontal branches off sub-ribs
      grandchild.children.forEach((ggChild, k) => {
        const ggx = gx + (k % 2 === 0 ? -1 : 1) * (ggChild.width + 20);
        const ggy = gy + (k + 1) * (ggChild.height + 10) * direction * 0.5;
        positions.set(ggChild.id, { x: ggx - ggChild.width / 2, y: ggy - ggChild.height / 2 });
      });
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
        return layoutMindMapRadial(
          tree,
          baseX + tree.width / 2,
          baseY + tree.height / 2,
          0,
          Math.PI * 2,
          200
        );
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
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

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

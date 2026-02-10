import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type {
  CardData,
  ConnectionData,
  ConnectionEndpointType,
  GroupData,
  StructureData,
  CanvasViewport,
  Point,
  ContentType,
  ConnectionDirection,
  StructureType,
  LayoutDirection,
  ToolMode,
  BoundaryData,
  SummaryData,
  DrawStroke,
} from '../types';

interface CanvasState {
  // Canvas data
  cards: Record<string, CardData>;
  connections: Record<string, ConnectionData>;
  structures: Record<string, StructureData>;
  groups: Record<string, GroupData>;
  viewport: CanvasViewport;
  backgroundPattern: 'dots' | 'grid' | 'noise' | 'none';
  backgroundColor: string;
  drawStrokes: DrawStroke[];

  // Interaction state
  selectedCardIds: Set<string>;
  selectedGroupIds: Set<string>;
  selectedConnectionIds: Set<string>;
  activeCardId: string | null;
  toolMode: ToolMode;
  connectingFromId: string | null;
  connectingFromType: ConnectionEndpointType;
  isDragging: boolean;
  paintTrail: Point[];

  // Canvas metadata
  canvasId: string;
  canvasName: string;
  canvasTags: string[];

  // Actions - Cards
  addCard: (position: Point, contentType?: ContentType, content?: string) => string;
  updateCard: (id: string, updates: Partial<CardData>) => void;
  removeCard: (id: string) => void;
  moveCard: (id: string, position: Point) => void;
  resizeCard: (id: string, size: { width: number; height: number }) => void;
  moveSelectedCards: (delta: Point) => void;

  // Actions - Selection
  selectCard: (id: string, multi?: boolean) => void;
  selectGroup: (id: string, multi?: boolean) => void;
  selectConnection: (id: string, multi?: boolean) => void;
  deselectAll: () => void;
  selectCards: (ids: string[]) => void;
  addToPaintTrail: (point: Point) => void;
  finishPaintSelection: () => void;

  // Actions - Connections (now support card or group endpoints)
  addConnection: (sourceId: string, targetId: string, direction?: ConnectionDirection, sourceType?: ConnectionEndpointType, targetType?: ConnectionEndpointType) => string;
  updateConnection: (id: string, updates: Partial<ConnectionData>) => void;
  removeConnection: (id: string) => void;
  startConnecting: (fromId: string, fromType?: ConnectionEndpointType) => void;
  finishConnecting: (toId: string, toType?: ConnectionEndpointType) => void;
  cancelConnecting: () => void;

  // Actions - Groups
  createGroup: (cardIds: string[], label?: string) => string;
  updateGroup: (id: string, updates: Partial<GroupData>) => void;
  removeGroup: (id: string) => void;
  addCardsToGroup: (groupId: string, cardIds: string[]) => void;
  removeCardFromGroup: (groupId: string, cardId: string) => void;
  moveGroup: (id: string, position: Point) => void;
  toggleGroupCollapse: (id: string) => void;
  groupSelectedCards: (label?: string) => string;
  recomputeGroupBounds: (groupId: string) => void;

  // Actions - Structures (XMind)
  createStructure: (rootId: string, type: StructureType, direction?: LayoutDirection) => string;
  addChildToStructure: (parentId: string) => string;
  addSiblingInStructure: (nodeId: string) => string;
  removeFromStructure: (nodeId: string) => void;
  attachToStructure: (cardId: string, parentId: string) => void;
  detachFromStructure: (cardId: string) => void;
  toggleCollapse: (nodeId: string) => void;
  updateStructureType: (structureId: string, type: StructureType, direction?: LayoutDirection) => void;
  addBoundary: (structureId: string, nodeIds: string[], label: string, color: string) => void;
  addSummary: (structureId: string, sourceNodeIds: string[], summaryContent: string) => void;

  // Actions - Viewport
  setViewport: (viewport: Partial<CanvasViewport>) => void;
  panBy: (delta: Point) => void;
  zoomTo: (zoom: number, center?: Point) => void;

  // Actions - Tool
  setToolMode: (mode: ToolMode) => void;
  setDragging: (isDragging: boolean) => void;

  // Actions - Drawing
  addDrawStroke: (stroke: DrawStroke) => void;
  removeDrawStroke: (id: string) => void;
  clearDrawStrokes: () => void;

  // Actions - Canvas
  setCanvasName: (name: string) => void;
  setBackgroundPattern: (pattern: 'dots' | 'grid' | 'noise' | 'none') => void;
  setBackgroundColor: (color: string) => void;
  setCanvasTags: (tags: string[]) => void;
  loadCanvas: (data: {
    cards: Record<string, CardData>;
    connections: Record<string, ConnectionData>;
    structures: Record<string, StructureData>;
    groups: Record<string, GroupData>;
    canvasId: string;
    canvasName: string;
    canvasTags: string[];
    backgroundPattern: 'dots' | 'grid' | 'noise' | 'none';
    backgroundColor: string;
  }) => void;
  clearCanvas: () => void;
  getMaxZIndex: () => number;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  // Initial state
  cards: {},
  connections: {},
  structures: {},
  groups: {},
  viewport: { offset: { x: 0, y: 0 }, zoom: 1 },
  backgroundPattern: 'dots',
  backgroundColor: '#f5f0e8',
  drawStrokes: [],
  selectedCardIds: new Set(),
  selectedGroupIds: new Set(),
  selectedConnectionIds: new Set(),
  activeCardId: null,
  toolMode: 'select',
  connectingFromId: null,
  connectingFromType: 'card' as ConnectionEndpointType,
  isDragging: false,
  paintTrail: [],
  canvasId: nanoid(),
  canvasName: 'Untitled Canvas',
  canvasTags: [],

  // Card actions
  addCard: (position, contentType = 'text', content = '') => {
    const id = nanoid();
    const now = Date.now();
    const card: CardData = {
      id,
      position,
      size: { width: 200, height: 80 },
      content,
      contentType,
      metadata: {
        createdAt: now,
        updatedAt: now,
        tags: [],
      },
      zIndex: get().getMaxZIndex() + 1,
      childrenIds: [],
      collapsed: false,
      isRoot: false,
    };
    set((state) => ({
      cards: { ...state.cards, [id]: card },
      activeCardId: id,
      selectedCardIds: new Set([id]),
    }));
    return id;
  },

  updateCard: (id, updates) => {
    set((state) => {
      const card = state.cards[id];
      if (!card) return state;
      return {
        cards: {
          ...state.cards,
          [id]: {
            ...card,
            ...updates,
            metadata: {
              ...card.metadata,
              ...(updates.metadata || {}),
              updatedAt: Date.now(),
            },
          },
        },
      };
    });
  },

  removeCard: (id) => {
    set((state) => {
      const newCards = { ...state.cards };
      const card = newCards[id];
      if (!card) return state;

      // Remove from structure if part of one
      if (card.structureId) {
        get().detachFromStructure(id);
      }

      // Remove from group if part of one
      const newGroups = { ...state.groups };
      if (card.groupId && newGroups[card.groupId]) {
        newGroups[card.groupId] = {
          ...newGroups[card.groupId],
          cardIds: newGroups[card.groupId].cardIds.filter((cid) => cid !== id),
        };
        // Remove group if empty
        if (newGroups[card.groupId].cardIds.length === 0) {
          delete newGroups[card.groupId];
        }
      }

      // Remove connections involving this card
      const newConnections = { ...state.connections };
      Object.values(newConnections).forEach((conn) => {
        if (conn.sourceId === id || conn.targetId === id) {
          delete newConnections[conn.id];
        }
      });

      delete newCards[id];
      const newSelected = new Set(state.selectedCardIds);
      newSelected.delete(id);

      return {
        cards: newCards,
        connections: newConnections,
        groups: newGroups,
        selectedCardIds: newSelected,
        activeCardId: state.activeCardId === id ? null : state.activeCardId,
      };
    });
  },

  moveCard: (id, position) => {
    set((state) => {
      const card = state.cards[id];
      if (!card) return state;
      return {
        cards: { ...state.cards, [id]: { ...card, position } },
      };
    });
  },

  resizeCard: (id, size) => {
    set((state) => {
      const card = state.cards[id];
      if (!card) return state;
      return {
        cards: {
          ...state.cards,
          [id]: {
            ...card,
            size: {
              width: Math.max(80, size.width),
              height: Math.max(30, size.height),
            },
          },
        },
      };
    });
  },

  moveSelectedCards: (delta) => {
    set((state) => {
      const newCards = { ...state.cards };
      state.selectedCardIds.forEach((id) => {
        const card = newCards[id];
        if (card) {
          newCards[id] = {
            ...card,
            position: {
              x: card.position.x + delta.x,
              y: card.position.y + delta.y,
            },
          };
        }
      });
      return { cards: newCards };
    });
  },

  // Selection
  selectCard: (id, multi = false) => {
    set((state) => {
      if (multi) {
        const newSet = new Set(state.selectedCardIds);
        if (newSet.has(id)) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
        return { selectedCardIds: newSet, activeCardId: id };
      }
      return { selectedCardIds: new Set([id]), activeCardId: id };
    });
  },

  selectGroup: (id, multi = false) => {
    set((state) => {
      if (multi) {
        const newSet = new Set(state.selectedGroupIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        return { selectedGroupIds: newSet };
      }
      return { selectedGroupIds: new Set([id]), selectedCardIds: new Set(), selectedConnectionIds: new Set(), activeCardId: null };
    });
  },

  selectConnection: (id, multi = false) => {
    set((state) => {
      if (multi) {
        const newSet = new Set(state.selectedConnectionIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        return { selectedConnectionIds: newSet };
      }
      return { selectedConnectionIds: new Set([id]), selectedCardIds: new Set(), selectedGroupIds: new Set(), activeCardId: null };
    });
  },

  deselectAll: () => {
    set({ selectedCardIds: new Set(), selectedGroupIds: new Set(), selectedConnectionIds: new Set(), activeCardId: null });
  },

  selectCards: (ids) => {
    set({ selectedCardIds: new Set(ids) });
  },

  addToPaintTrail: (point) => {
    set((state) => ({ paintTrail: [...state.paintTrail, point] }));
  },

  finishPaintSelection: () => {
    const { paintTrail, cards } = get();
    if (paintTrail.length < 2) {
      set({ paintTrail: [] });
      return;
    }
    // Find cards that intersect with the paint trail
    const selected: string[] = [];
    Object.values(cards).forEach((card) => {
      const cx = card.position.x + card.size.width / 2;
      const cy = card.position.y + card.size.height / 2;
      for (const pt of paintTrail) {
        const dx = pt.x - cx;
        const dy = pt.y - cy;
        if (
          Math.abs(dx) < card.size.width / 2 + 30 &&
          Math.abs(dy) < card.size.height / 2 + 30
        ) {
          selected.push(card.id);
          break;
        }
      }
    });
    set({ selectedCardIds: new Set(selected), paintTrail: [] });
  },

  // Connections
  addConnection: (sourceId, targetId, direction = 'none', sourceType = 'card', targetType = 'card') => {
    const id = nanoid();
    const conn: ConnectionData = {
      id,
      sourceId,
      targetId,
      sourceType,
      targetType,
      label: '',
      direction,
    };
    set((state) => ({
      connections: { ...state.connections, [id]: conn },
    }));
    return id;
  },

  updateConnection: (id, updates) => {
    set((state) => {
      const conn = state.connections[id];
      if (!conn) return state;
      return {
        connections: { ...state.connections, [id]: { ...conn, ...updates } },
      };
    });
  },

  removeConnection: (id) => {
    set((state) => {
      const newConns = { ...state.connections };
      delete newConns[id];
      return { connections: newConns };
    });
  },

  startConnecting: (fromId, fromType = 'card') => {
    set({ connectingFromId: fromId, connectingFromType: fromType, toolMode: 'connect' });
  },

  finishConnecting: (toId, toType = 'card') => {
    const { connectingFromId, connectingFromType } = get();
    if (connectingFromId && connectingFromId !== toId) {
      get().addConnection(connectingFromId, toId, 'forward', connectingFromType, toType);
    }
    set({ connectingFromId: null, connectingFromType: 'card', toolMode: 'select' });
  },

  cancelConnecting: () => {
    set({ connectingFromId: null, connectingFromType: 'card', toolMode: 'select' });
  },

  // Group actions
  createGroup: (cardIds, label = 'Group') => {
    const id = nanoid();
    const state = get();
    // Compute bounding box of selected cards
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    cardIds.forEach((cid) => {
      const card = state.cards[cid];
      if (card) {
        minX = Math.min(minX, card.position.x);
        minY = Math.min(minY, card.position.y);
        maxX = Math.max(maxX, card.position.x + card.size.width);
        maxY = Math.max(maxY, card.position.y + card.size.height);
      }
    });
    const padding = 24;
    const group: GroupData = {
      id,
      label,
      cardIds: [...cardIds],
      position: { x: minX - padding, y: minY - padding - 28 },
      size: { width: maxX - minX + padding * 2, height: maxY - minY + padding * 2 + 28 },
      color: '#7c5cbf',
      zIndex: state.getMaxZIndex() - 1,
      collapsed: false,
    };
    // Mark cards as belonging to this group
    const newCards = { ...state.cards };
    cardIds.forEach((cid) => {
      if (newCards[cid]) {
        newCards[cid] = { ...newCards[cid], groupId: id };
      }
    });
    set({ groups: { ...state.groups, [id]: group }, cards: newCards });
    return id;
  },

  updateGroup: (id, updates) => {
    set((state) => {
      const group = state.groups[id];
      if (!group) return state;
      return { groups: { ...state.groups, [id]: { ...group, ...updates } } };
    });
  },

  removeGroup: (id) => {
    set((state) => {
      const group = state.groups[id];
      if (!group) return state;
      // Unmark cards
      const newCards = { ...state.cards };
      group.cardIds.forEach((cid) => {
        if (newCards[cid]) {
          newCards[cid] = { ...newCards[cid], groupId: undefined };
        }
      });
      // Remove connections that involve this group
      const newConnections = { ...state.connections };
      Object.values(newConnections).forEach((conn) => {
        if (
          (conn.sourceId === id && conn.sourceType === 'group') ||
          (conn.targetId === id && conn.targetType === 'group')
        ) {
          delete newConnections[conn.id];
        }
      });
      const newGroups = { ...state.groups };
      delete newGroups[id];
      const newSelectedGroups = new Set(state.selectedGroupIds);
      newSelectedGroups.delete(id);
      return { groups: newGroups, cards: newCards, connections: newConnections, selectedGroupIds: newSelectedGroups };
    });
  },

  addCardsToGroup: (groupId, cardIds) => {
    set((state) => {
      const group = state.groups[groupId];
      if (!group) return state;
      const newCards = { ...state.cards };
      const newCardIds = [...group.cardIds];
      cardIds.forEach((cid) => {
        if (newCards[cid] && !newCardIds.includes(cid)) {
          // Remove from old group if any
          const old = newCards[cid].groupId;
          if (old && state.groups[old]) {
            const oldGroup = state.groups[old];
            state.groups[old] = { ...oldGroup, cardIds: oldGroup.cardIds.filter((i) => i !== cid) };
          }
          newCards[cid] = { ...newCards[cid], groupId: groupId };
          newCardIds.push(cid);
        }
      });
      return {
        cards: newCards,
        groups: { ...state.groups, [groupId]: { ...group, cardIds: newCardIds } },
      };
    });
    get().recomputeGroupBounds(groupId);
  },

  removeCardFromGroup: (groupId, cardId) => {
    set((state) => {
      const group = state.groups[groupId];
      if (!group) return state;
      const newCards = { ...state.cards };
      if (newCards[cardId]) {
        newCards[cardId] = { ...newCards[cardId], groupId: undefined };
      }
      const newCardIds = group.cardIds.filter((id) => id !== cardId);
      const newGroups = { ...state.groups };
      if (newCardIds.length === 0) {
        delete newGroups[groupId];
      } else {
        newGroups[groupId] = { ...group, cardIds: newCardIds };
      }
      return { cards: newCards, groups: newGroups };
    });
  },

  moveGroup: (id, position) => {
    set((state) => {
      const group = state.groups[id];
      if (!group) return state;
      const dx = position.x - group.position.x;
      const dy = position.y - group.position.y;
      // Move all cards in the group too
      const newCards = { ...state.cards };
      group.cardIds.forEach((cid) => {
        const card = newCards[cid];
        if (card) {
          newCards[cid] = {
            ...card,
            position: { x: card.position.x + dx, y: card.position.y + dy },
          };
        }
      });
      return {
        groups: { ...state.groups, [id]: { ...group, position } },
        cards: newCards,
      };
    });
  },

  toggleGroupCollapse: (id) => {
    set((state) => {
      const group = state.groups[id];
      if (!group) return state;
      return {
        groups: { ...state.groups, [id]: { ...group, collapsed: !group.collapsed } },
      };
    });
  },

  groupSelectedCards: (label = 'Group') => {
    const { selectedCardIds } = get();
    const ids = Array.from(selectedCardIds);
    if (ids.length < 2) return '';
    return get().createGroup(ids, label);
  },

  recomputeGroupBounds: (groupId) => {
    set((state) => {
      const group = state.groups[groupId];
      if (!group) return state;
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      group.cardIds.forEach((cid) => {
        const card = state.cards[cid];
        if (card) {
          minX = Math.min(minX, card.position.x);
          minY = Math.min(minY, card.position.y);
          maxX = Math.max(maxX, card.position.x + card.size.width);
          maxY = Math.max(maxY, card.position.y + card.size.height);
        }
      });
      if (minX === Infinity) return state;
      const padding = 24;
      return {
        groups: {
          ...state.groups,
          [groupId]: {
            ...group,
            position: { x: minX - padding, y: minY - padding - 28 },
            size: { width: maxX - minX + padding * 2, height: maxY - minY + padding * 2 + 28 },
          },
        },
      };
    });
  },

  // Structure (XMind) actions
  createStructure: (rootId, type, direction) => {
    const structureId = nanoid();
    const card = get().cards[rootId];
    if (!card) return structureId;

    const defaultDirection: LayoutDirection =
      type === 'mindmap' ? 'radial' :
      type === 'logic-chart' ? 'left-to-right' :
      type === 'org-chart' ? 'top-down' :
      'horizontal';

    const structure: StructureData = {
      id: structureId,
      rootId,
      type,
      layoutDirection: direction || defaultDirection,
      nodeIds: [rootId],
      boundaries: [],
      summaries: [],
    };

    set((state) => ({
      structures: { ...state.structures, [structureId]: structure },
      cards: {
        ...state.cards,
        [rootId]: {
          ...state.cards[rootId],
          structureId,
          isRoot: true,
          parentId: undefined,
        },
      },
    }));
    return structureId;
  },

  addChildToStructure: (parentId) => {
    const state = get();
    const parent = state.cards[parentId];
    if (!parent || !parent.structureId) return '';

    const childId = nanoid();
    const now = Date.now();
    const childCard: CardData = {
      id: childId,
      position: {
        x: parent.position.x + 250,
        y: parent.position.y + (parent.childrenIds.length * 80),
      },
      size: { width: 180, height: 60 },
      content: '',
      contentType: 'text',
      metadata: { createdAt: now, updatedAt: now, tags: [] },
      zIndex: state.getMaxZIndex() + 1,
      structureId: parent.structureId,
      parentId,
      childrenIds: [],
      collapsed: false,
      isRoot: false,
    };

    // Add connection
    const connId = nanoid();
    const conn: ConnectionData = {
      id: connId,
      sourceId: parentId,
      targetId: childId,
      sourceType: 'card',
      targetType: 'card',
      label: '',
      direction: 'forward',
      styleOverride: 'elbow',
    };

    set((state) => {
      const structure = state.structures[parent.structureId!];
      return {
        cards: {
          ...state.cards,
          [childId]: childCard,
          [parentId]: {
            ...state.cards[parentId],
            childrenIds: [...state.cards[parentId].childrenIds, childId],
          },
        },
        connections: { ...state.connections, [connId]: conn },
        structures: {
          ...state.structures,
          [parent.structureId!]: {
            ...structure,
            nodeIds: [...structure.nodeIds, childId],
          },
        },
        activeCardId: childId,
        selectedCardIds: new Set([childId]),
      };
    });
    return childId;
  },

  addSiblingInStructure: (nodeId) => {
    const state = get();
    const node = state.cards[nodeId];
    if (!node || !node.parentId || !node.structureId) return '';
    return get().addChildToStructure(node.parentId);
  },

  removeFromStructure: (nodeId) => {
    const state = get();
    const node = state.cards[nodeId];
    if (!node || !node.structureId) return;

    const structure = state.structures[node.structureId];
    if (!structure) return;

    // Recursively detach all children
    const detachRecursive = (id: string, cards: Record<string, CardData>) => {
      const card = cards[id];
      if (!card) return cards;
      card.childrenIds.forEach((childId) => {
        cards = detachRecursive(childId, cards);
      });
      cards[id] = {
        ...cards[id],
        structureId: undefined,
        parentId: undefined,
        isRoot: false,
      };
      return cards;
    };

    set((state) => {
      let newCards = { ...state.cards };
      newCards = detachRecursive(nodeId, newCards);

      // Remove from parent's children
      if (node.parentId && newCards[node.parentId]) {
        newCards[node.parentId] = {
          ...newCards[node.parentId],
          childrenIds: newCards[node.parentId].childrenIds.filter((id) => id !== nodeId),
        };
      }

      // Update structure
      const allDetached = [nodeId];
      const collectChildren = (id: string) => {
        state.cards[id]?.childrenIds.forEach((cid) => {
          allDetached.push(cid);
          collectChildren(cid);
        });
      };
      collectChildren(nodeId);

      const newNodeIds = structure.nodeIds.filter((id) => !allDetached.includes(id));

      const newStructures = { ...state.structures };
      if (newNodeIds.length <= 1 && nodeId === structure.rootId) {
        delete newStructures[structure.id];
      } else {
        newStructures[structure.id] = { ...structure, nodeIds: newNodeIds };
      }

      return { cards: newCards, structures: newStructures };
    });
  },

  attachToStructure: (cardId, parentId) => {
    const state = get();
    const parent = state.cards[parentId];
    if (!parent || !parent.structureId) return;

    const connId = nanoid();
    const conn: ConnectionData = {
      id: connId,
      sourceId: parentId,
      targetId: cardId,
      sourceType: 'card',
      targetType: 'card',
      label: '',
      direction: 'forward',
      styleOverride: 'elbow',
    };

    set((state) => {
      const structure = state.structures[parent.structureId!];
      return {
        cards: {
          ...state.cards,
          [cardId]: {
            ...state.cards[cardId],
            structureId: parent.structureId,
            parentId,
          },
          [parentId]: {
            ...state.cards[parentId],
            childrenIds: [...state.cards[parentId].childrenIds, cardId],
          },
        },
        connections: { ...state.connections, [connId]: conn },
        structures: {
          ...state.structures,
          [parent.structureId!]: {
            ...structure,
            nodeIds: [...structure.nodeIds, cardId],
          },
        },
      };
    });
  },

  detachFromStructure: (cardId) => {
    const state = get();
    const card = state.cards[cardId];
    if (!card || !card.structureId) return;

    // Remove connections to parent
    const newConns = { ...state.connections };
    Object.values(newConns).forEach((conn) => {
      if (
        (conn.sourceId === card.parentId && conn.targetId === cardId) ||
        (conn.sourceId === cardId && conn.targetId === card.parentId)
      ) {
        if (conn.styleOverride === 'elbow') {
          delete newConns[conn.id];
        }
      }
    });

    set((state) => {
      const structure = state.structures[card.structureId!];
      const newCards = { ...state.cards };

      // Remove from parent
      if (card.parentId && newCards[card.parentId]) {
        newCards[card.parentId] = {
          ...newCards[card.parentId],
          childrenIds: newCards[card.parentId].childrenIds.filter((id) => id !== cardId),
        };
      }

      newCards[cardId] = {
        ...newCards[cardId],
        structureId: undefined,
        parentId: undefined,
        isRoot: false,
      };

      const newStructures = { ...state.structures };
      if (structure) {
        newStructures[structure.id] = {
          ...structure,
          nodeIds: structure.nodeIds.filter((id) => id !== cardId),
        };
      }

      return { cards: newCards, connections: newConns, structures: newStructures };
    });
  },

  toggleCollapse: (nodeId) => {
    set((state) => {
      const card = state.cards[nodeId];
      if (!card) return state;
      return {
        cards: {
          ...state.cards,
          [nodeId]: { ...card, collapsed: !card.collapsed },
        },
      };
    });
  },

  updateStructureType: (structureId, type, direction) => {
    set((state) => {
      const structure = state.structures[structureId];
      if (!structure) return state;
      const defaultDirection: LayoutDirection =
        type === 'mindmap' ? 'radial' :
        type === 'logic-chart' ? 'left-to-right' :
        type === 'org-chart' ? 'top-down' :
        'horizontal';
      return {
        structures: {
          ...state.structures,
          [structureId]: {
            ...structure,
            type,
            layoutDirection: direction || defaultDirection,
          },
        },
      };
    });
  },

  addBoundary: (structureId, nodeIds, label, color) => {
    const id = nanoid();
    const boundary: BoundaryData = { id, nodeIds, label, color };
    set((state) => {
      const structure = state.structures[structureId];
      if (!structure) return state;
      return {
        structures: {
          ...state.structures,
          [structureId]: {
            ...structure,
            boundaries: [...structure.boundaries, boundary],
          },
        },
      };
    });
  },

  addSummary: (structureId, sourceNodeIds, summaryContent) => {
    const state = get();
    const structure = state.structures[structureId];
    if (!structure) return;

    const summaryCardId = state.addCard(
      { x: 0, y: 0 },
      'text',
      summaryContent
    );

    const id = nanoid();
    const summary: SummaryData = {
      id,
      sourceNodeIds,
      summaryNodeId: summaryCardId,
      label: summaryContent,
    };

    set((s) => ({
      structures: {
        ...s.structures,
        [structureId]: {
          ...s.structures[structureId],
          summaries: [...s.structures[structureId].summaries, summary],
        },
      },
    }));
  },

  // Viewport
  setViewport: (viewport) => {
    set((state) => ({
      viewport: { ...state.viewport, ...viewport },
    }));
  },

  panBy: (delta) => {
    set((state) => ({
      viewport: {
        ...state.viewport,
        offset: {
          x: state.viewport.offset.x + delta.x,
          y: state.viewport.offset.y + delta.y,
        },
      },
    }));
  },

  zoomTo: (zoom, center) => {
    set((state) => {
      const clampedZoom = Math.max(0.1, Math.min(5, zoom));
      if (center) {
        const zoomRatio = clampedZoom / state.viewport.zoom;
        return {
          viewport: {
            zoom: clampedZoom,
            offset: {
              x: center.x - (center.x - state.viewport.offset.x) * zoomRatio,
              y: center.y - (center.y - state.viewport.offset.y) * zoomRatio,
            },
          },
        };
      }
      return { viewport: { ...state.viewport, zoom: clampedZoom } };
    });
  },

  // Tool
  setToolMode: (mode) => set({ toolMode: mode }),
  setDragging: (isDragging) => set({ isDragging }),

  // Drawing
  addDrawStroke: (stroke) => set((state) => ({ drawStrokes: [...state.drawStrokes, stroke] })),
  removeDrawStroke: (id) => set((state) => ({ drawStrokes: state.drawStrokes.filter((s) => s.id !== id) })),
  clearDrawStrokes: () => set({ drawStrokes: [] }),

  // Canvas meta
  setCanvasName: (name) => set({ canvasName: name }),
  setBackgroundPattern: (pattern) => set({ backgroundPattern: pattern }),
  setBackgroundColor: (color) => set({ backgroundColor: color }),
  setCanvasTags: (tags) => set({ canvasTags: tags }),

  loadCanvas: (data) => {
    set({
      cards: data.cards,
      connections: data.connections,
      structures: data.structures,
      groups: data.groups || {},
      canvasId: data.canvasId,
      canvasName: data.canvasName,
      canvasTags: data.canvasTags,
      backgroundPattern: data.backgroundPattern,
      backgroundColor: data.backgroundColor,
      selectedCardIds: new Set(),
      selectedGroupIds: new Set(),
      selectedConnectionIds: new Set(),
      activeCardId: null,
    });
  },

  clearCanvas: () => {
    set({
      cards: {},
      connections: {},
      structures: {},
      groups: {},
      selectedCardIds: new Set(),
      selectedGroupIds: new Set(),
      selectedConnectionIds: new Set(),
      activeCardId: null,
      canvasId: nanoid(),
      canvasName: 'Untitled Canvas',
      canvasTags: [],
    });
  },

  getMaxZIndex: () => {
    const cards = get().cards;
    let max = 0;
    Object.values(cards).forEach((c) => {
      if (c.zIndex > max) max = c.zIndex;
    });
    return max;
  },
}));

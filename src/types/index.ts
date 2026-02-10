// ============================================================
// Hybrid Spatial Canvas - Core Type Definitions
// ============================================================

export type ContentType = 'text' | 'image' | 'url' | 'audio' | 'video';
export type ConnectionDirection = 'none' | 'forward' | 'backward' | 'bidirectional';
export type LineStyle = 'solid' | 'dashed' | 'dotted';
export type CurveStyle = 'curved' | 'straight';
export type StructureType = 'mindmap' | 'logic-chart' | 'org-chart' | 'fishbone';
export type LayoutDirection = 'radial' | 'horizontal' | 'vertical' | 'left-to-right' | 'top-down';

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface CardMetadata {
  createdAt: number;
  updatedAt: number;
  tags: string[];
  color?: string;
  borderColor?: string;
  fontFamily?: string;
  fontColor?: string;
}

export interface CardData {
  id: string;
  position: Point;
  size: Size;
  content: string;
  contentType: ContentType;
  metadata: CardMetadata;
  zIndex: number;
  // Group membership
  groupId?: string;           // If part of a group
  // XMind layer properties
  structureId?: string;      // If part of a structure
  parentId?: string;          // Parent in tree hierarchy
  childrenIds: string[];      // Children in tree hierarchy
  collapsed: boolean;
  isRoot: boolean;
}

// Connection endpoints can be cards or groups
export type ConnectionEndpointType = 'card' | 'group';

export interface ConnectionData {
  id: string;
  sourceId: string;
  targetId: string;
  sourceType: ConnectionEndpointType;
  targetType: ConnectionEndpointType;
  label: string;
  direction: ConnectionDirection;
  // Rendering style determined by context
  styleOverride?: 'spline' | 'elbow' | 'straight';
  color?: string;
  lineStyle?: LineStyle;
  curveStyle?: CurveStyle;
}

export interface GroupData {
  id: string;
  label: string;
  cardIds: string[];
  position: Point;
  size: Size;
  color: string;
  zIndex: number;
  collapsed: boolean;
}

export interface StructureData {
  id: string;
  rootId: string;
  type: StructureType;
  layoutDirection: LayoutDirection;
  nodeIds: string[];
  // Boundary groups
  boundaries: BoundaryData[];
  // Summary brackets
  summaries: SummaryData[];
}

export interface BoundaryData {
  id: string;
  nodeIds: string[];
  label: string;
  color: string;
}

export interface SummaryData {
  id: string;
  sourceNodeIds: string[];
  summaryNodeId: string;
  label: string;
}

export interface CanvasViewport {
  offset: Point;
  zoom: number;
}

export interface CanvasData {
  id: string;
  name: string;
  description: string;
  cards: Record<string, CardData>;
  connections: Record<string, ConnectionData>;
  structures: Record<string, StructureData>;
  groups: Record<string, GroupData>;
  viewport: CanvasViewport;
  backgroundPattern: 'dots' | 'grid' | 'noise' | 'none';
  backgroundColor: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  folderId?: string;
  thumbnail?: string;
}

export interface FolderData {
  id: string;
  name: string;
  color: string;
  canvasIds: string[];
}

export interface WorkspaceData {
  canvases: Record<string, CanvasData>;
  folders: Record<string, FolderData>;
  recentCanvasIds: string[];
}

// Theme types
export interface ThemeColors {
  background: string;
  surface: string;
  surfaceHover: string;
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  textMuted: string;
  border: string;
  shadow: string;
  cardBg: string;
  cardBorder: string;
  connectionLine: string;
  selectionStroke: string;
  danger: string;
  success: string;
}

export interface ThemeTypography {
  fontFamily: string;
  fontFamilyMono: string;
  fontWeight: number;
  fontWeightBold: number;
  lineHeight: number;
  fontSize: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    xxl: string;
  };
}

export interface ThemeDecorations {
  borderRadius: string;
  borderRadiusLg: string;
  borderWidth: string;
  shadowStyle: string;
  svgFilter?: string;
  backgroundPattern?: string;
  buttonStyle: 'flat' | 'bevel' | 'glow' | 'soft';
  cardStyle: 'sharp' | 'rounded' | 'hand-drawn' | 'neon';
}

export interface ThemeDefinition {
  id: string;
  name: string;
  variant: 'light' | 'dark';
  colors: ThemeColors;
  typography: ThemeTypography;
  decorations: ThemeDecorations;
}

// Tool modes for canvas interaction
export type ToolMode = 'select' | 'pan' | 'connect' | 'paint-select' | 'draw';

// Freehand drawing strokes
export interface DrawStroke {
  id: string;
  points: Point[];
  color: string;
  width: number;
  opacity: number;
}

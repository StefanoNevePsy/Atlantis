import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { useThemeStore } from '../../store/themeStore';
import type { CardData, Point } from '../../types';
import { CardContent } from './CardContent';
import { CardContextMenu } from './CardContextMenu';
import { CollapseIndicator } from '../xmind/CollapseIndicator';

interface Props {
  card: CardData;
  isSelected: boolean;
  onConnect?: () => void;
}

type ResizeCorner = 'se' | 'sw' | 'ne' | 'nw' | null;

export const Card: React.FC<Props> = ({ card, isSelected, onConnect }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(!card.content);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState<Point>({ x: 0, y: 0 });
  const [resizing, setResizing] = useState<ResizeCorner>(null);
  const [settling, setSettling] = useState(false);
  const dragStart = useRef<Point>({ x: 0, y: 0 });
  const cardStart = useRef<Point>({ x: 0, y: 0 });
  const sizeStart = useRef<{ width: number; height: number }>({ width: 0, height: 0 });
  const velocity = useRef<Point>({ x: 0, y: 0 });
  const lastMoveTime = useRef(0);
  const lastMovePos = useRef<Point>({ x: 0, y: 0 });

  const {
    selectCard,
    moveCard,
    resizeCard,
    moveSelectedCards,
    startConnecting,
    toolMode,
    selectedCardIds,
    viewport,
  } = useCanvasStore();

  const { currentTheme } = useThemeStore();

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();

      if (toolMode === 'connect') {
        if (onConnect) {
          onConnect();
        } else {
          startConnecting(card.id);
        }
        return;
      }

      selectCard(card.id, e.shiftKey || e.ctrlKey || e.metaKey);

      // Locked cards can't be dragged
      if (card.locked) return;

      setIsDragging(true);
      setSettling(false);
      dragStart.current = { x: e.clientX, y: e.clientY };
      cardStart.current = { ...card.position };
      lastMovePos.current = { x: e.clientX, y: e.clientY };
      lastMoveTime.current = performance.now();
      velocity.current = { x: 0, y: 0 };
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    },
    [card.id, card.position, selectCard, startConnecting, toolMode, onConnect]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (resizing) {
        e.stopPropagation();
        const dx = (e.clientX - dragStart.current.x) / viewport.zoom;
        const dy = (e.clientY - dragStart.current.y) / viewport.zoom;

        let newW = sizeStart.current.width;
        let newH = sizeStart.current.height;
        let newX = cardStart.current.x;
        let newY = cardStart.current.y;

        if (resizing === 'se') { newW += dx; newH += dy; }
        else if (resizing === 'sw') { newW -= dx; newH += dy; newX += dx; }
        else if (resizing === 'ne') { newW += dx; newH -= dy; newY += dy; }
        else if (resizing === 'nw') { newW -= dx; newH -= dy; newX += dx; newY += dy; }

        resizeCard(card.id, { width: Math.max(80, newW), height: Math.max(30, newH) });
        moveCard(card.id, { x: newX, y: newY });
        return;
      }

      if (!isDragging) return;
      e.stopPropagation();

      // Track velocity for inertia
      const now = performance.now();
      const dt = now - lastMoveTime.current;
      if (dt > 0) {
        velocity.current = {
          x: (e.clientX - lastMovePos.current.x) / dt,
          y: (e.clientY - lastMovePos.current.y) / dt,
        };
      }
      lastMovePos.current = { x: e.clientX, y: e.clientY };
      lastMoveTime.current = now;

      const dx = (e.clientX - dragStart.current.x) / viewport.zoom;
      const dy = (e.clientY - dragStart.current.y) / viewport.zoom;

      if (selectedCardIds.has(card.id) && selectedCardIds.size > 1) {
        moveSelectedCards({ x: dx, y: dy });
        dragStart.current = { x: e.clientX, y: e.clientY };
      } else {
        moveCard(card.id, {
          x: cardStart.current.x + dx,
          y: cardStart.current.y + dy,
        });
      }
    },
    [isDragging, resizing, card.id, moveCard, resizeCard, moveSelectedCards, selectedCardIds, viewport.zoom]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (resizing) {
        e.stopPropagation();
        setResizing(null);
        return;
      }
      if (!isDragging) return;
      e.stopPropagation();
      setIsDragging(false);

      // Apply inertia: if velocity is significant, coast to a stop
      const vx = velocity.current.x / viewport.zoom;
      const vy = velocity.current.y / viewport.zoom;
      const speed = Math.sqrt(vx * vx + vy * vy);

      if (speed > 0.15) {
        setSettling(true);
        const friction = 0.92;
        let curVx = vx * 8; // amplify for visible effect
        let curVy = vy * 8;
        let curX = card.position.x;
        let curY = card.position.y;

        const animate = () => {
          curVx *= friction;
          curVy *= friction;
          curX += curVx;
          curY += curVy;

          if (Math.abs(curVx) < 0.1 && Math.abs(curVy) < 0.1) {
            setSettling(false);
            return;
          }

          moveCard(card.id, { x: curX, y: curY });
          requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
      }
    },
    [isDragging, resizing, card.id, card.position, moveCard, viewport.zoom]
  );

  const handleResizeStart = useCallback(
    (corner: ResizeCorner, e: React.PointerEvent) => {
      e.stopPropagation();
      e.preventDefault();
      setResizing(corner);
      dragStart.current = { x: e.clientX, y: e.clientY };
      cardStart.current = { ...card.position };
      sizeStart.current = { ...card.size };
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    },
    [card.position, card.size]
  );

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!card.locked) setIsEditing(true);
  }, [card.locked]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  }, []);

  // Auto-focus new empty cards
  useEffect(() => {
    if (!card.content && isSelected) setIsEditing(true);
  }, []);

  const isInStructure = !!card.structureId;
  const hasChildren = card.childrenIds.length > 0;
  const hiddenCount = card.collapsed ? card.childrenIds.length : 0;

  // Kinopio-style card style with hover/drag animations
  const getCardStyle = (): React.CSSProperties => {
    const customBorderColor = card.metadata.borderColor;
    const noTransition = isDragging || resizing || settling;

    const base: React.CSSProperties = {
      position: 'absolute',
      left: card.position.x,
      top: card.position.y,
      width: card.size.width,
      minHeight: card.size.height,
      padding: '10px 14px',
      cursor: isDragging ? 'grabbing' : 'grab',
      userSelect: 'none',
      transition: noTransition
        ? 'box-shadow 0.2s ease'
        : 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s ease, filter 0.2s ease',
      zIndex: card.zIndex + (isDragging ? 1000 : isHovered ? 500 : 0),
      background: card.cardColor || card.metadata.color || currentTheme.colors.cardBg,
      color: card.metadata.fontColor || currentTheme.colors.text,
      fontFamily: card.metadata.fontFamily || currentTheme.typography.fontFamily,
      fontSize: currentTheme.typography.fontSize.md,
      boxSizing: 'border-box',
      overflow: 'hidden',
    };

    const { cardStyle } = currentTheme.decorations;
    const borderCol = isSelected
      ? currentTheme.colors.selectionStroke
      : customBorderColor || currentTheme.colors.cardBorder;

    // Hover lift animation
    const hoverLift = isHovered && !isDragging && !isSelected ? 'translateY(-3px)' : '';
    const dragScale = isDragging ? 'scale(1.04) rotate(-1deg)' : '';
    const selectedScale = isSelected && !isDragging ? 'scale(1.01)' : '';
    const transform = dragScale || hoverLift || selectedScale || 'scale(1)';

    switch (cardStyle) {
      case 'sharp':
        return {
          ...base,
          border: `${currentTheme.decorations.borderWidth} solid ${borderCol}`,
          borderRadius: currentTheme.decorations.borderRadius,
          boxShadow: isDragging
            ? `10px 10px 0px ${currentTheme.colors.shadow}`
            : isSelected
            ? `6px 6px 0px ${currentTheme.colors.selectionStroke}`
            : isHovered
            ? `5px 5px 0px ${currentTheme.colors.shadow}`
            : currentTheme.decorations.shadowStyle,
          transform,
        };
      case 'rounded':
        return {
          ...base,
          border: `${currentTheme.decorations.borderWidth} solid ${borderCol}`,
          borderRadius: currentTheme.decorations.borderRadiusLg,
          boxShadow: isDragging
            ? `0 12px 24px ${currentTheme.colors.shadow}60`
            : isSelected
            ? `0 0 0 2px ${currentTheme.colors.selectionStroke}, ${currentTheme.decorations.shadowStyle}`
            : isHovered
            ? `0 6px 16px ${currentTheme.colors.shadow}40`
            : currentTheme.decorations.shadowStyle,
          transform,
        };
      case 'hand-drawn': {
        const baseTransform = isDragging
          ? 'rotate(-1.5deg) scale(1.03)'
          : isHovered && !isSelected
          ? 'rotate(0.5deg) translateY(-2px)'
          : isSelected
          ? 'rotate(0.3deg)'
          : 'none';
        return {
          ...base,
          border: `${currentTheme.decorations.borderWidth} solid ${borderCol}`,
          borderRadius: '2px 8px 4px 6px',
          boxShadow: currentTheme.decorations.shadowStyle,
          transform: baseTransform,
          filter: currentTheme.decorations.svgFilter,
        };
      }
      case 'neon':
        return {
          ...base,
          border: `1px solid ${borderCol}`,
          borderRadius: currentTheme.decorations.borderRadius,
          boxShadow: isDragging
            ? `0 0 30px ${currentTheme.colors.primary}50, 0 0 60px ${currentTheme.colors.primary}20`
            : isSelected
            ? `0 0 20px ${currentTheme.colors.selectionStroke}60, 0 0 40px ${currentTheme.colors.selectionStroke}20, inset 0 0 20px ${currentTheme.colors.selectionStroke}10`
            : isHovered
            ? `0 0 16px ${currentTheme.colors.primary}40, 0 0 32px ${currentTheme.colors.primary}15`
            : currentTheme.decorations.shadowStyle,
          transform,
        };
      default:
        return base;
    }
  };

  const resizeHandleStyle = (cursor: string): React.CSSProperties => ({
    position: 'absolute',
    width: 12,
    height: 12,
    background: isSelected ? currentTheme.colors.primary : 'transparent',
    border: isSelected ? `2px solid ${currentTheme.colors.cardBg}` : 'none',
    borderRadius: 2,
    cursor,
    zIndex: 10,
    opacity: isSelected ? 0.7 : 0,
    transition: 'opacity 0.15s',
    touchAction: 'none',
  });

  return (
    <>
      <div
        ref={cardRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={getCardStyle()}
      >
        {isInStructure && (
          <div
            style={{
              position: 'absolute',
              top: -6,
              right: -6,
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: currentTheme.colors.primary,
              border: `2px solid ${currentTheme.colors.cardBg}`,
            }}
          />
        )}

        {card.locked && (
          <div style={{
            position: 'absolute',
            top: 4,
            right: 6,
            fontSize: '10px',
            opacity: 0.5,
            pointerEvents: 'none',
          }}>
            🔒
          </div>
        )}

        <CardContent
          card={card}
          isEditing={isEditing}
          onFinishEditing={() => setIsEditing(false)}
        />

        {card.metadata.tags.length > 0 && (
          <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
            {card.metadata.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: currentTheme.typography.fontSize.xs,
                  padding: '1px 6px',
                  borderRadius: '10px',
                  background: currentTheme.colors.accent + '40',
                  color: currentTheme.colors.textMuted,
                  fontFamily: currentTheme.typography.fontFamilyMono,
                }}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {hasChildren && (
          <CollapseIndicator
            cardId={card.id}
            collapsed={card.collapsed}
            hiddenCount={hiddenCount}
          />
        )}

        {/* Connection handle */}
        <div
          onPointerDown={(e) => {
            e.stopPropagation();
            startConnecting(card.id);
          }}
          style={{
            position: 'absolute',
            right: -8,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: currentTheme.colors.primary,
            border: `2px solid ${currentTheme.colors.cardBg}`,
            cursor: 'crosshair',
            opacity: isSelected || isHovered ? 0.8 : 0,
            transition: 'opacity 0.2s ease, transform 0.2s ease',
            touchAction: 'none',
          }}
        />

        {/* Resize handles */}
        <div style={{ ...resizeHandleStyle('nw-resize'), top: -4, left: -4 }} onPointerDown={(e) => handleResizeStart('nw', e)} />
        <div style={{ ...resizeHandleStyle('ne-resize'), top: -4, right: -4 }} onPointerDown={(e) => handleResizeStart('ne', e)} />
        <div style={{ ...resizeHandleStyle('sw-resize'), bottom: -4, left: -4 }} onPointerDown={(e) => handleResizeStart('sw', e)} />
        <div style={{ ...resizeHandleStyle('se-resize'), bottom: -4, right: -4 }} onPointerDown={(e) => handleResizeStart('se', e)} />
      </div>

      {showContextMenu && (
        <CardContextMenu
          card={card}
          position={contextMenuPos}
          onClose={() => setShowContextMenu(false)}
        />
      )}
    </>
  );
};

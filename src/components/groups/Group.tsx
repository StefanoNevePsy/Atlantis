import React, { useRef, useState, useCallback } from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { useThemeStore } from '../../store/themeStore';
import type { GroupData, Point } from '../../types';

interface Props {
  group: GroupData;
  isSelected: boolean;
  onConnect?: () => void;
}

export const Group: React.FC<Props> = ({ group, isSelected, onConnect }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const dragStart = useRef<Point>({ x: 0, y: 0 });
  const groupStart = useRef<Point>({ x: 0, y: 0 });

  const {
    selectGroup,
    moveGroup,
    updateGroup,
    removeGroup,
    toggleGroupCollapse,
    startConnecting,
    toolMode,
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
          startConnecting(group.id, 'group');
        }
        return;
      }

      selectGroup(group.id, e.shiftKey || e.ctrlKey || e.metaKey);
      setIsDragging(true);
      dragStart.current = { x: e.clientX, y: e.clientY };
      groupStart.current = { ...group.position };
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    },
    [group.id, group.position, selectGroup, startConnecting, toolMode, onConnect]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      e.stopPropagation();
      const dx = (e.clientX - dragStart.current.x) / viewport.zoom;
      const dy = (e.clientY - dragStart.current.y) / viewport.zoom;
      moveGroup(group.id, {
        x: groupStart.current.x + dx,
        y: groupStart.current.y + dy,
      });
    },
    [isDragging, group.id, moveGroup, viewport.zoom]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      e.stopPropagation();
      setIsDragging(false);
    },
    [isDragging]
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      // Simple: just remove group on right-click (could be a full context menu later)
    },
    []
  );

  const borderColor = isSelected ? currentTheme.colors.selectionStroke : group.color + '80';
  const bgColor = group.color + '10';

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onContextMenu={handleContextMenu}
      style={{
        position: 'absolute',
        left: group.position.x,
        top: group.position.y,
        width: group.collapsed ? 180 : group.size.width,
        height: group.collapsed ? 40 : group.size.height,
        border: `2px ${isSelected ? 'solid' : 'dashed'} ${borderColor}`,
        borderRadius: currentTheme.decorations.borderRadiusLg,
        background: bgColor,
        zIndex: group.zIndex,
        cursor: isDragging ? 'grabbing' : 'grab',
        transition: isDragging ? 'none' : 'width 0.2s ease, height 0.2s ease',
        pointerEvents: 'all',
        userSelect: 'none',
        overflow: 'visible',
      }}
    >
      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 10px',
          borderBottom: group.collapsed ? 'none' : `1px solid ${group.color}20`,
          minHeight: 28,
        }}
      >
        {/* Color dot */}
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: group.color,
            flexShrink: 0,
          }}
        />

        {/* Label */}
        {isEditingLabel ? (
          <input
            autoFocus
            value={group.label}
            onChange={(e) => updateGroup(group.id, { label: e.target.value })}
            onBlur={() => setIsEditingLabel(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === 'Escape') setIsEditingLabel(false);
            }}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            style={{
              flex: 1,
              border: `1px solid ${currentTheme.colors.border}40`,
              borderRadius: currentTheme.decorations.borderRadius,
              background: currentTheme.colors.surface,
              color: currentTheme.colors.text,
              fontFamily: currentTheme.typography.fontFamilyMono,
              fontSize: currentTheme.typography.fontSize.xs,
              padding: '1px 6px',
              outline: 'none',
            }}
          />
        ) : (
          <span
            onDoubleClick={(e) => {
              e.stopPropagation();
              setIsEditingLabel(true);
            }}
            style={{
              flex: 1,
              fontSize: currentTheme.typography.fontSize.xs,
              fontFamily: currentTheme.typography.fontFamilyMono,
              fontWeight: currentTheme.typography.fontWeightBold,
              color: group.color,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {group.label}
          </span>
        )}

        {/* Card count */}
        <span
          style={{
            fontSize: '10px',
            color: currentTheme.colors.textMuted,
            fontFamily: currentTheme.typography.fontFamilyMono,
          }}
        >
          {group.cardIds.length}
        </span>

        {/* Collapse button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleGroupCollapse(group.id);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          style={{
            border: 'none',
            background: 'transparent',
            color: currentTheme.colors.textMuted,
            cursor: 'pointer',
            fontSize: '12px',
            padding: '0 2px',
            lineHeight: 1,
          }}
          title={group.collapsed ? 'Expand group' : 'Collapse group'}
        >
          {group.collapsed ? '+' : '\u2212'}
        </button>

        {/* Delete button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            removeGroup(group.id);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          style={{
            border: 'none',
            background: 'transparent',
            color: currentTheme.colors.textMuted,
            cursor: 'pointer',
            fontSize: '12px',
            padding: '0 2px',
            lineHeight: 1,
            opacity: 0.5,
          }}
          title="Ungroup cards"
        >
          x
        </button>
      </div>

      {/* Connection handle */}
      <div
        onPointerDown={(e) => {
          e.stopPropagation();
          startConnecting(group.id, 'group');
        }}
        style={{
          position: 'absolute',
          right: -8,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: group.color,
          border: `2px solid ${currentTheme.colors.surface}`,
          cursor: 'crosshair',
          opacity: 0,
          transition: 'opacity 0.2s ease',
          zIndex: 10,
        }}
        onMouseEnter={(e) => {
          (e.target as HTMLElement).style.opacity = '1';
        }}
        onMouseLeave={(e) => {
          (e.target as HTMLElement).style.opacity = '0';
        }}
      />
    </div>
  );
};

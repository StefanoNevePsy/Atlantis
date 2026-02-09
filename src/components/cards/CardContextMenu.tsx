import React, { useEffect, useRef, useState } from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { useThemeStore } from '../../store/themeStore';
import type { CardData, Point } from '../../types';

interface Props {
  card: CardData;
  position: Point;
  onClose: () => void;
}

export const CardContextMenu: React.FC<Props> = ({ card, position, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [tagInput, setTagInput] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const {
    removeCard,
    updateCard,
    createStructure,
    detachFromStructure,
    addChildToStructure,
    startConnecting,
    toggleCollapse,
    removeCardFromGroup,
    groups,
  } = useCanvasStore();

  const { currentTheme } = useThemeStore();

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  const colors = [
    '#ffffff', '#fff3cd', '#d4edda', '#d1ecf1',
    '#f8d7da', '#e2d9f3', '#ffecd2', '#d1f2eb',
  ];

  const menuStyle: React.CSSProperties = {
    position: 'fixed',
    left: position.x,
    top: position.y,
    background: currentTheme.colors.surface,
    border: `${currentTheme.decorations.borderWidth} solid ${currentTheme.colors.border}`,
    borderRadius: currentTheme.decorations.borderRadius,
    boxShadow: currentTheme.decorations.shadowStyle,
    padding: 4,
    minWidth: 180,
    zIndex: 10000,
    fontFamily: currentTheme.typography.fontFamilyMono,
    fontSize: currentTheme.typography.fontSize.sm,
  };

  const itemStyle: React.CSSProperties = {
    display: 'block',
    width: '100%',
    padding: '6px 12px',
    border: 'none',
    background: 'transparent',
    color: currentTheme.colors.text,
    cursor: 'pointer',
    textAlign: 'left',
    fontFamily: 'inherit',
    fontSize: 'inherit',
    borderRadius: currentTheme.decorations.borderRadius,
  };

  const handleAddTag = () => {
    if (tagInput.trim()) {
      updateCard(card.id, {
        metadata: {
          ...card.metadata,
          tags: [...new Set([...card.metadata.tags, tagInput.trim()])],
        },
      });
      setTagInput('');
      setShowTagInput(false);
    }
  };

  return (
    <div ref={menuRef} style={menuStyle}>
      {/* Structure actions */}
      {!card.structureId && (
        <button
          style={itemStyle}
          onClick={() => {
            createStructure(card.id, 'mindmap');
            onClose();
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLElement).style.background = currentTheme.colors.surfaceHover;
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLElement).style.background = 'transparent';
          }}
        >
          Make Root (Mind Map)
        </button>
      )}

      {card.structureId && (
        <>
          <button
            style={itemStyle}
            onClick={() => {
              addChildToStructure(card.id);
              onClose();
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.background = currentTheme.colors.surfaceHover;
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.background = 'transparent';
            }}
          >
            Add Child (Tab)
          </button>

          {card.childrenIds.length > 0 && (
            <button
              style={itemStyle}
              onClick={() => {
                toggleCollapse(card.id);
                onClose();
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.background = currentTheme.colors.surfaceHover;
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.background = 'transparent';
              }}
            >
              {card.collapsed ? 'Expand' : 'Collapse'}
            </button>
          )}

          {!card.isRoot && (
            <button
              style={itemStyle}
              onClick={() => {
                detachFromStructure(card.id);
                onClose();
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.background = currentTheme.colors.surfaceHover;
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.background = 'transparent';
              }}
            >
              Detach from Structure
            </button>
          )}
        </>
      )}

      <button
        style={itemStyle}
        onClick={() => {
          startConnecting(card.id);
          onClose();
        }}
        onMouseEnter={(e) => {
          (e.target as HTMLElement).style.background = currentTheme.colors.surfaceHover;
        }}
        onMouseLeave={(e) => {
          (e.target as HTMLElement).style.background = 'transparent';
        }}
      >
        Connect to...
      </button>

      {/* Group actions */}
      {card.groupId && groups[card.groupId] && (
        <button
          style={itemStyle}
          onClick={() => {
            removeCardFromGroup(card.groupId!, card.id);
            onClose();
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLElement).style.background = currentTheme.colors.surfaceHover;
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLElement).style.background = 'transparent';
          }}
        >
          Remove from &quot;{groups[card.groupId].label}&quot;
        </button>
      )}

      <div style={{ height: 1, background: currentTheme.colors.border + '30', margin: '4px 0' }} />

      {/* Tags */}
      <button
        style={itemStyle}
        onClick={() => setShowTagInput(!showTagInput)}
        onMouseEnter={(e) => {
          (e.target as HTMLElement).style.background = currentTheme.colors.surfaceHover;
        }}
        onMouseLeave={(e) => {
          (e.target as HTMLElement).style.background = 'transparent';
        }}
      >
        Add Tag
      </button>
      {showTagInput && (
        <div style={{ padding: '4px 12px', display: 'flex', gap: 4 }}>
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
            placeholder="tag name"
            autoFocus
            style={{
              flex: 1,
              border: `1px solid ${currentTheme.colors.border}`,
              borderRadius: currentTheme.decorations.borderRadius,
              padding: '2px 6px',
              fontSize: currentTheme.typography.fontSize.xs,
              background: currentTheme.colors.background,
              color: currentTheme.colors.text,
              outline: 'none',
            }}
          />
        </div>
      )}

      {/* Color */}
      <button
        style={itemStyle}
        onClick={() => setShowColorPicker(!showColorPicker)}
        onMouseEnter={(e) => {
          (e.target as HTMLElement).style.background = currentTheme.colors.surfaceHover;
        }}
        onMouseLeave={(e) => {
          (e.target as HTMLElement).style.background = 'transparent';
        }}
      >
        Color
      </button>
      {showColorPicker && (
        <div style={{ padding: '4px 12px', display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {colors.map((c) => (
            <button
              key={c}
              onClick={() => {
                updateCard(card.id, { metadata: { ...card.metadata, color: c } });
                setShowColorPicker(false);
              }}
              style={{
                width: 20,
                height: 20,
                background: c,
                border: `2px solid ${card.metadata.color === c ? currentTheme.colors.primary : currentTheme.colors.border}`,
                borderRadius: '50%',
                cursor: 'pointer',
                padding: 0,
              }}
            />
          ))}
        </div>
      )}

      <div style={{ height: 1, background: currentTheme.colors.border + '30', margin: '4px 0' }} />

      {/* Info */}
      <div
        style={{
          padding: '4px 12px',
          fontSize: currentTheme.typography.fontSize.xs,
          color: currentTheme.colors.textMuted,
        }}
      >
        Created: {new Date(card.metadata.createdAt).toLocaleDateString()}
      </div>

      <div style={{ height: 1, background: currentTheme.colors.border + '30', margin: '4px 0' }} />

      {/* Delete */}
      <button
        style={{ ...itemStyle, color: currentTheme.colors.danger }}
        onClick={() => {
          removeCard(card.id);
          onClose();
        }}
        onMouseEnter={(e) => {
          (e.target as HTMLElement).style.background = currentTheme.colors.danger + '20';
        }}
        onMouseLeave={(e) => {
          (e.target as HTMLElement).style.background = 'transparent';
        }}
      >
        Delete
      </button>
    </div>
  );
};

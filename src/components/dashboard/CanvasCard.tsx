import React, { useState } from 'react';
import { useThemeStore } from '../../store/themeStore';
import type { CanvasData } from '../../types';

interface Props {
  canvas: CanvasData;
  viewMode: 'grid' | 'list';
  onOpen: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

export const CanvasCard: React.FC<Props> = ({
  canvas,
  viewMode,
  onOpen,
  onDelete,
  onDuplicate,
}) => {
  const { currentTheme } = useThemeStore();
  const [showMenu, setShowMenu] = useState(false);

  const cardCount = Object.keys(canvas.cards).length;
  const connectionCount = Object.keys(canvas.connections).length;
  const timeAgo = getTimeAgo(canvas.updatedAt);

  if (viewMode === 'list') {
    return (
      <div
        onClick={onOpen}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '10px 16px',
          border: `1px solid ${currentTheme.colors.border}20`,
          borderRadius: currentTheme.decorations.borderRadius,
          background: currentTheme.colors.surface,
          cursor: 'pointer',
          gap: 16,
          transition: 'background 0.15s ease',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = currentTheme.colors.surfaceHover;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = currentTheme.colors.surface;
        }}
      >
        {/* Mini preview */}
        <div
          style={{
            width: 48,
            height: 36,
            borderRadius: currentTheme.decorations.borderRadius,
            background: canvas.backgroundColor,
            border: `1px solid ${currentTheme.colors.border}20`,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            color: currentTheme.colors.textMuted,
          }}
        >
          {cardCount > 0 ? `${cardCount}` : '~'}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: currentTheme.typography.fontSize.md,
              fontWeight: currentTheme.typography.fontWeightBold,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {canvas.name}
          </div>
          <div
            style={{
              fontSize: currentTheme.typography.fontSize.xs,
              color: currentTheme.colors.textMuted,
            }}
          >
            {cardCount} cards, {connectionCount} connections
          </div>
        </div>

        {/* Tags */}
        <div style={{ display: 'flex', gap: 4 }}>
          {canvas.tags
            .filter((t) => !t.startsWith('_'))
            .slice(0, 3)
            .map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: '10px',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  background: currentTheme.colors.accent + '30',
                  color: currentTheme.colors.textMuted,
                  fontFamily: currentTheme.typography.fontFamilyMono,
                }}
              >
                #{tag}
              </span>
            ))}
        </div>

        <span
          style={{
            fontSize: currentTheme.typography.fontSize.xs,
            color: currentTheme.colors.textMuted,
            flexShrink: 0,
          }}
        >
          {timeAgo}
        </span>

        {/* Actions */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            style={{
              border: 'none',
              background: 'transparent',
              color: currentTheme.colors.textMuted,
              cursor: 'pointer',
              padding: '2px 6px',
              fontSize: '16px',
            }}
          >
            ...
          </button>
          {showMenu && (
            <ContextMenu
              onDuplicate={onDuplicate}
              onDelete={onDelete}
              onClose={() => setShowMenu(false)}
            />
          )}
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div
      onClick={onOpen}
      style={{
        border: `${currentTheme.decorations.borderWidth} solid ${currentTheme.colors.border}`,
        borderRadius: currentTheme.decorations.borderRadiusLg,
        background: currentTheme.colors.surface,
        cursor: 'pointer',
        overflow: 'hidden',
        boxShadow: currentTheme.decorations.shadowStyle,
        transition: 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.15s ease',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = 'none';
      }}
    >
      {/* Preview area */}
      <div
        style={{
          height: 140,
          background: canvas.backgroundColor,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Mini card representations */}
        {Object.values(canvas.cards)
          .slice(0, 6)
          .map((card, i) => (
            <div
              key={card.id}
              style={{
                position: 'absolute',
                left: `${15 + (i % 3) * 30}%`,
                top: `${15 + Math.floor(i / 3) * 40}%`,
                width: 50,
                height: 25,
                background: currentTheme.colors.cardBg,
                border: `1px solid ${currentTheme.colors.cardBorder}40`,
                borderRadius: '2px',
                boxShadow: '1px 1px 0px rgba(0,0,0,0.1)',
              }}
            />
          ))}
        {cardCount === 0 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: currentTheme.typography.fontSize.xxl,
              color: currentTheme.colors.textMuted + '40',
            }}
          >
            ~
          </div>
        )}

        {/* Actions overlay */}
        <div
          style={{ position: 'absolute', top: 6, right: 6 }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            style={{
              border: 'none',
              background: currentTheme.colors.surface + 'cc',
              color: currentTheme.colors.textMuted,
              cursor: 'pointer',
              padding: '2px 8px',
              borderRadius: currentTheme.decorations.borderRadius,
              fontSize: '14px',
              backdropFilter: 'blur(4px)',
            }}
          >
            ...
          </button>
          {showMenu && (
            <ContextMenu
              onDuplicate={onDuplicate}
              onDelete={onDelete}
              onClose={() => setShowMenu(false)}
            />
          )}
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '10px 14px' }}>
        <div
          style={{
            fontSize: currentTheme.typography.fontSize.md,
            fontWeight: currentTheme.typography.fontWeightBold,
            marginBottom: 4,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {canvas.name}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: currentTheme.typography.fontSize.xs,
            color: currentTheme.colors.textMuted,
          }}
        >
          <span>
            {cardCount} card{cardCount !== 1 ? 's' : ''}
          </span>
          <span>{timeAgo}</span>
        </div>
        {canvas.tags.filter((t) => !t.startsWith('_')).length > 0 && (
          <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
            {canvas.tags
              .filter((t) => !t.startsWith('_'))
              .slice(0, 3)
              .map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: '10px',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    background: currentTheme.colors.accent + '30',
                    color: currentTheme.colors.textMuted,
                    fontFamily: currentTheme.typography.fontFamilyMono,
                  }}
                >
                  #{tag}
                </span>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Context menu sub-component
const ContextMenu: React.FC<{
  onDuplicate: () => void;
  onDelete: () => void;
  onClose: () => void;
}> = ({ onDuplicate, onDelete, onClose }) => {
  const { currentTheme } = useThemeStore();

  React.useEffect(() => {
    const handler = () => onClose();
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [onClose]);

  const itemStyle: React.CSSProperties = {
    display: 'block',
    width: '100%',
    padding: '6px 12px',
    border: 'none',
    background: 'transparent',
    color: currentTheme.colors.text,
    cursor: 'pointer',
    textAlign: 'left',
    fontFamily: currentTheme.typography.fontFamilyMono,
    fontSize: currentTheme.typography.fontSize.xs,
    borderRadius: currentTheme.decorations.borderRadius,
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'absolute',
        top: '100%',
        right: 0,
        marginTop: 4,
        background: currentTheme.colors.surface,
        border: `${currentTheme.decorations.borderWidth} solid ${currentTheme.colors.border}`,
        borderRadius: currentTheme.decorations.borderRadius,
        boxShadow: currentTheme.decorations.shadowStyle,
        padding: 4,
        minWidth: 120,
        zIndex: 100,
      }}
    >
      <button
        style={itemStyle}
        onClick={(e) => {
          e.stopPropagation();
          onDuplicate();
          onClose();
        }}
        onMouseEnter={(e) => {
          (e.target as HTMLElement).style.background = currentTheme.colors.surfaceHover;
        }}
        onMouseLeave={(e) => {
          (e.target as HTMLElement).style.background = 'transparent';
        }}
      >
        Duplicate
      </button>
      <button
        style={{ ...itemStyle, color: currentTheme.colors.danger }}
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
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

function getTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

import React, { useRef, useEffect, useCallback } from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { useThemeStore } from '../../store/themeStore';
import type { CardData } from '../../types';

interface Props {
  card: CardData;
  isEditing: boolean;
  onFinishEditing: () => void;
}

export const CardContent: React.FC<Props> = ({ card, isEditing, onFinishEditing }) => {
  const textRef = useRef<HTMLTextAreaElement>(null);
  const { updateCard } = useCanvasStore();
  const { currentTheme } = useThemeStore();

  useEffect(() => {
    if (isEditing && textRef.current) {
      textRef.current.focus();
      textRef.current.select();
    }
  }, [isEditing]);

  const handleBlur = useCallback(() => {
    onFinishEditing();
  }, [onFinishEditing]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onFinishEditing();
      }
    },
    [onFinishEditing]
  );

  const autoResize = useCallback(() => {
    const el = textRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
    // Update card size
    const rect = el.parentElement?.getBoundingClientRect();
    if (rect) {
      updateCard(card.id, {
        size: {
          width: Math.max(120, rect.width),
          height: Math.max(40, rect.height),
        },
      });
    }
  }, [card.id, updateCard]);

  switch (card.contentType) {
    case 'text':
      if (isEditing) {
        return (
          <textarea
            ref={textRef}
            value={card.content}
            onChange={(e) => {
              updateCard(card.id, { content: e.target.value });
              autoResize();
            }}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            style={{
              width: '100%',
              minHeight: 30,
              border: 'none',
              outline: 'none',
              resize: 'none',
              background: 'transparent',
              color: currentTheme.colors.text,
              fontFamily: currentTheme.typography.fontFamily,
              fontSize: currentTheme.typography.fontSize.md,
              lineHeight: currentTheme.typography.lineHeight,
              overflow: 'hidden',
            }}
            placeholder="Type something..."
          />
        );
      }
      return (
        <div
          style={{
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            lineHeight: currentTheme.typography.lineHeight,
            minHeight: 20,
            color: card.content ? currentTheme.colors.text : currentTheme.colors.textMuted,
          }}
        >
          {card.content || 'Double-click to edit...'}
        </div>
      );

    case 'image':
      return (
        <div style={{ maxWidth: 360 }}>
          <img
            src={card.content}
            alt="card image"
            style={{
              width: '100%',
              borderRadius: currentTheme.decorations.borderRadius,
              display: 'block',
            }}
            draggable={false}
          />
        </div>
      );

    case 'url':
      return (
        <div>
          <a
            href={card.content}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: currentTheme.colors.primary,
              textDecoration: 'underline',
              fontFamily: currentTheme.typography.fontFamilyMono,
              fontSize: currentTheme.typography.fontSize.sm,
              wordBreak: 'break-all',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {card.content}
          </a>
          <div
            style={{
              marginTop: 6,
              padding: '6px 8px',
              background: currentTheme.colors.surface,
              borderRadius: currentTheme.decorations.borderRadius,
              fontSize: currentTheme.typography.fontSize.xs,
              color: currentTheme.colors.textMuted,
            }}
          >
            {new URL(card.content).hostname}
          </div>
        </div>
      );

    case 'audio':
      return (
        <div>
          <div
            style={{
              fontSize: currentTheme.typography.fontSize.xs,
              color: currentTheme.colors.textMuted,
              marginBottom: 4,
            }}
          >
            Audio
          </div>
          <audio
            controls
            src={card.content}
            style={{ width: '100%', maxWidth: 280 }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      );

    case 'video':
      return (
        <div>
          <video
            controls
            src={card.content}
            style={{
              width: '100%',
              maxWidth: 320,
              borderRadius: currentTheme.decorations.borderRadius,
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      );

    default:
      return <div>{card.content}</div>;
  }
};

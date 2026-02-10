import React, { useRef, useEffect, useCallback } from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { useThemeStore } from '../../store/themeStore';
import { useSyncStore } from '../../store/syncStore';
import { renderMarkdown } from '../../utils/markdown';
import { detectEmbed, getYouTubeId, isUrl } from '../../utils/embeds';
import { uploadToImgur, fileToBase64 } from '../../utils/imgur';
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
  const { imgurClientId } = useSyncStore();

  useEffect(() => {
    if (isEditing && textRef.current) {
      textRef.current.focus();
      // Move cursor to end
      const len = textRef.current.value.length;
      textRef.current.setSelectionRange(len, len);
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
      // Prevent card drag when editing
      e.stopPropagation();
    },
    [onFinishEditing]
  );

  const autoResize = useCallback(() => {
    const el = textRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }, []);

  // Insert markdown formatting at cursor
  const insertFormat = useCallback((prefix: string, suffix: string = '') => {
    const el = textRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = el.value;
    const selected = text.slice(start, end);
    const newText = text.slice(0, start) + prefix + selected + suffix + text.slice(end);
    updateCard(card.id, { content: newText });
    // Restore cursor position after the prefix
    requestAnimationFrame(() => {
      if (textRef.current) {
        const pos = start + prefix.length + selected.length + suffix.length;
        textRef.current.setSelectionRange(pos, pos);
        textRef.current.focus();
      }
    });
  }, [card.id, updateCard]);

  // Handle image paste/drop in editor
  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) return;
        if (imgurClientId) {
          const base64 = await fileToBase64(file);
          const result = await uploadToImgur(base64, imgurClientId);
          if (result.success && result.url) {
            updateCard(card.id, { imageUrl: result.url });
          }
        } else {
          // Fallback to data URL
          const reader = new FileReader();
          reader.onload = () => {
            updateCard(card.id, { imageUrl: reader.result as string });
          };
          reader.readAsDataURL(file);
        }
        return;
      }
    }
  }, [card.id, updateCard, imgurClientId]);

  // Remove embedded image
  const removeImage = useCallback(() => {
    updateCard(card.id, { imageUrl: undefined });
  }, [card.id, updateCard]);

  // Remove embed
  const removeEmbed = useCallback(() => {
    updateCard(card.id, { embedUrl: undefined });
  }, [card.id, updateCard]);

  // Auto-detect URLs in content and offer embed
  const handleContentChange = useCallback((newContent: string) => {
    updateCard(card.id, { content: newContent });

    // Auto-detect URL in content for embedding
    const lines = newContent.split('\n');
    const lastLine = lines[lines.length - 1]?.trim();
    if (lastLine && isUrl(lastLine) && !card.embedUrl) {
      const embed = detectEmbed(lastLine);
      if (embed && (embed.type === 'youtube' || embed.type === 'gif')) {
        updateCard(card.id, { embedUrl: lastLine });
      }
    }

    autoResize();
  }, [card.id, updateCard, card.embedUrl, autoResize]);

  const markdownStyles = `
    .md-content h2 { font-size: 1.3em; font-weight: 700; margin: 4px 0 2px; }
    .md-content h3 { font-size: 1.1em; font-weight: 600; margin: 3px 0 2px; }
    .md-content h4 { font-size: 1em; font-weight: 600; margin: 2px 0 1px; }
    .md-content p { margin: 2px 0; }
    .md-content ul, .md-content ol { margin: 2px 0; padding-left: 18px; }
    .md-content li { margin: 1px 0; }
    .md-content code { background: ${currentTheme.colors.surface}; padding: 1px 4px; border-radius: 3px; font-family: ${currentTheme.typography.fontFamilyMono}; font-size: 0.9em; }
    .md-content strong { font-weight: 700; }
    .md-content em { font-style: italic; }
    .md-content del { text-decoration: line-through; opacity: 0.6; }
    .md-content a { color: ${currentTheme.colors.primary}; text-decoration: underline; }
    .md-content hr { border: none; border-top: 1px solid ${currentTheme.colors.border}40; margin: 6px 0; }
    .md-content br { display: block; margin: 2px 0; content: ""; }
    .md-content .md-checkbox { margin: 2px 0; cursor: pointer; }
    .md-content .md-check { font-size: 1.1em; margin-right: 4px; }
    .md-content .md-check.checked { color: ${currentTheme.colors.success}; }
  `;

  // Format toolbar for editing mode
  const FormatBar = () => (
    <div
      style={{
        display: 'flex',
        gap: 2,
        marginBottom: 4,
        flexWrap: 'wrap',
      }}
    >
      {[
        { label: 'H1', action: () => insertFormat('# ', '') },
        { label: 'H2', action: () => insertFormat('## ', '') },
        { label: 'B', action: () => insertFormat('**', '**'), style: { fontWeight: 700 } as React.CSSProperties },
        { label: 'I', action: () => insertFormat('*', '*'), style: { fontStyle: 'italic' } as React.CSSProperties },
        { label: 'S', action: () => insertFormat('~~', '~~'), style: { textDecoration: 'line-through' } as React.CSSProperties },
        { label: '•', action: () => insertFormat('- ', '') },
        { label: '1.', action: () => insertFormat('1. ', '') },
        { label: '`', action: () => insertFormat('`', '`') },
        { label: '☐', action: () => insertFormat('- [ ] ', '') },
        { label: '—', action: () => insertFormat('\n---\n', '') },
      ].map((btn) => (
        <button
          key={btn.label}
          onMouseDown={(e) => { e.preventDefault(); btn.action(); }}
          style={{
            padding: '1px 5px',
            border: `1px solid ${currentTheme.colors.border}40`,
            borderRadius: 3,
            background: currentTheme.colors.surface,
            color: currentTheme.colors.textMuted,
            cursor: 'pointer',
            fontSize: currentTheme.typography.fontSize.xs,
            fontFamily: currentTheme.typography.fontFamilyMono,
            lineHeight: '16px',
            minWidth: 22,
            ...btn.style,
          }}
        >
          {btn.label}
        </button>
      ))}
    </div>
  );

  // Render embed section (YouTube, GIF, webpage)
  const EmbedSection = () => {
    const url = card.embedUrl;
    if (!url) return null;

    const embed = detectEmbed(url);
    if (!embed) return null;

    return (
      <div style={{ marginTop: 6, position: 'relative' }}>
        {/* Remove embed button */}
        <button
          onClick={(e) => { e.stopPropagation(); removeEmbed(); }}
          style={{
            position: 'absolute',
            top: 4,
            right: 4,
            zIndex: 2,
            width: 20,
            height: 20,
            border: 'none',
            borderRadius: '50%',
            background: currentTheme.colors.surface + 'cc',
            color: currentTheme.colors.textMuted,
            cursor: 'pointer',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ×
        </button>

        {embed.type === 'youtube' && (
          <div style={{
            position: 'relative',
            paddingBottom: '56.25%',
            height: 0,
            borderRadius: currentTheme.decorations.borderRadius,
            overflow: 'hidden',
          }}>
            <iframe
              src={embed.embedUrl}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                border: 'none',
              }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        {embed.type === 'gif' && (
          <img
            src={embed.embedUrl}
            alt="GIF"
            style={{
              width: '100%',
              borderRadius: currentTheme.decorations.borderRadius,
              display: 'block',
            }}
            draggable={false}
          />
        )}

        {embed.type === 'image' && (
          <img
            src={embed.embedUrl}
            alt="Embedded image"
            style={{
              width: '100%',
              borderRadius: currentTheme.decorations.borderRadius,
              display: 'block',
            }}
            draggable={false}
          />
        )}

        {embed.type === 'webpage' && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 8px',
              background: currentTheme.colors.surface,
              borderRadius: currentTheme.decorations.borderRadius,
              border: `1px solid ${currentTheme.colors.border}30`,
              textDecoration: 'none',
              color: currentTheme.colors.text,
              fontSize: currentTheme.typography.fontSize.sm,
            }}
          >
            <span style={{ fontSize: '16px' }}>🔗</span>
            <span style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              color: currentTheme.colors.primary,
            }}>
              {embed.title || url}
            </span>
          </a>
        )}
      </div>
    );
  };

  // Image section (shown on all card types when imageUrl is set)
  const ImageSection = () => {
    if (!card.imageUrl) return null;
    return (
      <div style={{ marginTop: 6, position: 'relative' }}>
        <button
          onClick={(e) => { e.stopPropagation(); removeImage(); }}
          style={{
            position: 'absolute',
            top: 4,
            right: 4,
            zIndex: 2,
            width: 20,
            height: 20,
            border: 'none',
            borderRadius: '50%',
            background: currentTheme.colors.surface + 'cc',
            color: currentTheme.colors.textMuted,
            cursor: 'pointer',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ×
        </button>
        <img
          src={card.imageUrl}
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
  };

  // EDITING MODE
  if (isEditing) {
    return (
      <div onPaste={handlePaste}>
        <FormatBar />
        <textarea
          ref={textRef}
          value={card.content}
          onChange={(e) => handleContentChange(e.target.value)}
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
            fontFamily: currentTheme.typography.fontFamilyMono,
            fontSize: currentTheme.typography.fontSize.sm,
            lineHeight: currentTheme.typography.lineHeight,
            overflow: 'hidden',
          }}
          placeholder="Type something... (supports markdown)"
        />

        {/* Embed URL input */}
        <div style={{ marginTop: 4 }}>
          <input
            placeholder="Paste URL to embed (YouTube, GIF, image...)"
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === 'Enter') {
                const val = (e.target as HTMLInputElement).value.trim();
                if (val && isUrl(val)) {
                  updateCard(card.id, { embedUrl: val });
                  (e.target as HTMLInputElement).value = '';
                }
              }
            }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              border: `1px dashed ${currentTheme.colors.border}40`,
              borderRadius: currentTheme.decorations.borderRadius,
              background: 'transparent',
              color: currentTheme.colors.textMuted,
              fontSize: currentTheme.typography.fontSize.xs,
              fontFamily: currentTheme.typography.fontFamilyMono,
              padding: '3px 6px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <ImageSection />
        <EmbedSection />
      </div>
    );
  }

  // DISPLAY MODE - Render based on content type
  switch (card.contentType) {
    case 'text':
      return (
        <div>
          <style>{markdownStyles}</style>
          {card.content ? (
            <div
              className="md-content"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(card.content) }}
              style={{
                wordBreak: 'break-word',
                lineHeight: currentTheme.typography.lineHeight,
                color: currentTheme.colors.text,
              }}
              onClick={(e) => {
                const target = e.target as HTMLElement;
                // Allow clicking links without entering edit mode
                if (target.tagName === 'A') {
                  e.stopPropagation();
                }
                // Toggle checkboxes
                if (target.classList.contains('md-check') || target.closest('.md-checkbox')) {
                  e.stopPropagation();
                  const checkEl = target.classList.contains('md-check') ? target : target.querySelector('.md-check');
                  if (!checkEl) return;
                  const isChecked = checkEl.classList.contains('checked');
                  // Find and toggle in source text
                  const lines = card.content.split('\n');
                  const checkboxDiv = target.closest('.md-checkbox');
                  if (!checkboxDiv) return;
                  const allCheckboxes = checkboxDiv.parentElement?.querySelectorAll('.md-checkbox');
                  if (!allCheckboxes) return;
                  const idx = Array.from(allCheckboxes).indexOf(checkboxDiv);
                  let checkboxCount = 0;
                  for (let i = 0; i < lines.length; i++) {
                    if (/^- \[[ x]\] /.test(lines[i].trim())) {
                      if (checkboxCount === idx) {
                        lines[i] = isChecked
                          ? lines[i].replace('- [x] ', '- [ ] ')
                          : lines[i].replace('- [ ] ', '- [x] ');
                        break;
                      }
                      checkboxCount++;
                    }
                  }
                  updateCard(card.id, { content: lines.join('\n') });
                }
              }}
            />
          ) : (
            <div style={{
              color: currentTheme.colors.textMuted,
              minHeight: 20,
            }}>
              Double-click to edit...
            </div>
          )}
          <ImageSection />
          <EmbedSection />
        </div>
      );

    case 'image':
      return (
        <div>
          <img
            src={card.content}
            alt="card image"
            style={{
              width: '100%',
              borderRadius: currentTheme.decorations.borderRadius,
              display: 'block',
              maxWidth: 360,
            }}
            draggable={false}
          />
          {/* Allow text overlay on image cards */}
          {card.imageUrl && card.imageUrl !== card.content && <ImageSection />}
          <EmbedSection />
        </div>
      );

    case 'url': {
      const embed = detectEmbed(card.content);
      const ytId = getYouTubeId(card.content);

      return (
        <div>
          {ytId ? (
            // YouTube embed
            <div style={{
              position: 'relative',
              paddingBottom: '56.25%',
              height: 0,
              borderRadius: currentTheme.decorations.borderRadius,
              overflow: 'hidden',
              marginBottom: 6,
            }}>
              <iframe
                src={`https://www.youtube.com/embed/${ytId}`}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  border: 'none',
                }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          ) : embed?.type === 'gif' || embed?.type === 'image' ? (
            // GIF or image URL
            <img
              src={card.content}
              alt="embed"
              style={{
                width: '100%',
                borderRadius: currentTheme.decorations.borderRadius,
                display: 'block',
                marginBottom: 6,
              }}
              draggable={false}
            />
          ) : (
            // Generic URL with preview
            <a
              href={card.content}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 10px',
                background: currentTheme.colors.surface,
                borderRadius: currentTheme.decorations.borderRadius,
                border: `1px solid ${currentTheme.colors.border}30`,
                textDecoration: 'none',
                color: currentTheme.colors.text,
                fontSize: currentTheme.typography.fontSize.sm,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <span style={{ fontSize: '18px', opacity: 0.7 }}>🔗</span>
              <div style={{ overflow: 'hidden', flex: 1 }}>
                <div style={{
                  color: currentTheme.colors.primary,
                  fontWeight: 600,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {(() => { try { return new URL(card.content).hostname; } catch { return card.content; } })()}
                </div>
                <div style={{
                  fontSize: currentTheme.typography.fontSize.xs,
                  color: currentTheme.colors.textMuted,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {card.content}
                </div>
              </div>
            </a>
          )}
          <ImageSection />
          <EmbedSection />
        </div>
      );
    }

    case 'audio':
      return (
        <div>
          <div style={{
            fontSize: currentTheme.typography.fontSize.xs,
            color: currentTheme.colors.textMuted,
            marginBottom: 4,
          }}>
            Audio
          </div>
          <audio
            controls
            src={card.content}
            style={{ width: '100%', maxWidth: 280 }}
            onClick={(e) => e.stopPropagation()}
          />
          <ImageSection />
          <EmbedSection />
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
          <ImageSection />
          <EmbedSection />
        </div>
      );

    default:
      return (
        <div>
          {card.content}
          <ImageSection />
          <EmbedSection />
        </div>
      );
  }
};

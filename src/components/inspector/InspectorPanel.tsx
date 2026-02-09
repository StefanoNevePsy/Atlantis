import React from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { useThemeStore } from '../../store/themeStore';
import type { ConnectionDirection, LineStyle } from '../../types';

const COLOR_PALETTES = {
  base: ['#ffffff', '#f5f5f5', '#e0e0e0', '#9e9e9e', '#616161', '#212121', '#000000'],
  warm: ['#fff3e0', '#ffe0b2', '#ffcc80', '#ff9800', '#f57c00', '#e65100'],
  cool: ['#e3f2fd', '#90caf9', '#42a5f5', '#1e88e5', '#1565c0', '#0d47a1'],
  nature: ['#e8f5e9', '#a5d6a7', '#66bb6a', '#43a047', '#2e7d32', '#1b5e20'],
  pastel: ['#fce4ec', '#f8bbd0', '#ce93d8', '#b39ddb', '#90caf9', '#80deea', '#a5d6a7', '#fff59d'],
  vibrant: ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#00bcd4', '#4caf50', '#ff9800', '#ff5722'],
};

const FONT_OPTIONS = [
  { label: 'Default', value: '' },
  { label: 'Sans-serif', value: 'system-ui, -apple-system, sans-serif' },
  { label: 'Serif', value: 'Georgia, Cambria, serif' },
  { label: 'Monospace', value: 'JetBrains Mono, Fira Code, monospace' },
  { label: 'Handwritten', value: 'Comic Sans MS, cursive' },
];

const LINE_STYLES: { label: string; value: LineStyle; preview: string }[] = [
  { label: 'Solid', value: 'solid', preview: '———' },
  { label: 'Dashed', value: 'dashed', preview: '- - -' },
  { label: 'Dotted', value: 'dotted', preview: '...' },
];

const DIRECTIONS: { label: string; value: ConnectionDirection; icon: string }[] = [
  { label: 'None', value: 'none', icon: '—' },
  { label: 'Forward', value: 'forward', icon: '→' },
  { label: 'Backward', value: 'backward', icon: '←' },
  { label: 'Both', value: 'bidirectional', icon: '↔' },
];

export const InspectorPanel: React.FC = () => {
  const {
    selectedCardIds,
    selectedGroupIds,
    selectedConnectionIds,
    cards,
    groups,
    connections,
    updateCard,
    updateGroup,
    updateConnection,
  } = useCanvasStore();
  const { currentTheme } = useThemeStore();

  const selectedCardId = selectedCardIds.size === 1 ? Array.from(selectedCardIds)[0] : null;
  const selectedGroupId = selectedGroupIds.size === 1 ? Array.from(selectedGroupIds)[0] : null;
  const selectedConnId = selectedConnectionIds.size === 1 ? Array.from(selectedConnectionIds)[0] : null;

  const card = selectedCardId ? cards[selectedCardId] : null;
  const group = selectedGroupId ? groups[selectedGroupId] : null;
  const conn = selectedConnId ? connections[selectedConnId] : null;

  // Nothing selected
  if (!card && !group && !conn) return null;

  const panelStyle: React.CSSProperties = {
    position: 'absolute',
    top: 60,
    right: 12,
    width: 240,
    maxHeight: 'calc(100vh - 80px)',
    overflowY: 'auto',
    zIndex: 1000,
    background: currentTheme.colors.surface + 'f5',
    border: `${currentTheme.decorations.borderWidth} solid ${currentTheme.colors.border}`,
    borderRadius: currentTheme.decorations.borderRadiusLg,
    boxShadow: currentTheme.decorations.shadowStyle,
    backdropFilter: 'blur(12px)',
    padding: 12,
    fontFamily: currentTheme.typography.fontFamily,
    fontSize: currentTheme.typography.fontSize.sm,
    color: currentTheme.colors.text,
  };

  const sectionStyle: React.CSSProperties = {
    marginBottom: 12,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: currentTheme.typography.fontSize.xs,
    color: currentTheme.colors.textMuted,
    marginBottom: 4,
    display: 'block',
    fontFamily: currentTheme.typography.fontFamilyMono,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  };

  const swatchContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 4,
  };

  const renderColorSwatch = (
    color: string,
    isActive: boolean,
    onClick: () => void
  ) => (
    <button
      key={color}
      onClick={onClick}
      style={{
        width: 20,
        height: 20,
        borderRadius: '4px',
        background: color,
        border: isActive
          ? `2px solid ${currentTheme.colors.primary}`
          : `1px solid ${currentTheme.colors.border}40`,
        cursor: 'pointer',
        padding: 0,
        outline: isActive ? `1px solid ${currentTheme.colors.primary}` : 'none',
        outlineOffset: 1,
      }}
      title={color}
    />
  );

  const renderColorSection = (
    label: string,
    currentColor: string | undefined,
    onChange: (color: string) => void
  ) => (
    <div style={sectionStyle}>
      <span style={labelStyle}>{label}</span>
      {Object.entries(COLOR_PALETTES).map(([paletteName, colors]) => (
        <div key={paletteName} style={{ ...swatchContainerStyle, marginBottom: 4 }}>
          {colors.map((c) => renderColorSwatch(c, currentColor === c, () => onChange(c)))}
        </div>
      ))}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
        <input
          type="color"
          value={currentColor || '#000000'}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: 24, height: 24, border: 'none', padding: 0, cursor: 'pointer', borderRadius: 4 }}
        />
        <input
          type="text"
          value={currentColor || ''}
          placeholder="Custom..."
          onChange={(e) => onChange(e.target.value)}
          style={{
            flex: 1,
            border: `1px solid ${currentTheme.colors.border}40`,
            borderRadius: currentTheme.decorations.borderRadius,
            background: currentTheme.colors.surface,
            color: currentTheme.colors.text,
            fontSize: currentTheme.typography.fontSize.xs,
            fontFamily: currentTheme.typography.fontFamilyMono,
            padding: '2px 6px',
            outline: 'none',
          }}
        />
      </div>
    </div>
  );

  const selectStyle: React.CSSProperties = {
    width: '100%',
    border: `1px solid ${currentTheme.colors.border}40`,
    borderRadius: currentTheme.decorations.borderRadius,
    background: currentTheme.colors.surface,
    color: currentTheme.colors.text,
    fontSize: currentTheme.typography.fontSize.xs,
    fontFamily: currentTheme.typography.fontFamilyMono,
    padding: '4px 6px',
    outline: 'none',
    cursor: 'pointer',
  };

  // ─── Card Inspector ─────────────
  if (card) {
    return (
      <div style={panelStyle}>
        <div style={{ fontWeight: currentTheme.typography.fontWeightBold, marginBottom: 10, fontSize: currentTheme.typography.fontSize.md }}>
          Card
        </div>

        {renderColorSection(
          'Background',
          card.metadata.color,
          (color) => updateCard(card.id, { metadata: { ...card.metadata, color } })
        )}

        {renderColorSection(
          'Border',
          card.metadata.borderColor,
          (color) => updateCard(card.id, { metadata: { ...card.metadata, borderColor: color } })
        )}

        {renderColorSection(
          'Font Color',
          card.metadata.fontColor,
          (color) => updateCard(card.id, { metadata: { ...card.metadata, fontColor: color } })
        )}

        <div style={sectionStyle}>
          <span style={labelStyle}>Font Family</span>
          <select
            value={card.metadata.fontFamily || ''}
            onChange={(e) =>
              updateCard(card.id, { metadata: { ...card.metadata, fontFamily: e.target.value || undefined } })
            }
            style={selectStyle}
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() =>
            updateCard(card.id, {
              metadata: {
                ...card.metadata,
                color: undefined,
                borderColor: undefined,
                fontColor: undefined,
                fontFamily: undefined,
              },
            })
          }
          style={{
            width: '100%',
            padding: '4px 8px',
            border: `1px solid ${currentTheme.colors.border}40`,
            borderRadius: currentTheme.decorations.borderRadius,
            background: 'transparent',
            color: currentTheme.colors.textMuted,
            fontSize: currentTheme.typography.fontSize.xs,
            cursor: 'pointer',
          }}
        >
          Reset to theme defaults
        </button>
      </div>
    );
  }

  // ─── Connection Inspector ─────────────
  if (conn) {
    return (
      <div style={panelStyle}>
        <div style={{ fontWeight: currentTheme.typography.fontWeightBold, marginBottom: 10, fontSize: currentTheme.typography.fontSize.md }}>
          Connection
        </div>

        {renderColorSection(
          'Line Color',
          conn.color,
          (color) => updateConnection(conn.id, { color })
        )}

        <div style={sectionStyle}>
          <span style={labelStyle}>Line Style</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {LINE_STYLES.map((ls) => (
              <button
                key={ls.value}
                onClick={() => updateConnection(conn.id, { lineStyle: ls.value })}
                style={{
                  flex: 1,
                  padding: '4px 6px',
                  border: (conn.lineStyle || 'solid') === ls.value
                    ? `2px solid ${currentTheme.colors.primary}`
                    : `1px solid ${currentTheme.colors.border}40`,
                  borderRadius: currentTheme.decorations.borderRadius,
                  background: currentTheme.colors.surface,
                  color: currentTheme.colors.text,
                  fontSize: currentTheme.typography.fontSize.xs,
                  fontFamily: currentTheme.typography.fontFamilyMono,
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                {ls.preview}
                <div style={{ fontSize: '9px', color: currentTheme.colors.textMuted, marginTop: 1 }}>{ls.label}</div>
              </button>
            ))}
          </div>
        </div>

        <div style={sectionStyle}>
          <span style={labelStyle}>Direction</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {DIRECTIONS.map((d) => (
              <button
                key={d.value}
                onClick={() => updateConnection(conn.id, { direction: d.value })}
                style={{
                  flex: 1,
                  padding: '4px 2px',
                  border: conn.direction === d.value
                    ? `2px solid ${currentTheme.colors.primary}`
                    : `1px solid ${currentTheme.colors.border}40`,
                  borderRadius: currentTheme.decorations.borderRadius,
                  background: currentTheme.colors.surface,
                  color: currentTheme.colors.text,
                  fontSize: '14px',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
                title={d.label}
              >
                {d.icon}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => updateConnection(conn.id, { color: undefined, lineStyle: undefined })}
          style={{
            width: '100%',
            padding: '4px 8px',
            border: `1px solid ${currentTheme.colors.border}40`,
            borderRadius: currentTheme.decorations.borderRadius,
            background: 'transparent',
            color: currentTheme.colors.textMuted,
            fontSize: currentTheme.typography.fontSize.xs,
            cursor: 'pointer',
          }}
        >
          Reset to defaults
        </button>
      </div>
    );
  }

  // ─── Group Inspector ─────────────
  if (group) {
    return (
      <div style={panelStyle}>
        <div style={{ fontWeight: currentTheme.typography.fontWeightBold, marginBottom: 10, fontSize: currentTheme.typography.fontSize.md }}>
          Group
        </div>

        <div style={sectionStyle}>
          <span style={labelStyle}>Label</span>
          <input
            value={group.label}
            onChange={(e) => updateGroup(group.id, { label: e.target.value })}
            style={{
              ...selectStyle,
              fontFamily: currentTheme.typography.fontFamily,
            }}
          />
        </div>

        {renderColorSection(
          'Color',
          group.color,
          (color) => updateGroup(group.id, { color })
        )}

        <div style={{ fontSize: currentTheme.typography.fontSize.xs, color: currentTheme.colors.textMuted, marginTop: 4 }}>
          {group.cardIds.length} card{group.cardIds.length !== 1 ? 's' : ''} in group
        </div>
      </div>
    );
  }

  return null;
};

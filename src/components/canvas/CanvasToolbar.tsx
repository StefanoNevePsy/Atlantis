import React, { useState } from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { useThemeStore } from '../../store/themeStore';
import { useSyncStore } from '../../store/syncStore';
import { screenToCanvas } from '../../utils/geometry';
import type { ToolMode, StructureType } from '../../types';

export const CanvasToolbar: React.FC = () => {
  const {
    toolMode,
    setToolMode,
    activeCardId,
    cards,
    viewport,
    canvasName,
    setCanvasName,
    backgroundPattern,
    setBackgroundPattern,
    createStructure,
    updateStructureType,
    selectedCardIds,
    groupSelectedCards,
    addCard,
  } = useCanvasStore();

  const { currentTheme, setTheme, getAllThemes } = useThemeStore();
  const {
    firebaseConfigJson,
    syncUsername,
    syncEnabled,
    imgurClientId,
    setFirebaseConfig,
    setSyncUsername,
    setSyncEnabled,
    setImgurClientId,
    getFirebaseConfig,
  } = useSyncStore();
  const [showSettings, setShowSettings] = useState(false);
  const [showStructureMenu, setShowStructureMenu] = useState(false);

  const tools: { mode: ToolMode; label: string; icon: string; shortcut: string }[] = [
    { mode: 'select', label: 'Select', icon: '↖', shortcut: 'V' },
    { mode: 'pan', label: 'Pan', icon: '✋', shortcut: 'H' },
    { mode: 'connect', label: 'Connect', icon: '⟋', shortcut: 'C' },
    { mode: 'paint-select', label: 'Paint Select', icon: '✦', shortcut: 'P' },
    { mode: 'draw', label: 'Draw', icon: '✏', shortcut: 'D' },
  ];

  const structureTypes: { type: StructureType; label: string; icon: string }[] = [
    { type: 'mindmap', label: 'Mind Map', icon: '🧠' },
    { type: 'org-chart', label: 'Org Chart', icon: '📊' },
    { type: 'logic-chart', label: 'Logic Chart', icon: '📐' },
    { type: 'fishbone', label: 'Fishbone', icon: '🐟' },
  ];

  const handleCreateStructure = (type: StructureType) => {
    if (activeCardId) {
      const card = cards[activeCardId];
      if (card?.structureId) {
        updateStructureType(card.structureId, type);
      } else {
        createStructure(activeCardId, type);
      }
    }
    setShowStructureMenu(false);
  };

  const buttonBase: React.CSSProperties = {
    padding: '6px 10px',
    border: `${currentTheme.decorations.borderWidth} solid ${currentTheme.colors.border}`,
    borderRadius: currentTheme.decorations.borderRadius,
    background: currentTheme.colors.surface,
    color: currentTheme.colors.text,
    cursor: 'pointer',
    fontFamily: currentTheme.typography.fontFamilyMono,
    fontSize: currentTheme.typography.fontSize.sm,
    fontWeight: currentTheme.typography.fontWeight,
    boxShadow: currentTheme.decorations.shadowStyle,
    transition: 'transform 0.1s ease, box-shadow 0.1s ease',
  };

  const activeButton: React.CSSProperties = {
    ...buttonBase,
    background: currentTheme.colors.primary,
    color: '#fff',
    transform: 'translate(2px, 2px)',
    boxShadow: 'none',
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: 12,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        display: 'flex',
        gap: 6,
        padding: '8px 12px',
        background: currentTheme.colors.surface + 'ee',
        border: `${currentTheme.decorations.borderWidth} solid ${currentTheme.colors.border}`,
        borderRadius: currentTheme.decorations.borderRadiusLg,
        boxShadow: currentTheme.decorations.shadowStyle,
        backdropFilter: 'blur(8px)',
        alignItems: 'center',
      }}
    >
      {/* Canvas name */}
      <input
        value={canvasName}
        onChange={(e) => setCanvasName(e.target.value)}
        style={{
          border: 'none',
          background: 'transparent',
          color: currentTheme.colors.text,
          fontFamily: currentTheme.typography.fontFamily,
          fontSize: currentTheme.typography.fontSize.md,
          fontWeight: currentTheme.typography.fontWeightBold,
          width: 140,
          outline: 'none',
        }}
      />

      <div style={{ width: 1, height: 24, background: currentTheme.colors.border + '40', margin: '0 4px' }} />

      {/* Tool buttons */}
      {tools.map((tool) => (
        <button
          key={tool.mode}
          onClick={() => setToolMode(tool.mode)}
          style={toolMode === tool.mode ? activeButton : buttonBase}
          title={`${tool.label} (${tool.shortcut})`}
        >
          {tool.icon}
        </button>
      ))}

      {/* Add card button (useful for touch) */}
      <button
        onClick={() => {
          const center = screenToCanvas(
            window.innerWidth / 2,
            window.innerHeight / 2,
            viewport.offset,
            viewport.zoom
          );
          addCard(center);
        }}
        style={buttonBase}
        title="Add card at center (or double-click canvas, or long-press on touch)"
      >
        +
      </button>

      {/* Group selected button */}
      <button
        onClick={() => {
          if (selectedCardIds.size >= 2) {
            groupSelectedCards();
          }
        }}
        style={{
          ...buttonBase,
          opacity: selectedCardIds.size >= 2 ? 1 : 0.35,
          cursor: selectedCardIds.size >= 2 ? 'pointer' : 'default',
        }}
        title={selectedCardIds.size >= 2 ? `Group ${selectedCardIds.size} selected cards (G)` : 'Select 2+ cards to group'}
      >
        [ ]
      </button>

      <div style={{ width: 1, height: 24, background: currentTheme.colors.border + '40', margin: '0 4px' }} />

      {/* Structure menu */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setShowStructureMenu(!showStructureMenu)}
          style={buttonBase}
          title="Create Structure (select a card first)"
        >
          🗺
        </button>
        {showStructureMenu && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: 8,
              background: currentTheme.colors.surface,
              border: `${currentTheme.decorations.borderWidth} solid ${currentTheme.colors.border}`,
              borderRadius: currentTheme.decorations.borderRadius,
              boxShadow: currentTheme.decorations.shadowStyle,
              padding: 4,
              minWidth: 160,
              zIndex: 1001,
            }}
          >
            {structureTypes.map((st) => (
              <button
                key={st.type}
                onClick={() => handleCreateStructure(st.type)}
                disabled={!activeCardId}
                style={{
                  ...buttonBase,
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  marginBottom: 2,
                  boxShadow: 'none',
                  border: 'none',
                  opacity: activeCardId ? 1 : 0.4,
                }}
              >
                {st.icon} {st.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Settings */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setShowSettings(!showSettings)}
          style={buttonBase}
          title="Settings"
        >
          ⚙
        </button>
        {showSettings && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: 8,
              background: currentTheme.colors.surface,
              border: `${currentTheme.decorations.borderWidth} solid ${currentTheme.colors.border}`,
              borderRadius: currentTheme.decorations.borderRadius,
              boxShadow: currentTheme.decorations.shadowStyle,
              padding: 12,
              minWidth: 200,
              zIndex: 1001,
            }}
          >
            <div style={{ marginBottom: 8 }}>
              <label
                style={{
                  fontSize: currentTheme.typography.fontSize.xs,
                  color: currentTheme.colors.textMuted,
                  display: 'block',
                  marginBottom: 4,
                }}
              >
                Background
              </label>
              <div style={{ display: 'flex', gap: 4 }}>
                {(['dots', 'grid', 'noise', 'none'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setBackgroundPattern(p)}
                    style={backgroundPattern === p ? activeButton : { ...buttonBase, fontSize: currentTheme.typography.fontSize.xs }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label
                style={{
                  fontSize: currentTheme.typography.fontSize.xs,
                  color: currentTheme.colors.textMuted,
                  display: 'block',
                  marginBottom: 4,
                }}
              >
                Theme
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 200, overflowY: 'auto' }}>
                {getAllThemes().map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setTheme(theme.id)}
                    style={{
                      ...buttonBase,
                      boxShadow: 'none',
                      border: theme.id === currentTheme.id
                        ? `2px solid ${currentTheme.colors.primary}`
                        : `1px solid ${currentTheme.colors.border}40`,
                      fontSize: currentTheme.typography.fontSize.xs,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <span
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        background: theme.colors.primary,
                        border: `1px solid ${theme.colors.border}`,
                      }}
                    />
                    {theme.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Sync settings */}
            <div style={{ borderTop: `1px solid ${currentTheme.colors.border}30`, marginTop: 8, paddingTop: 8 }}>
              <label
                style={{
                  fontSize: currentTheme.typography.fontSize.xs,
                  color: currentTheme.colors.textMuted,
                  display: 'block',
                  marginBottom: 4,
                }}
              >
                Cloud Sync
              </label>
              <input
                placeholder="Username"
                value={syncUsername}
                onChange={(e) => setSyncUsername(e.target.value)}
                style={{
                  width: '100%',
                  border: `1px solid ${currentTheme.colors.border}40`,
                  borderRadius: currentTheme.decorations.borderRadius,
                  background: currentTheme.colors.surface,
                  color: currentTheme.colors.text,
                  fontSize: currentTheme.typography.fontSize.xs,
                  fontFamily: currentTheme.typography.fontFamilyMono,
                  padding: '4px 8px',
                  outline: 'none',
                  marginBottom: 4,
                  boxSizing: 'border-box',
                }}
              />
              <textarea
                placeholder="Firebase config JSON..."
                value={firebaseConfigJson}
                onChange={(e) => setFirebaseConfig(e.target.value)}
                rows={3}
                style={{
                  width: '100%',
                  border: `1px solid ${currentTheme.colors.border}40`,
                  borderRadius: currentTheme.decorations.borderRadius,
                  background: currentTheme.colors.surface,
                  color: currentTheme.colors.text,
                  fontSize: currentTheme.typography.fontSize.xs,
                  fontFamily: currentTheme.typography.fontFamilyMono,
                  padding: '4px 8px',
                  outline: 'none',
                  resize: 'vertical',
                  marginBottom: 4,
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  onClick={() => {
                    const config = getFirebaseConfig();
                    if (config && syncUsername) {
                      setSyncEnabled(!syncEnabled);
                    }
                  }}
                  style={{
                    ...buttonBase,
                    fontSize: currentTheme.typography.fontSize.xs,
                    boxShadow: 'none',
                    flex: 1,
                    opacity: (getFirebaseConfig() && syncUsername) ? 1 : 0.4,
                    background: syncEnabled ? currentTheme.colors.success + '20' : currentTheme.colors.surface,
                    border: syncEnabled
                      ? `1px solid ${currentTheme.colors.success}`
                      : `1px solid ${currentTheme.colors.border}40`,
                  }}
                >
                  {syncEnabled ? 'Sync ON' : 'Enable Sync'}
                </button>
                {!getFirebaseConfig() && firebaseConfigJson && (
                  <span style={{ fontSize: '10px', color: currentTheme.colors.danger }}>Invalid JSON</span>
                )}
              </div>
            </div>

            {/* Imgur settings */}
            <div style={{ borderTop: `1px solid ${currentTheme.colors.border}30`, marginTop: 8, paddingTop: 8 }}>
              <label
                style={{
                  fontSize: currentTheme.typography.fontSize.xs,
                  color: currentTheme.colors.textMuted,
                  display: 'block',
                  marginBottom: 4,
                }}
              >
                Imgur Image Hosting
              </label>
              <input
                placeholder="Imgur Client ID"
                value={imgurClientId}
                onChange={(e) => setImgurClientId(e.target.value)}
                style={{
                  width: '100%',
                  border: `1px solid ${currentTheme.colors.border}40`,
                  borderRadius: currentTheme.decorations.borderRadius,
                  background: currentTheme.colors.surface,
                  color: currentTheme.colors.text,
                  fontSize: currentTheme.typography.fontSize.xs,
                  fontFamily: currentTheme.typography.fontFamilyMono,
                  padding: '4px 8px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ fontSize: '10px', color: currentTheme.colors.textMuted, marginTop: 2 }}>
                Pasted/dropped images auto-upload to Imgur
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Zoom indicator */}
      <span
        style={{
          fontSize: currentTheme.typography.fontSize.xs,
          color: currentTheme.colors.textMuted,
          fontFamily: currentTheme.typography.fontFamilyMono,
          marginLeft: 4,
        }}
      >
        {Math.round(viewport.zoom * 100)}%
      </span>
    </div>
  );
};

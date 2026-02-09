import React, { useState, useMemo } from 'react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useThemeStore } from '../../store/themeStore';
import { CanvasCard } from './CanvasCard';
import { FolderPanel } from './FolderPanel';
import { SearchBar } from './SearchBar';

interface Props {
  onOpenCanvas: (canvasId: string) => void;
}

export const Dashboard: React.FC<Props> = ({ onOpenCanvas }) => {
  const {
    canvases,
    createCanvas,
    deleteCanvas,
    duplicateCanvas,
    searchCanvases,
  } = useWorkspaceStore();

  const { currentTheme, setTheme, getAllThemes } = useThemeStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>(undefined);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showThemePicker, setShowThemePicker] = useState(false);

  const filteredCanvases = useMemo(() => {
    let result = searchQuery
      ? searchCanvases(searchQuery)
      : Object.values(canvases);

    if (selectedFolderId !== undefined) {
      result = result.filter((c) => c.folderId === selectedFolderId);
    }

    // Filter out archived
    result = result.filter((c) => !c.tags.includes('_archived'));

    // Sort by most recently updated
    result.sort((a, b) => b.updatedAt - a.updatedAt);
    return result;
  }, [canvases, searchQuery, selectedFolderId, searchCanvases]);

  const handleCreateCanvas = () => {
    const id = createCanvas('Untitled Canvas', selectedFolderId);
    onOpenCanvas(id);
  };

  const handleCreateFromTemplate = (template: string) => {
    const id = createCanvas(`${template} Canvas`, selectedFolderId);
    onOpenCanvas(id);
  };

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        background: currentTheme.colors.background,
        color: currentTheme.colors.text,
        fontFamily: currentTheme.typography.fontFamily,
      }}
    >
      {/* Sidebar */}
      <div
        style={{
          width: 240,
          borderRight: `${currentTheme.decorations.borderWidth} solid ${currentTheme.colors.border}`,
          background: currentTheme.colors.surface,
          display: 'flex',
          flexDirection: 'column',
          padding: 16,
        }}
      >
        {/* Logo */}
        <div
          style={{
            fontSize: currentTheme.typography.fontSize.xl,
            fontWeight: currentTheme.typography.fontWeightBold,
            marginBottom: 24,
            fontFamily: currentTheme.typography.fontFamilyMono,
            letterSpacing: '-0.02em',
          }}
        >
          Atlantis
        </div>

        {/* New canvas button */}
        <button
          onClick={handleCreateCanvas}
          style={{
            padding: '10px 16px',
            border: `${currentTheme.decorations.borderWidth} solid ${currentTheme.colors.border}`,
            borderRadius: currentTheme.decorations.borderRadius,
            background: currentTheme.colors.primary,
            color: '#fff',
            cursor: 'pointer',
            fontFamily: currentTheme.typography.fontFamilyMono,
            fontSize: currentTheme.typography.fontSize.sm,
            fontWeight: currentTheme.typography.fontWeightBold,
            boxShadow: currentTheme.decorations.shadowStyle,
            marginBottom: 16,
            transition: 'transform 0.1s ease',
          }}
          onMouseDown={(e) => {
            (e.target as HTMLElement).style.transform = 'translate(2px, 2px)';
            (e.target as HTMLElement).style.boxShadow = 'none';
          }}
          onMouseUp={(e) => {
            (e.target as HTMLElement).style.transform = 'none';
            (e.target as HTMLElement).style.boxShadow = currentTheme.decorations.shadowStyle;
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLElement).style.transform = 'none';
            (e.target as HTMLElement).style.boxShadow = currentTheme.decorations.shadowStyle;
          }}
        >
          + New Canvas
        </button>

        {/* Templates */}
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: currentTheme.typography.fontSize.xs,
              color: currentTheme.colors.textMuted,
              marginBottom: 6,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Templates
          </div>
          {['Mind Map', 'Kanban', 'Retrospective', 'Freeform'].map((tmpl) => (
            <button
              key={tmpl}
              onClick={() => handleCreateFromTemplate(tmpl)}
              style={{
                display: 'block',
                width: '100%',
                padding: '6px 10px',
                border: 'none',
                background: 'transparent',
                color: currentTheme.colors.text,
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: currentTheme.typography.fontFamily,
                fontSize: currentTheme.typography.fontSize.sm,
                borderRadius: currentTheme.decorations.borderRadius,
                marginBottom: 2,
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.background = currentTheme.colors.surfaceHover;
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.background = 'transparent';
              }}
            >
              {tmpl}
            </button>
          ))}
        </div>

        {/* Folders */}
        <FolderPanel
          selectedFolderId={selectedFolderId}
          onSelectFolder={setSelectedFolderId}
        />

        {/* Theme switcher at bottom */}
        <div style={{ marginTop: 'auto', paddingTop: 16 }}>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowThemePicker(!showThemePicker)}
              style={{
                width: '100%',
                padding: '8px 10px',
                border: `1px solid ${currentTheme.colors.border}40`,
                borderRadius: currentTheme.decorations.borderRadius,
                background: 'transparent',
                color: currentTheme.colors.textMuted,
                cursor: 'pointer',
                fontFamily: currentTheme.typography.fontFamilyMono,
                fontSize: currentTheme.typography.fontSize.xs,
                textAlign: 'left',
              }}
            >
              Theme: {currentTheme.name}
            </button>
            {showThemePicker && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '100%',
                  left: 0,
                  right: 0,
                  background: currentTheme.colors.surface,
                  border: `${currentTheme.decorations.borderWidth} solid ${currentTheme.colors.border}`,
                  borderRadius: currentTheme.decorations.borderRadius,
                  boxShadow: currentTheme.decorations.shadowStyle,
                  padding: 4,
                  marginBottom: 4,
                  zIndex: 100,
                }}
              >
                {getAllThemes().map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => {
                      setTheme(theme.id);
                      setShowThemePicker(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      width: '100%',
                      padding: '6px 8px',
                      border: 'none',
                      background:
                        theme.id === currentTheme.id
                          ? currentTheme.colors.surfaceHover
                          : 'transparent',
                      color: currentTheme.colors.text,
                      cursor: 'pointer',
                      fontFamily: currentTheme.typography.fontFamily,
                      fontSize: currentTheme.typography.fontSize.xs,
                      borderRadius: currentTheme.decorations.borderRadius,
                      textAlign: 'left',
                    }}
                  >
                    <span
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        background: theme.colors.primary,
                        border: `2px solid ${theme.colors.border}`,
                        flexShrink: 0,
                      }}
                    />
                    <span>{theme.name}</span>
                    <span
                      style={{
                        fontSize: '9px',
                        color: currentTheme.colors.textMuted,
                        marginLeft: 'auto',
                      }}
                    >
                      {theme.variant}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar */}
        <div
          style={{
            padding: '12px 24px',
            borderBottom: `1px solid ${currentTheme.colors.border}20`,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <SearchBar value={searchQuery} onChange={setSearchQuery} />

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                padding: '4px 8px',
                border: `1px solid ${currentTheme.colors.border}40`,
                borderRadius: currentTheme.decorations.borderRadius,
                background:
                  viewMode === 'grid'
                    ? currentTheme.colors.primary + '20'
                    : 'transparent',
                color: currentTheme.colors.text,
                cursor: 'pointer',
                fontFamily: currentTheme.typography.fontFamilyMono,
                fontSize: currentTheme.typography.fontSize.xs,
              }}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{
                padding: '4px 8px',
                border: `1px solid ${currentTheme.colors.border}40`,
                borderRadius: currentTheme.decorations.borderRadius,
                background:
                  viewMode === 'list'
                    ? currentTheme.colors.primary + '20'
                    : 'transparent',
                color: currentTheme.colors.text,
                cursor: 'pointer',
                fontFamily: currentTheme.typography.fontFamilyMono,
                fontSize: currentTheme.typography.fontSize.xs,
              }}
            >
              List
            </button>
          </div>
        </div>

        {/* Canvas grid */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            padding: 24,
          }}
        >
          {filteredCanvases.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '80px 40px',
                color: currentTheme.colors.textMuted,
              }}
            >
              <div
                style={{
                  fontSize: currentTheme.typography.fontSize.xxl,
                  marginBottom: 12,
                }}
              >
                ~
              </div>
              <div style={{ fontSize: currentTheme.typography.fontSize.lg, marginBottom: 8 }}>
                No canvases yet
              </div>
              <div style={{ fontSize: currentTheme.typography.fontSize.sm }}>
                Click "New Canvas" to get started
              </div>
            </div>
          ) : (
            <div
              style={
                viewMode === 'grid'
                  ? {
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(260, 1fr))',
                      gap: 16,
                    }
                  : {
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }
              }
            >
              {filteredCanvases.map((canvas) => (
                <CanvasCard
                  key={canvas.id}
                  canvas={canvas}
                  viewMode={viewMode}
                  onOpen={() => onOpenCanvas(canvas.id)}
                  onDelete={() => deleteCanvas(canvas.id)}
                  onDuplicate={() => {
                    const newId = duplicateCanvas(canvas.id);
                    if (newId) onOpenCanvas(newId);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

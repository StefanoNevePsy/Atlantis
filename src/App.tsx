import React, { useState, useCallback } from 'react';
import { Dashboard } from './components/dashboard/Dashboard';
import { InfiniteCanvas } from './components/canvas/InfiniteCanvas';
import { useCanvasStore } from './store/canvasStore';
import { useWorkspaceStore } from './store/workspaceStore';
import { useThemeStore } from './store/themeStore';
import { SvgFilterDefs } from './components/ui/SvgFilterDefs';

type View = 'dashboard' | 'canvas';

const App: React.FC = () => {
  const [view, setView] = useState<View>('dashboard');
  const [activeCanvasId, setActiveCanvasId] = useState<string | null>(null);

  const { loadCanvas, cards, connections, structures, canvasName, canvasTags, backgroundPattern, backgroundColor } = useCanvasStore();
  const { canvases, saveCanvasState } = useWorkspaceStore();
  const { currentTheme } = useThemeStore();

  const handleOpenCanvas = useCallback(
    (id: string) => {
      const canvas = canvases[id];
      if (canvas) {
        loadCanvas({
          cards: canvas.cards,
          connections: canvas.connections,
          structures: canvas.structures,
          canvasId: canvas.id,
          canvasName: canvas.name,
          canvasTags: canvas.tags,
          backgroundPattern: canvas.backgroundPattern,
          backgroundColor: canvas.backgroundColor,
        });
      }
      setActiveCanvasId(id);
      setView('canvas');
    },
    [canvases, loadCanvas]
  );

  const handleBackToDashboard = useCallback(() => {
    // Save current canvas state
    if (activeCanvasId) {
      saveCanvasState(activeCanvasId, {
        cards,
        connections,
        structures,
        name: canvasName,
        tags: canvasTags,
        backgroundPattern,
        backgroundColor,
      });
    }
    setView('dashboard');
  }, [activeCanvasId, cards, connections, structures, canvasName, canvasTags, backgroundPattern, backgroundColor, saveCanvasState]);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: currentTheme.colors.background,
        color: currentTheme.colors.text,
      }}
    >
      <SvgFilterDefs />

      {view === 'dashboard' && (
        <Dashboard onOpenCanvas={handleOpenCanvas} />
      )}

      {view === 'canvas' && (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
          {/* Back button */}
          <button
            onClick={handleBackToDashboard}
            style={{
              position: 'absolute',
              top: 12,
              left: 12,
              zIndex: 1001,
              padding: '6px 12px',
              border: `${currentTheme.decorations.borderWidth} solid ${currentTheme.colors.border}`,
              borderRadius: currentTheme.decorations.borderRadius,
              background: currentTheme.colors.surface + 'ee',
              color: currentTheme.colors.text,
              cursor: 'pointer',
              fontFamily: currentTheme.typography.fontFamilyMono,
              fontSize: currentTheme.typography.fontSize.sm,
              boxShadow: currentTheme.decorations.shadowStyle,
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <span style={{ fontSize: '12px' }}>&larr;</span> Back
          </button>
          <InfiniteCanvas />
        </div>
      )}
    </div>
  );
};

export default App;

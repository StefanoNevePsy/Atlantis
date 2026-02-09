import React, { useRef, useCallback, useEffect } from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { useThemeStore } from '../../store/themeStore';
import { useSyncStore } from '../../store/syncStore';
import { useCanvasInteraction } from '../../hooks/useCanvasInteraction';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { Card } from '../cards/Card';
import { Group } from '../groups/Group';
import { ConnectionLayer } from '../connections/ConnectionLayer';
import { PaintTrail } from './PaintTrail';
import { BackgroundPattern } from './BackgroundPattern';
import { StructureOverlay } from '../xmind/StructureOverlay';
import { CanvasToolbar } from './CanvasToolbar';
import { InspectorPanel } from '../inspector/InspectorPanel';
import { screenToCanvas } from '../../utils/geometry';
import { uploadToImgur, fileToBase64 } from '../../utils/imgur';

const handleCanvasContextMenu = (e: React.MouseEvent) => {
  // Prevent default context menu on canvas background (supports S Pen button)
  if ((e.target as HTMLElement).dataset.canvas === 'true') {
    e.preventDefault();
  }
};

export const InfiniteCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const { handlePointerDown, handlePointerMove, handlePointerUp, handleDoubleClick } =
    useCanvasInteraction(canvasRef);
  useKeyboardShortcuts();

  const {
    cards,
    groups,
    viewport,
    backgroundPattern,
    selectedCardIds,
    selectedGroupIds,
    paintTrail,
    toolMode,
    connectingFromId,
    deselectAll,
    finishConnecting,
    cancelConnecting,
    addCard,
    updateCard,
  } = useCanvasStore();

  const { currentTheme } = useThemeStore();
  const imgurClientId = useSyncStore((s) => s.imgurClientId);

  // Helper: add image card, optionally upload to Imgur
  const addImageCard = useCallback(
    async (base64: string, pos: { x: number; y: number }) => {
      const cardId = addCard(pos, 'image', base64);

      // If Imgur is configured, upload in background and replace base64 with URL
      if (imgurClientId) {
        const result = await uploadToImgur(base64, imgurClientId);
        if (result.success && result.url) {
          updateCard(cardId, { content: result.url });
        }
      }
    },
    [addCard, updateCard, imgurClientId]
  );

  // Clipboard paste handler
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      // Don't intercept paste when editing text
      const active = document.activeElement;
      if (
        active instanceof HTMLTextAreaElement ||
        active instanceof HTMLInputElement ||
        (active as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (!file) continue;

          const base64 = await fileToBase64(file);

          // Place at center of current view
          const rect = canvasRef.current?.getBoundingClientRect();
          const centerX = rect ? rect.width / 2 : 400;
          const centerY = rect ? rect.height / 2 : 300;
          const pos = screenToCanvas(centerX, centerY, viewport.offset, viewport.zoom);

          await addImageCard(base64, pos);
          return;
        }
      }

      // Handle text paste as new card
      const text = e.clipboardData?.getData('text/plain');
      if (text && text.trim()) {
        // Only create card from paste when nothing is focused (not editing)
        e.preventDefault();
        const rect = canvasRef.current?.getBoundingClientRect();
        const centerX = rect ? rect.width / 2 : 400;
        const centerY = rect ? rect.height / 2 : 300;
        const pos = screenToCanvas(centerX, centerY, viewport.offset, viewport.zoom);

        const isUrl = text.trim().startsWith('http://') || text.trim().startsWith('https://');
        addCard(pos, isUrl ? 'url' : 'text', text.trim());
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [viewport, addCard, addImageCard]);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).dataset.canvas === 'true') {
        if (connectingFromId) {
          cancelConnecting();
        } else {
          deselectAll();
        }
      }
    },
    [deselectAll, connectingFromId, cancelConnecting]
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const pos = screenToCanvas(
        e.clientX - rect.left,
        e.clientY - rect.top,
        viewport.offset,
        viewport.zoom
      );

      // Handle image drops
      const files = Array.from(e.dataTransfer.files);
      const imageFile = files.find((f) => f.type.startsWith('image/'));
      if (imageFile) {
        const base64 = await fileToBase64(imageFile);
        await addImageCard(base64, pos);
        return;
      }

      // Handle URL drops
      const url = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain');
      if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
        addCard(pos, 'url', url);
        return;
      }

      // Handle text drops
      const text = e.dataTransfer.getData('text/plain');
      if (text) {
        addCard(pos, 'text', text);
      }
    },
    [viewport, addCard, addImageCard]
  );

  const transformStyle = {
    transform: `translate(${viewport.offset.x}px, ${viewport.offset.y}px) scale(${viewport.zoom})`,
    transformOrigin: '0 0',
  };

  const cursorMap: Record<string, string> = {
    select: 'default',
    pan: 'grab',
    connect: 'crosshair',
    'paint-select': 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\'%3E%3Ccircle cx=\'12\' cy=\'12\' r=\'6\' fill=\'none\' stroke=\'%23ff6b6b\' stroke-width=\'2\'/%3E%3C/svg%3E") 12 12, crosshair',
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        fontFamily: currentTheme.typography.fontFamily,
      }}
    >
      <CanvasToolbar />
      <InspectorPanel />
      <div
        ref={canvasRef}
        data-canvas="true"
        onClick={handleCanvasClick}
        onDoubleClick={handleDoubleClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onContextMenu={handleCanvasContextMenu}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        style={{
          position: 'absolute',
          inset: 0,
          cursor: cursorMap[toolMode] || 'default',
          backgroundColor: currentTheme.colors.background,
          touchAction: 'none',
        }}
      >
        <BackgroundPattern
          pattern={backgroundPattern}
          offset={viewport.offset}
          zoom={viewport.zoom}
        />

        <div style={transformStyle}>
          {/* Structure overlays (boundaries) rendered behind cards */}
          <StructureOverlay />

          {/* Groups rendered behind cards */}
          {Object.values(groups).map((group) => (
            <Group
              key={group.id}
              group={group}
              isSelected={selectedGroupIds.has(group.id)}
              onConnect={
                connectingFromId
                  ? () => finishConnecting(group.id, 'group')
                  : undefined
              }
            />
          ))}

          {/* Connection lines */}
          <ConnectionLayer />

          {/* Cards */}
          {Object.values(cards).map((card) => {
            // Hide cards in collapsed groups
            if (card.groupId) {
              const group = groups[card.groupId];
              if (group?.collapsed) return null;
            }
            return (
              <Card
                key={card.id}
                card={card}
                isSelected={selectedCardIds.has(card.id)}
                onConnect={
                  connectingFromId
                    ? () => finishConnecting(card.id, 'card')
                    : undefined
                }
              />
            );
          })}
        </div>

        {/* Paint trail overlay */}
        {paintTrail.length > 0 && (
          <PaintTrail
            points={paintTrail}
            offset={viewport.offset}
            zoom={viewport.zoom}
          />
        )}
      </div>
    </div>
  );
};

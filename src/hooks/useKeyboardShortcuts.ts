import { useEffect } from 'react';
import { useCanvasStore } from '../store/canvasStore';

export function useKeyboardShortcuts() {
  const {
    activeCardId,
    selectedCardIds,
    cards,
    removeCard,
    addChildToStructure,
    addSiblingInStructure,
    setToolMode,
    deselectAll,
    toggleCollapse,
    groupSelectedCards,
  } = useCanvasStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture if editing text
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // But still capture Tab/Enter for structure operations
        if (e.key === 'Tab' && activeCardId) {
          const card = cards[activeCardId];
          if (card?.structureId) {
            e.preventDefault();
            addChildToStructure(activeCardId);
            return;
          }
        }
        if (e.key === 'Enter' && !e.shiftKey && activeCardId) {
          const card = cards[activeCardId];
          if (card?.structureId && card.parentId) {
            e.preventDefault();
            addSiblingInStructure(activeCardId);
            return;
          }
        }
        return;
      }

      switch (e.key) {
        case 'Delete':
        case 'Backspace': {
          selectedCardIds.forEach((id) => removeCard(id));
          break;
        }
        case 'Escape': {
          deselectAll();
          setToolMode('select');
          break;
        }
        case 'Tab': {
          e.preventDefault();
          if (activeCardId) {
            const card = cards[activeCardId];
            if (card?.structureId) {
              addChildToStructure(activeCardId);
            }
          }
          break;
        }
        case 'Enter': {
          if (activeCardId) {
            const card = cards[activeCardId];
            if (card?.structureId && card.parentId) {
              e.preventDefault();
              addSiblingInStructure(activeCardId);
            }
          }
          break;
        }
        case ' ': {
          if (activeCardId) {
            toggleCollapse(activeCardId);
          }
          break;
        }
        case 'v': {
          setToolMode('select');
          break;
        }
        case 'h': {
          setToolMode('pan');
          break;
        }
        case 'c': {
          if (!e.ctrlKey && !e.metaKey) {
            setToolMode('connect');
          }
          break;
        }
        case 'p': {
          setToolMode('paint-select');
          break;
        }
        case 'd': {
          if (!e.ctrlKey && !e.metaKey) {
            setToolMode('draw');
          }
          break;
        }
        case 'g': {
          if (!e.ctrlKey && !e.metaKey) {
            if (selectedCardIds.size >= 2) {
              groupSelectedCards();
            }
          }
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    activeCardId,
    selectedCardIds,
    cards,
    removeCard,
    addChildToStructure,
    addSiblingInStructure,
    setToolMode,
    deselectAll,
    toggleCollapse,
    groupSelectedCards,
  ]);
}

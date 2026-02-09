import { useCallback, useRef, useEffect } from 'react';
import { useCanvasStore } from '../store/canvasStore';
import { screenToCanvas } from '../utils/geometry';

export function useCanvasInteraction(canvasRef: React.RefObject<HTMLDivElement | null>) {
  const isPanning = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const panVelocity = useRef({ x: 0, y: 0 });
  const animationFrame = useRef<number>(0);

  const {
    viewport,
    toolMode,
    panBy,
    zoomTo,
    addCard,
    deselectAll,
    addToPaintTrail,
    finishPaintSelection,
    setDragging,
  } = useCanvasStore();

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        // Zoom
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        zoomTo(viewport.zoom * delta, {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      } else {
        // Pan
        panBy({ x: -e.deltaX, y: -e.deltaY });
      }
    },
    [viewport.zoom, panBy, zoomTo, canvasRef]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button === 1 || (e.button === 0 && toolMode === 'pan')) {
        // Middle click or pan mode
        isPanning.current = true;
        lastPointer.current = { x: e.clientX, y: e.clientY };
        panVelocity.current = { x: 0, y: 0 };
        setDragging(true);
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        return;
      }

      if (e.button === 0 && toolMode === 'paint-select') {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const canvasPoint = screenToCanvas(
          e.clientX - rect.left,
          e.clientY - rect.top,
          viewport.offset,
          viewport.zoom
        );
        addToPaintTrail(canvasPoint);
        setDragging(true);
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        return;
      }

      if (e.button === 0 && e.detail === 2 && toolMode === 'select') {
        // Double click to create card
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const canvasPoint = screenToCanvas(
          e.clientX - rect.left,
          e.clientY - rect.top,
          viewport.offset,
          viewport.zoom
        );
        addCard(canvasPoint);
        return;
      }
    },
    [toolMode, viewport, addCard, deselectAll, addToPaintTrail, setDragging, canvasRef]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (isPanning.current) {
        const dx = e.clientX - lastPointer.current.x;
        const dy = e.clientY - lastPointer.current.y;
        panVelocity.current = { x: dx * 0.8, y: dy * 0.8 };
        panBy({ x: dx, y: dy });
        lastPointer.current = { x: e.clientX, y: e.clientY };
        return;
      }

      if (toolMode === 'paint-select' && e.buttons === 1) {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const canvasPoint = screenToCanvas(
          e.clientX - rect.left,
          e.clientY - rect.top,
          viewport.offset,
          viewport.zoom
        );
        addToPaintTrail(canvasPoint);
      }
    },
    [toolMode, viewport, panBy, addToPaintTrail, canvasRef]
  );

  const handlePointerUp = useCallback(
    (_e: React.PointerEvent) => {
      if (isPanning.current) {
        isPanning.current = false;
        setDragging(false);
        // Inertia
        const applyInertia = () => {
          const vx = panVelocity.current.x;
          const vy = panVelocity.current.y;
          if (Math.abs(vx) < 0.5 && Math.abs(vy) < 0.5) return;
          panVelocity.current = { x: vx * 0.92, y: vy * 0.92 };
          panBy({ x: vx, y: vy });
          animationFrame.current = requestAnimationFrame(applyInertia);
        };
        cancelAnimationFrame(animationFrame.current);
        animationFrame.current = requestAnimationFrame(applyInertia);
        return;
      }

      if (toolMode === 'paint-select') {
        finishPaintSelection();
        setDragging(false);
      }
    },
    [toolMode, panBy, finishPaintSelection, setDragging]
  );

  // Attach wheel listener with passive: false
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel, canvasRef]);

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  };
}

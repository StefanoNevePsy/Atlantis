import { useCallback, useRef, useEffect } from 'react';
import { useCanvasStore } from '../store/canvasStore';
import { screenToCanvas } from '../utils/geometry';

// Touch interaction thresholds
const LONG_PRESS_MOVE_THRESHOLD = 10; // px
const LONG_PRESS_DURATION = 600; // ms

export function useCanvasInteraction(canvasRef: React.RefObject<HTMLDivElement | null>) {
  const isPanning = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const panVelocity = useRef({ x: 0, y: 0 });
  const animationFrame = useRef<number>(0);

  // Multi-touch tracking for pinch-to-zoom
  const pointerCache = useRef<Map<number, { x: number; y: number }>>(new Map());
  const lastPinchDist = useRef<number>(0);
  const lastPinchCenter = useRef({ x: 0, y: 0 });
  const isPinching = useRef(false);

  // Long press for touch card creation
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressStartPos = useRef({ x: 0, y: 0 });

  const {
    viewport,
    toolMode,
    panBy,
    zoomTo,
    addCard,
    addToPaintTrail,
    finishPaintSelection,
    setDragging,
  } = useCanvasStore();

  const clearLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const getDistance = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
    return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
  };

  const getMidpoint = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
    return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
  };

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
      // Track pointer for multi-touch
      pointerCache.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      // S Pen button + tap on canvas = create card
      if (e.pointerType === 'pen' && e.button >= 2 && toolMode === 'select') {
        const target = e.target as HTMLElement;
        if (target.dataset.canvas) {
          e.preventDefault();
          const rect = canvasRef.current?.getBoundingClientRect();
          if (rect) {
            const canvasPoint = screenToCanvas(
              e.clientX - rect.left,
              e.clientY - rect.top,
              viewport.offset,
              viewport.zoom
            );
            addCard(canvasPoint);
          }
          return;
        }
      }

      // Two-finger pinch/pan detection
      if (pointerCache.current.size >= 2) {
        clearLongPress();
        isPinching.current = true;
        isPanning.current = false;
        const pointers = Array.from(pointerCache.current.values());
        lastPinchDist.current = getDistance(pointers[0], pointers[1]);
        lastPinchCenter.current = getMidpoint(pointers[0], pointers[1]);
        setDragging(true);
        return;
      }

      // Middle click or pan mode
      if (e.button === 1 || (e.button === 0 && toolMode === 'pan')) {
        isPanning.current = true;
        lastPointer.current = { x: e.clientX, y: e.clientY };
        panVelocity.current = { x: 0, y: 0 };
        setDragging(true);
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        return;
      }

      // Paint select mode
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

      // Touch on canvas background in select mode = pan + long press
      if (e.pointerType === 'touch' && e.button === 0 && toolMode === 'select') {
        const target = e.target as HTMLElement;
        if (target.dataset.canvas) {
          // Start panning
          isPanning.current = true;
          lastPointer.current = { x: e.clientX, y: e.clientY };
          panVelocity.current = { x: 0, y: 0 };
          setDragging(true);
          (e.target as HTMLElement).setPointerCapture?.(e.pointerId);

          // Also start long press timer for card creation
          longPressStartPos.current = { x: e.clientX, y: e.clientY };
          clearLongPress();
          longPressTimer.current = setTimeout(() => {
            // Long press fires: create card instead of panning
            isPanning.current = false;
            setDragging(false);
            const rect = canvasRef.current?.getBoundingClientRect();
            if (!rect) return;
            const canvasPoint = screenToCanvas(
              longPressStartPos.current.x - rect.left,
              longPressStartPos.current.y - rect.top,
              viewport.offset,
              viewport.zoom
            );
            addCard(canvasPoint);
            if (navigator.vibrate) {
              navigator.vibrate(30);
            }
          }, LONG_PRESS_DURATION);
          return;
        }
      }
    },
    [toolMode, viewport, addToPaintTrail, setDragging, canvasRef, addCard, clearLongPress]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      // Update pointer cache
      if (pointerCache.current.has(e.pointerId)) {
        pointerCache.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      }

      // Cancel long press if moved too far
      if (longPressTimer.current) {
        const dx = e.clientX - longPressStartPos.current.x;
        const dy = e.clientY - longPressStartPos.current.y;
        if (Math.sqrt(dx * dx + dy * dy) > LONG_PRESS_MOVE_THRESHOLD) {
          clearLongPress();
        }
      }

      // Handle pinch-to-zoom with two fingers
      if (isPinching.current && pointerCache.current.size >= 2) {
        const pointers = Array.from(pointerCache.current.values());
        const newDist = getDistance(pointers[0], pointers[1]);
        const newCenter = getMidpoint(pointers[0], pointers[1]);

        if (lastPinchDist.current > 0) {
          // Zoom based on distance change
          const scale = newDist / lastPinchDist.current;
          if (Math.abs(newDist - lastPinchDist.current) > 1) {
            const rect = canvasRef.current?.getBoundingClientRect();
            if (rect) {
              zoomTo(viewport.zoom * scale, {
                x: newCenter.x - rect.left,
                y: newCenter.y - rect.top,
              });
            }
          }

          // Pan based on center movement
          const dx = newCenter.x - lastPinchCenter.current.x;
          const dy = newCenter.y - lastPinchCenter.current.y;
          if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
            panBy({ x: dx, y: dy });
          }
        }

        lastPinchDist.current = newDist;
        lastPinchCenter.current = newCenter;
        return;
      }

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
    [toolMode, viewport, panBy, zoomTo, addToPaintTrail, canvasRef, clearLongPress]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      // Remove from pointer cache
      pointerCache.current.delete(e.pointerId);
      clearLongPress();

      // End pinch if less than 2 pointers
      if (isPinching.current && pointerCache.current.size < 2) {
        isPinching.current = false;
        lastPinchDist.current = 0;
        setDragging(false);
        return;
      }

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
    [toolMode, panBy, finishPaintSelection, setDragging, clearLongPress]
  );

  // Double-click to create card - using native dblclick which is reliable
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (toolMode !== 'select') return;
      // Only create on canvas background, not on cards/groups
      const target = e.target as HTMLElement;
      if (!target.dataset.canvas) return;

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const canvasPoint = screenToCanvas(
        e.clientX - rect.left,
        e.clientY - rect.top,
        viewport.offset,
        viewport.zoom
      );
      addCard(canvasPoint);
    },
    [toolMode, viewport, addCard, canvasRef]
  );

  // Attach wheel listener with passive: false
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel, canvasRef]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      clearLongPress();
      cancelAnimationFrame(animationFrame.current);
    };
  }, [clearLongPress]);

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleDoubleClick,
  };
}

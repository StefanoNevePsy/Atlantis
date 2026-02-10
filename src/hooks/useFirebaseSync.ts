import { useEffect, useRef, useCallback } from 'react';
import { useCanvasStore } from '../store/canvasStore';
import { useSyncStore } from '../store/syncStore';
import { pushToFirebase, pullFromFirebase, type FirebaseConfig, type CanvasSyncData } from '../utils/firebaseSync';

const DEBOUNCE_MS = 3000; // 3 seconds debounce for auto-push

export function useFirebaseSync() {
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPushHash = useRef<string>('');

  const {
    cards,
    connections,
    structures,
    groups,
    canvasId,
    canvasName,
    canvasTags,
    backgroundPattern,
    backgroundColor,
    drawStrokes,
    loadCanvas,
  } = useCanvasStore();

  const {
    syncEnabled,
    syncUsername,
    getFirebaseConfig,
    setLastSyncAt,
  } = useSyncStore();

  // Serialize current canvas state for sync (strip large base64 from image cards)
  const getCanvasData = useCallback((): CanvasSyncData => {
    // Clean cards: replace base64 image content with placeholder if no Imgur URL
    const cleanCards: Record<string, unknown> = {};
    Object.entries(cards).forEach(([id, card]) => {
      const cleaned = { ...card };
      // Don't sync base64 blobs - only Imgur URLs
      if (cleaned.contentType === 'image' && cleaned.content.startsWith('data:')) {
        cleaned.content = ''; // Will be empty if not uploaded to Imgur
      }
      if (cleaned.imageUrl?.startsWith('data:')) {
        cleaned.imageUrl = '';
      }
      // Remove Set serialization issues
      cleanCards[id] = cleaned;
    });

    return {
      cards: cleanCards,
      connections,
      structures,
      groups,
      canvasId,
      canvasName,
      canvasTags,
      backgroundPattern,
      backgroundColor,
      drawStrokes,
      updatedAt: Date.now(),
    };
  }, [cards, connections, structures, groups, canvasId, canvasName, canvasTags, backgroundPattern, backgroundColor, drawStrokes]);

  // Push to Firebase
  const push = useCallback(async () => {
    const config = getFirebaseConfig() as FirebaseConfig | null;
    if (!config?.databaseURL || !syncUsername || !syncEnabled) return;

    const data = getCanvasData();
    const hash = JSON.stringify({ cards: Object.keys(data.cards).length, connections: Object.keys(data.connections).length });

    // Skip if nothing changed
    if (hash === lastPushHash.current) return;

    const result = await pushToFirebase(config, syncUsername, canvasId, data);
    if (result.success) {
      lastPushHash.current = hash;
      setLastSyncAt(Date.now());
    }
  }, [getFirebaseConfig, syncUsername, syncEnabled, canvasId, getCanvasData, setLastSyncAt]);

  // Pull from Firebase
  const pull = useCallback(async () => {
    const config = getFirebaseConfig() as FirebaseConfig | null;
    if (!config?.databaseURL || !syncUsername || !syncEnabled) return;

    const result = await pullFromFirebase(config, syncUsername, canvasId);
    if (result.success && result.data) {
      loadCanvas({
        cards: result.data.cards as Record<string, any>,
        connections: result.data.connections as Record<string, any>,
        structures: result.data.structures as Record<string, any>,
        groups: result.data.groups as Record<string, any>,
        canvasId: result.data.canvasId,
        canvasName: result.data.canvasName,
        canvasTags: result.data.canvasTags,
        backgroundPattern: result.data.backgroundPattern as any,
        backgroundColor: result.data.backgroundColor,
      });
      setLastSyncAt(Date.now());
    }
  }, [getFirebaseConfig, syncUsername, syncEnabled, canvasId, loadCanvas, setLastSyncAt]);

  // Auto-push debounced on data changes
  useEffect(() => {
    if (!syncEnabled) return;

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      push();
    }, DEBOUNCE_MS);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [syncEnabled, cards, connections, structures, groups, canvasName, backgroundPattern, push]);

  // Pull on mount if sync is enabled
  useEffect(() => {
    if (syncEnabled) {
      pull();
    }
  // Only run on mount / sync enable
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncEnabled]);

  return { push, pull };
}

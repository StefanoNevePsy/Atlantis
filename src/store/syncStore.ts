import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SyncState {
  // Firebase configuration (JSON string from Firebase console)
  firebaseConfigJson: string;
  // Username for identifying this device in the database
  syncUsername: string;
  // Sync status
  syncEnabled: boolean;
  lastSyncAt: number | null;

  // Actions
  setFirebaseConfig: (json: string) => void;
  setSyncUsername: (username: string) => void;
  setSyncEnabled: (enabled: boolean) => void;
  setLastSyncAt: (timestamp: number) => void;
  clearConfig: () => void;
  getFirebaseConfig: () => Record<string, string> | null;
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set, get) => ({
      firebaseConfigJson: '',
      syncUsername: '',
      syncEnabled: false,
      lastSyncAt: null,

      setFirebaseConfig: (json) => set({ firebaseConfigJson: json }),
      setSyncUsername: (username) => set({ syncUsername: username }),
      setSyncEnabled: (enabled) => set({ syncEnabled: enabled }),
      setLastSyncAt: (timestamp) => set({ lastSyncAt: timestamp }),

      clearConfig: () =>
        set({
          firebaseConfigJson: '',
          syncUsername: '',
          syncEnabled: false,
          lastSyncAt: null,
        }),

      getFirebaseConfig: () => {
        const json = get().firebaseConfigJson;
        if (!json) return null;
        try {
          return JSON.parse(json);
        } catch {
          return null;
        }
      },
    }),
    {
      name: 'atlantis-sync',
    }
  )
);

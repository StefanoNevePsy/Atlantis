import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import type { CanvasData, FolderData, WorkspaceData } from '../types';

interface WorkspaceState extends WorkspaceData {
  // Actions
  createCanvas: (name?: string, folderId?: string) => string;
  duplicateCanvas: (canvasId: string) => string;
  deleteCanvas: (canvasId: string) => void;
  archiveCanvas: (canvasId: string) => void;
  updateCanvas: (canvasId: string, updates: Partial<CanvasData>) => void;
  saveCanvasState: (canvasId: string, data: Partial<CanvasData>) => void;

  // Folders
  createFolder: (name: string, color?: string) => string;
  deleteFolder: (folderId: string) => void;
  renameFolder: (folderId: string, name: string) => void;
  moveCanvasToFolder: (canvasId: string, folderId: string | undefined) => void;

  // Search
  searchCanvases: (query: string) => CanvasData[];
  getCanvasesByTag: (tag: string) => CanvasData[];
  getCanvasesByFolder: (folderId: string | undefined) => CanvasData[];
}

const createEmptyCanvas = (name: string, folderId?: string): CanvasData => {
  const now = Date.now();
  return {
    id: nanoid(),
    name,
    description: '',
    cards: {},
    connections: {},
    structures: {},
    groups: {},
    viewport: { offset: { x: 0, y: 0 }, zoom: 1 },
    backgroundPattern: 'dots',
    backgroundColor: '#f5f0e8',
    tags: [],
    createdAt: now,
    updatedAt: now,
    folderId,
  };
};

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      canvases: {},
      folders: {},
      recentCanvasIds: [],

      createCanvas: (name = 'Untitled Canvas', folderId?) => {
        const canvas = createEmptyCanvas(name, folderId);
        set((state) => ({
          canvases: { ...state.canvases, [canvas.id]: canvas },
          recentCanvasIds: [canvas.id, ...state.recentCanvasIds].slice(0, 20),
        }));
        if (folderId) {
          const folder = get().folders[folderId];
          if (folder) {
            set((state) => ({
              folders: {
                ...state.folders,
                [folderId]: {
                  ...folder,
                  canvasIds: [...folder.canvasIds, canvas.id],
                },
              },
            }));
          }
        }
        return canvas.id;
      },

      duplicateCanvas: (canvasId) => {
        const original = get().canvases[canvasId];
        if (!original) return '';
        const newCanvas: CanvasData = {
          ...original,
          id: nanoid(),
          name: `${original.name} (Copy)`,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((state) => ({
          canvases: { ...state.canvases, [newCanvas.id]: newCanvas },
        }));
        return newCanvas.id;
      },

      deleteCanvas: (canvasId) => {
        set((state) => {
          const newCanvases = { ...state.canvases };
          delete newCanvases[canvasId];
          return {
            canvases: newCanvases,
            recentCanvasIds: state.recentCanvasIds.filter((id) => id !== canvasId),
          };
        });
      },

      archiveCanvas: (canvasId) => {
        get().updateCanvas(canvasId, {
          tags: [...(get().canvases[canvasId]?.tags || []), '_archived'],
        });
      },

      updateCanvas: (canvasId, updates) => {
        set((state) => {
          const canvas = state.canvases[canvasId];
          if (!canvas) return state;
          return {
            canvases: {
              ...state.canvases,
              [canvasId]: { ...canvas, ...updates, updatedAt: Date.now() },
            },
          };
        });
      },

      saveCanvasState: (canvasId, data) => {
        set((state) => {
          const canvas = state.canvases[canvasId];
          if (!canvas) return state;
          return {
            canvases: {
              ...state.canvases,
              [canvasId]: { ...canvas, ...data, updatedAt: Date.now() },
            },
            recentCanvasIds: [
              canvasId,
              ...state.recentCanvasIds.filter((id) => id !== canvasId),
            ].slice(0, 20),
          };
        });
      },

      createFolder: (name, color = '#7c5cbf') => {
        const id = nanoid();
        const folder: FolderData = { id, name, color, canvasIds: [] };
        set((state) => ({
          folders: { ...state.folders, [id]: folder },
        }));
        return id;
      },

      deleteFolder: (folderId) => {
        set((state) => {
          const newFolders = { ...state.folders };
          const folder = newFolders[folderId];
          if (folder) {
            // Unassign canvases from folder
            const newCanvases = { ...state.canvases };
            folder.canvasIds.forEach((cid) => {
              if (newCanvases[cid]) {
                newCanvases[cid] = { ...newCanvases[cid], folderId: undefined };
              }
            });
            delete newFolders[folderId];
            return { folders: newFolders, canvases: newCanvases };
          }
          return state;
        });
      },

      renameFolder: (folderId, name) => {
        set((state) => {
          const folder = state.folders[folderId];
          if (!folder) return state;
          return {
            folders: { ...state.folders, [folderId]: { ...folder, name } },
          };
        });
      },

      moveCanvasToFolder: (canvasId, folderId) => {
        set((state) => {
          const canvas = state.canvases[canvasId];
          if (!canvas) return state;

          const newFolders = { ...state.folders };
          // Remove from old folder
          if (canvas.folderId && newFolders[canvas.folderId]) {
            newFolders[canvas.folderId] = {
              ...newFolders[canvas.folderId],
              canvasIds: newFolders[canvas.folderId].canvasIds.filter((id) => id !== canvasId),
            };
          }
          // Add to new folder
          if (folderId && newFolders[folderId]) {
            newFolders[folderId] = {
              ...newFolders[folderId],
              canvasIds: [...newFolders[folderId].canvasIds, canvasId],
            };
          }

          return {
            canvases: {
              ...state.canvases,
              [canvasId]: { ...canvas, folderId },
            },
            folders: newFolders,
          };
        });
      },

      searchCanvases: (query) => {
        const q = query.toLowerCase();
        return Object.values(get().canvases).filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.tags.some((t) => t.toLowerCase().includes(q)) ||
            c.description.toLowerCase().includes(q)
        );
      },

      getCanvasesByTag: (tag) => {
        return Object.values(get().canvases).filter((c) =>
          c.tags.includes(tag)
        );
      },

      getCanvasesByFolder: (folderId) => {
        return Object.values(get().canvases).filter(
          (c) => c.folderId === folderId
        );
      },
    }),
    {
      name: 'atlantis-workspace',
    }
  )
);

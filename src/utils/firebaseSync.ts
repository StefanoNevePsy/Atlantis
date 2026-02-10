// Firebase Realtime Database REST API sync
// No SDK dependency - uses raw fetch against the REST endpoints
// Only syncs canvas data (cards, connections, structures, groups, metadata)
// Images are stored as Imgur URLs, NOT base64 blobs

export interface FirebaseConfig {
  databaseURL: string;
  apiKey?: string;
  [key: string]: string | undefined;
}

export interface CanvasSyncData {
  cards: Record<string, unknown>;
  connections: Record<string, unknown>;
  structures: Record<string, unknown>;
  groups: Record<string, unknown>;
  canvasId: string;
  canvasName: string;
  canvasTags: string[];
  backgroundPattern: string;
  backgroundColor: string;
  drawStrokes: unknown[];
  updatedAt: number;
}

function getDbUrl(config: FirebaseConfig, path: string): string {
  const base = config.databaseURL.replace(/\/$/, '');
  if (config.apiKey) {
    return `${base}/${path}.json?auth=${config.apiKey}`;
  }
  return `${base}/${path}.json`;
}

/**
 * Push canvas data to Firebase Realtime Database
 */
export async function pushToFirebase(
  config: FirebaseConfig,
  username: string,
  canvasId: string,
  data: CanvasSyncData
): Promise<{ success: boolean; error?: string }> {
  try {
    const url = getDbUrl(config, `users/${username}/canvases/${canvasId}`);
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        updatedAt: Date.now(),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `Firebase error: ${response.status} - ${errorText}` };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Network error',
    };
  }
}

/**
 * Pull canvas data from Firebase Realtime Database
 */
export async function pullFromFirebase(
  config: FirebaseConfig,
  username: string,
  canvasId: string
): Promise<{ success: boolean; data?: CanvasSyncData; error?: string }> {
  try {
    const url = getDbUrl(config, `users/${username}/canvases/${canvasId}`);
    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `Firebase error: ${response.status} - ${errorText}` };
    }

    const data = await response.json();
    if (!data) {
      return { success: true, data: undefined };
    }

    return { success: true, data: data as CanvasSyncData };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Network error',
    };
  }
}

/**
 * List all canvas IDs for a user
 */
export async function listCanvases(
  config: FirebaseConfig,
  username: string
): Promise<{ success: boolean; canvases?: { id: string; name: string; updatedAt: number }[]; error?: string }> {
  try {
    const url = getDbUrl(config, `users/${username}/canvases`);
    const response = await fetch(url);

    if (!response.ok) {
      return { success: false, error: `Firebase error: ${response.status}` };
    }

    const data = await response.json();
    if (!data) {
      return { success: true, canvases: [] };
    }

    const canvases = Object.entries(data).map(([id, val]: [string, any]) => ({
      id,
      name: val.canvasName || 'Untitled',
      updatedAt: val.updatedAt || 0,
    }));

    return { success: true, canvases };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Network error',
    };
  }
}

/**
 * Delete a canvas from Firebase
 */
export async function deleteFromFirebase(
  config: FirebaseConfig,
  username: string,
  canvasId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const url = getDbUrl(config, `users/${username}/canvases/${canvasId}`);
    const response = await fetch(url, { method: 'DELETE' });

    if (!response.ok) {
      return { success: false, error: `Firebase error: ${response.status}` };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Network error',
    };
  }
}

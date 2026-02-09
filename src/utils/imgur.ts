const IMGUR_UPLOAD_URL = 'https://api.imgur.com/3/image';

export interface ImgurUploadResult {
  success: boolean;
  url?: string;
  deleteHash?: string;
  error?: string;
}

/**
 * Upload a base64 image to Imgur anonymous album.
 * Returns the direct image URL on success.
 */
export async function uploadToImgur(
  base64Data: string,
  clientId: string
): Promise<ImgurUploadResult> {
  if (!clientId) {
    return { success: false, error: 'No Imgur Client ID configured' };
  }

  // Strip data URI prefix if present
  const imageData = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');

  try {
    const response = await fetch(IMGUR_UPLOAD_URL, {
      method: 'POST',
      headers: {
        Authorization: `Client-ID ${clientId}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: imageData,
        type: 'base64',
      }),
    });

    const data = await response.json();

    if (data.success) {
      return {
        success: true,
        url: data.data.link,
        deleteHash: data.data.deletehash,
      };
    } else {
      return {
        success: false,
        error: data.data?.error || 'Upload failed',
      };
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Network error',
    };
  }
}

/**
 * Convert a File/Blob to base64 data URI string.
 */
export function fileToBase64(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

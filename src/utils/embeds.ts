// Embed detection and URL utilities

export interface EmbedInfo {
  type: 'youtube' | 'gif' | 'image' | 'webpage';
  embedUrl: string;
  thumbnailUrl?: string;
  title?: string;
}

// Extract YouTube video ID from various URL formats
export function getYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const pat of patterns) {
    const match = url.match(pat);
    if (match) return match[1];
  }
  return null;
}

// Detect what kind of embed a URL is
export function detectEmbed(url: string): EmbedInfo | null {
  if (!url) return null;

  try {
    const parsed = new URL(url);

    // YouTube
    const ytId = getYouTubeId(url);
    if (ytId) {
      return {
        type: 'youtube',
        embedUrl: `https://www.youtube.com/embed/${ytId}`,
        thumbnailUrl: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
      };
    }

    // GIF
    if (/\.gif(\?.*)?$/i.test(parsed.pathname)) {
      return { type: 'gif', embedUrl: url };
    }

    // Image
    if (/\.(png|jpe?g|webp|svg|bmp|ico)(\?.*)?$/i.test(parsed.pathname)) {
      return { type: 'image', embedUrl: url };
    }

    // Giphy embed URLs
    if (parsed.hostname.includes('giphy.com')) {
      const giphyMatch = url.match(/giphy\.com\/(?:gifs|media)\/(?:.*-)?([a-zA-Z0-9]+)/);
      if (giphyMatch) {
        return {
          type: 'gif',
          embedUrl: `https://media.giphy.com/media/${giphyMatch[1]}/giphy.gif`,
        };
      }
    }

    // Imgur direct
    if (parsed.hostname.includes('imgur.com') && /\.(gif|gifv)$/i.test(parsed.pathname)) {
      return {
        type: 'gif',
        embedUrl: url.replace('.gifv', '.gif'),
      };
    }

    // Generic webpage
    return {
      type: 'webpage',
      embedUrl: url,
      title: parsed.hostname,
    };
  } catch {
    return null;
  }
}

// Check if a string is a URL
export function isUrl(text: string): boolean {
  try {
    const url = new URL(text.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

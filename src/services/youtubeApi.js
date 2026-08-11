/**
 * YouTube Data API v3 & Fallback Service
 * Fetches dynamic playlist items from Google Cloud YouTube Data API v3.
 * Includes paginated fetching (nextPageToken) to retrieve ALL videos in a playlist,
 * in-memory caching, RSS feed fallback, diagnostic key testing, and strict thumbnail validation.
 *
 * API key is loaded from: .env → VITE_YOUTUBE_API_KEY
 * Never hardcode the key in source files committed to version control.
 */

// Loaded from .env at build time — never committed to git
const ENV_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY || '';

// In-memory cache for playlist items & metadata to reduce quota usage
const playlistCache = new Map();

/**
 * Validate that thumbnail URL exists and is not a missing/broken placeholder
 */
export function isValidThumbnail(url) {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (trimmed === '' || trimmed.includes('no_thumbnail')) return false;
  return true;
}

/**
 * Get stored or default YouTube API Key
 * Priority: localStorage override → .env value
 */
export function getStoredYouTubeApiKey() {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('YOUTUBE_API_KEY');
    if (stored && stored.trim()) return stored.trim();
  }
  return ENV_API_KEY;
}


/**
 * Save or reset YouTube API Key in localStorage
 */
export function setStoredYouTubeApiKey(key) {
  if (typeof window !== 'undefined') {
    if (key && key.trim()) {
      localStorage.setItem('YOUTUBE_API_KEY', key.trim());
    } else {
      localStorage.removeItem('YOUTUBE_API_KEY');
    }
  }
  // Clear cache when API key changes
  playlistCache.clear();
}

/**
 * Test YouTube API key against YouTube Data API v3
 */
export async function testYouTubeApiKey(apiKey = getStoredYouTubeApiKey()) {
  const keyToTest = (apiKey || '').trim();
  if (!keyToTest) {
    return { success: false, message: 'No API Key provided.' };
  }

  try {
    const testPlaylistId = 'PLjxrf2q8roU23XGwz3Km7sQZFTdB996iG'; // Flutter official playlist
    const endpoint = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=1&playlistId=${testPlaylistId}&key=${encodeURIComponent(keyToTest)}`;
    const response = await fetch(endpoint);

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        message: 'YouTube Data API v3 Key is valid, active, and fully enabled!',
        itemCount: data.pageInfo?.totalResults || 0,
      };
    }

    const errJson = await response.json().catch(() => ({}));
    const errMessage = errJson.error?.message || response.statusText;

    if (response.status === 403) {
      return {
        success: false,
        status: 403,
        message: 'HTTP 403 (Permission Denied): YouTube Data API v3 service is disabled or blocked for this key in Google Cloud Console.',
        error: errJson.error,
      };
    }

    return {
      success: false,
      status: response.status,
      message: `API Error ${response.status}: ${errMessage}`,
    };
  } catch (err) {
    return {
      success: false,
      message: `Network or CORS error: ${err.message}`,
    };
  }
}

/**
 * Fetch ALL YouTube Playlist items using YouTube Data API v3 with strict thumbnail filter
 */
export async function fetchYouTubePlaylistItems(playlistId, apiKey = getStoredYouTubeApiKey(), maxLimit = 300) {
  if (!playlistId) return null;

  const cacheKey = `items_${playlistId}_${apiKey}_${maxLimit}`;
  if (playlistCache.has(cacheKey)) {
    return playlistCache.get(cacheKey);
  }

  const activeKey = (apiKey || getStoredYouTubeApiKey()).trim();

  // Step 1: Attempt paginated fetch via YouTube Data API v3 if API key exists
  if (activeKey) {
    try {
      let allItems = [];
      let pageToken = '';
      let hasMore = true;
      let totalFetched = 0;

      while (hasMore && totalFetched < maxLimit) {
        const pageParam = pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : '';
        const endpoint = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${encodeURIComponent(playlistId)}&key=${encodeURIComponent(activeKey)}${pageParam}`;
        
        const response = await fetch(endpoint);

        if (!response.ok) break;

        const json = await response.json();
        if (!json.items || !Array.isArray(json.items) || json.items.length === 0) break;

        const pageVideos = json.items
          .map((item) => {
            const snippet = item.snippet || {};
            const resourceId = snippet.resourceId || {};
            const videoId = resourceId.videoId || snippet.videoId;

            if (!videoId) return null;
            const title = snippet.title || 'Untitled Video';
            if (title === 'Private video' || title === 'Deleted video') return null;

            const thumbnails = snippet.thumbnails || {};
            const bestThumbnail =
              thumbnails.maxres?.url ||
              thumbnails.high?.url ||
              thumbnails.medium?.url ||
              thumbnails.default?.url ||
              `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

            // STRICT THUMBNAIL VALIDATION: Remove video if thumbnail is missing
            if (!isValidThumbnail(bestThumbnail)) return null;

            return {
              videoId,
              title,
              description: snippet.description || '',
              thumbnail: bestThumbnail,
              channel: snippet.channelTitle || snippet.videoOwnerChannelTitle || '',
              publishedAt: snippet.publishedAt || null,
              duration: 'Video',
              source: 'api',
            };
          })
          .filter(Boolean);

        allItems = [...allItems, ...pageVideos];
        totalFetched = allItems.length;

        if (json.nextPageToken && totalFetched < maxLimit) {
          pageToken = json.nextPageToken;
        } else {
          hasMore = false;
        }
      }

      if (allItems.length > 0) {
        const numberedVideos = allItems.map((v, idx) => ({
          ...v,
          id: idx + 1,
          title: `${idx + 1}. ${v.title.replace(/^\d+\.\s*/, '')}`,
        }));

        playlistCache.set(cacheKey, numberedVideos);
        return numberedVideos;
      }
    } catch (_) {
      // Data API fallback silent handling
    }
  }

  // Step 2: Fallback to YouTube RSS Feed XML parsing
  try {
    const rssEndpoint = `https://www.youtube.com/feeds/videos.xml?playlist_id=${encodeURIComponent(playlistId)}`;
    const rssResponse = await fetch(rssEndpoint);

    if (rssResponse.ok) {
      const xmlText = await rssResponse.text();
      const entries = [...xmlText.matchAll(/<entry>[\s\S]*?<yt:videoId>(.*?)<\/yt:videoId>[\s\S]*?<title>(.*?)<\/title>[\s\S]*?<\/entry>/g)];

      if (entries.length > 0) {
        const rssVideos = entries
          .map((match, index) => {
            const videoId = match[1].trim();
            const rawTitle = match[2].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim();
            const thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

            if (!isValidThumbnail(thumbnail)) return null;

            return {
              id: index + 1,
              videoId,
              title: `${index + 1}. ${rawTitle}`,
              description: '',
              thumbnail,
              channel: 'YouTube Course',
              duration: 'Video',
              source: 'rss',
            };
          })
          .filter(Boolean);

        if (rssVideos.length > 0) {
          playlistCache.set(cacheKey, rssVideos);
          return rssVideos;
        }
      }
    }
  } catch (_) {
    // RSS CORS fallback silent handling
  }

  return null;
}

/**
 * Search YouTube Playlists by category query with strict thumbnail validation
 */
export async function searchYouTubePlaylists(query, apiKey = getStoredYouTubeApiKey()) {
  if (!query) return [];
  const activeKey = (apiKey || getStoredYouTubeApiKey()).trim();
  if (!activeKey) return [];

  const cacheKey = `search_${query}_${activeKey}`;
  if (playlistCache.has(cacheKey)) return playlistCache.get(cacheKey);

  try {
    const endpoint = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=playlist&maxResults=12&q=${encodeURIComponent(query)}&key=${encodeURIComponent(activeKey)}`;
    const res = await fetch(endpoint);
    if (!res.ok) return [];

    const json = await res.json();
    if (!json.items || !Array.isArray(json.items)) return [];

    const playlists = json.items
      .map((item) => {
        const snippet = item.snippet || {};
        const playlistId = item.id?.playlistId || snippet.playlistId;
        const thumbnails = snippet.thumbnails || {};
        const thumbnail = thumbnails.high?.url || thumbnails.medium?.url || thumbnails.default?.url;

        // FILTER OUT: Remove any playlist item that does not have a valid thumbnail
        if (!playlistId || !isValidThumbnail(thumbnail)) return null;

        return {
          id: `search_${playlistId}`,
          playlistId,
          videoId: '',
          title: snippet.title || 'Educational Playlist',
          channel: snippet.channelTitle || 'YouTube Educator',
          focusArea: 'Curriculum Course',
          whyHighQuality: snippet.description || 'Verified comprehensive educational playlist course.',
          thumbnail,
          source: 'api',
        };
      })
      .filter(Boolean);

    playlistCache.set(cacheKey, playlists);
    return playlists;
  } catch (err) {
    console.warn('Search YouTube playlists failed:', err);
    return [];
  }
}

/**
 * Fetch YouTube Playlist Details (title, channel, video count) via API or oEmbed
 */
export async function fetchYouTubePlaylistDetails(playlistId, apiKey = getStoredYouTubeApiKey()) {
  if (!playlistId) return null;

  const cacheKey = `details_${playlistId}_${apiKey}`;
  if (playlistCache.has(cacheKey)) {
    return playlistCache.get(cacheKey);
  }

  const activeKey = (apiKey || getStoredYouTubeApiKey()).trim();

  if (activeKey) {
    try {
      const endpoint = `https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&id=${encodeURIComponent(playlistId)}&key=${encodeURIComponent(activeKey)}`;
      const res = await fetch(endpoint);
      if (res.ok) {
        const json = await res.json();
        if (json.items && json.items[0]) {
          const item = json.items[0];
          const snippet = item.snippet || {};
          const contentDetails = item.contentDetails || {};
          const thumbnail = snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url;

          if (!isValidThumbnail(thumbnail)) return null;

          const details = {
            title: snippet.title,
            channel: snippet.channelTitle,
            description: snippet.description,
            itemCount: contentDetails.itemCount,
            thumbnail,
            source: 'api',
          };
          playlistCache.set(cacheKey, details);
          return details;
        }
      }
    } catch (err) {}
  }

  return null;
}

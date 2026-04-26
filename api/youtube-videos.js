function readPositiveInteger(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

const CHANNEL_HANDLE = process.env.YOUTUBE_HANDLE || "@Mingomania_Music";
const MAX_RESULTS = readPositiveInteger(process.env.YOUTUBE_MAX_RESULTS, 12);
const PLAYLIST_SCAN_LIMIT = Math.max(
  MAX_RESULTS,
  500,
  readPositiveInteger(process.env.YOUTUBE_PLAYLIST_SCAN_LIMIT, 500),
);
const RELEASES_PLAYLIST_ID =
  process.env.YOUTUBE_RELEASES_PLAYLIST_ID || "PL5RtHtE2nWBVvzVa_D8cm77Zz1FIDK58-";

async function youtubeRequest(url) {
  const response = await fetch(url);

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`YouTube API error ${response.status}: ${body}`);
  }

  return response.json();
}

async function loadPlaylistItems(apiKey) {
  const items = [];
  let pageToken = "";

  while (items.length < PLAYLIST_SCAN_LIMIT) {
    const remaining = PLAYLIST_SCAN_LIMIT - items.length;
    const pageSize = Math.min(50, remaining);
    const pageTokenParam = pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : "";
    const playlistUrl =
      `https://www.googleapis.com/youtube/v3/playlistItems` +
      `?part=snippet,contentDetails` +
      `&playlistId=${encodeURIComponent(RELEASES_PLAYLIST_ID)}` +
      `&maxResults=${encodeURIComponent(pageSize)}` +
      pageTokenParam +
      `&key=${encodeURIComponent(apiKey)}`;

    const playlistData = await youtubeRequest(playlistUrl);
    items.push(...(playlistData.items || []));

    if (!playlistData.nextPageToken) {
      break;
    }

    pageToken = playlistData.nextPageToken;
  }

  return items;
}

export default async function handler(req, res) {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "Missing YOUTUBE_API_KEY",
    });
  }

  try {
    const channelUrl =
      `https://www.googleapis.com/youtube/v3/channels` +
      `?part=snippet` +
      `&forHandle=${encodeURIComponent(CHANNEL_HANDLE)}` +
      `&key=${encodeURIComponent(apiKey)}`;

    const channelData = await youtubeRequest(channelUrl);
    const channel = channelData.items && channelData.items[0];

    const playlistItems = await loadPlaylistItems(apiKey);
    const videos = playlistItems
      .map((item) => {
        const snippet = item.snippet || {};
        const contentDetails = item.contentDetails || {};
        const thumbnails = snippet.thumbnails || {};
        const bestThumb =
          thumbnails.maxres?.url ||
          thumbnails.standard?.url ||
          thumbnails.high?.url ||
          thumbnails.medium?.url ||
          thumbnails.default?.url ||
          "";

        return {
          id: item.id,
          videoId: contentDetails.videoId || "",
          title: snippet.title || "Untitled video",
          description: snippet.description || "",
          publishedAt: contentDetails.videoPublishedAt || snippet.publishedAt || "",
          addedAt: snippet.publishedAt || "",
          thumbnail: bestThumb,
          channelTitle: snippet.channelTitle || channel?.snippet?.title || "Mingomania",
        };
      })
      .filter((video) => video.videoId)
      .sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt))
      .slice(0, MAX_RESULTS);

    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=30, stale-while-revalidate=30");

    return res.status(200).json({
      channelTitle: channel?.snippet?.title || "Mingomania",
      handle: CHANNEL_HANDLE,
      playlistId: RELEASES_PLAYLIST_ID,
      scannedItems: playlistItems.length,
      videos,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to load YouTube videos",
      details: error.message,
    });
  }
}

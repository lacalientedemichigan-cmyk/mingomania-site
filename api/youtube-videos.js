const CHANNEL_HANDLE = process.env.YOUTUBE_HANDLE || "@Mingomania_Music";
const MAX_RESULTS = Number(process.env.YOUTUBE_MAX_RESULTS || 12);
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

    const playlistUrl =
      `https://www.googleapis.com/youtube/v3/playlistItems` +
      `?part=snippet,contentDetails` +
      `&playlistId=${encodeURIComponent(RELEASES_PLAYLIST_ID)}` +
      `&maxResults=${encodeURIComponent(MAX_RESULTS)}` +
      `&key=${encodeURIComponent(apiKey)}`;

    const playlistData = await youtubeRequest(playlistUrl);

    const videos = (playlistData.items || [])
      .map((item) => {
        const snippet = item.snippet || {};
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
          videoId: item.contentDetails?.videoId || "",
          title: snippet.title || "Untitled video",
          description: snippet.description || "",
          publishedAt: snippet.publishedAt || "",
          thumbnail: bestThumb,
          channelTitle: snippet.channelTitle || channel?.snippet?.title || "Mingomania",
        };
      })
      .filter((video) => video.videoId);

    res.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate=3600");

    return res.status(200).json({
      channelTitle: channel?.snippet?.title || "Mingomania",
      handle: CHANNEL_HANDLE,
      playlistId: RELEASES_PLAYLIST_ID,
      videos,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to load YouTube videos",
      details: error.message,
    });
  }
}

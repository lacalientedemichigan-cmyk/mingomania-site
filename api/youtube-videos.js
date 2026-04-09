const CHANNEL_HANDLE = process.env.YOUTUBE_HANDLE || "@Mingomania_Music";
const MAX_RESULTS = Number(process.env.YOUTUBE_MAX_RESULTS || 12);

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
      `?part=contentDetails,snippet` +
      `&forHandle=${encodeURIComponent(CHANNEL_HANDLE)}` +
      `&key=${encodeURIComponent(apiKey)}`;

    const channelData = await youtubeRequest(channelUrl);
    const channel = channelData.items && channelData.items[0];

    if (!channel) {
      return res.status(404).json({
        error: `No channel found for handle ${CHANNEL_HANDLE}`,
      });
    }

    const uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads;

    if (!uploadsPlaylistId) {
      return res.status(404).json({
        error: "Uploads playlist not found",
      });
    }

    const playlistUrl =
      `https://www.googleapis.com/youtube/v3/playlistItems` +
      `?part=snippet,contentDetails` +
      `&playlistId=${encodeURIComponent(uploadsPlaylistId)}` +
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
          channelTitle: snippet.channelTitle || channel.snippet?.title || "Mingomania",
        };
      })
      .filter((video) => video.videoId);

    res.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate=3600");

    return res.status(200).json({
      channelTitle: channel.snippet?.title || "Mingomania",
      handle: CHANNEL_HANDLE,
      videos,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to load YouTube videos",
      details: error.message,
    });
  }
}

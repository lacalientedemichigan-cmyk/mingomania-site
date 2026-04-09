const featuredContainer = document.getElementById("featured-videos");
const quickPicksContainer = document.getElementById("quick-picks");

function formatDate(value) {
  try {
    return new Date(value).toLocaleDateString("es-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (error) {
    return "";
  }
}

function truncate(text, maxLength) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1)}...`;
}

function renderFeatured(videos) {
  if (!featuredContainer) return;

  if (!videos.length) {
    featuredContainer.innerHTML = `
      <article class="cover-card placeholder-card">
        <div class="cover-art"><span>YT</span></div>
        <h3>No pudimos cargar releases</h3>
        <p>Revisa la API key, la playlist o la configuracion del deploy.</p>
      </article>
    `;
    return;
  }

  featuredContainer.innerHTML = videos.slice(0, 5).map((video) => `
    <a
      class="cover-card video-card"
      href="https://www.youtube.com/watch?v=${video.videoId}"
      target="_blank"
      rel="noreferrer"
    >
      <img
        class="cover-thumb"
        src="${video.thumbnail}"
        alt="${video.title}"
        loading="lazy"
      >
      <h3>${truncate(video.title, 44)}</h3>
      <p>${formatDate(video.publishedAt)}</p>
    </a>
  `).join("");
}

function renderQuickPicks(videos) {
  if (!quickPicksContainer) return;

  if (!videos.length) {
    quickPicksContainer.innerHTML = `
      <article class="quick-item">
        <span class="quick-dot"></span>
        <div>
          <h3>Sin contenido</h3>
          <p>Cuando la playlist responda, esta lista se llena sola.</p>
        </div>
      </article>
    `;
    return;
  }

  quickPicksContainer.innerHTML = videos.slice(0, 8).map((video) => `
    <a
      class="quick-item quick-link"
      href="https://www.youtube.com/watch?v=${video.videoId}"
      target="_blank"
      rel="noreferrer"
    >
      <span class="quick-dot"></span>
      <div>
        <h3>${truncate(video.title, 34)}</h3>
        <p>${formatDate(video.publishedAt)}</p>
      </div>
    </a>
  `).join("");
}

async function loadVideos() {
  try {
    const response = await fetch("/api/youtube-videos");
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = await response.json();
    const videos = Array.isArray(payload.videos) ? payload.videos : [];

    renderFeatured(videos);
    renderQuickPicks(videos);
  } catch (error) {
    renderFeatured([]);
    renderQuickPicks([]);
  }
}

loadVideos();

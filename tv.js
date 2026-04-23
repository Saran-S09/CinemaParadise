const API_KEY = "0ad6526135eb6a510c0d21afee0d557e";
const BASE = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p/w500";

// ✅ FIX: SUPPORT BOTH id AND tv
const params = new URLSearchParams(window.location.search);
const tvId = params.get("id") || params.get("tv");

console.log("TV ID:", tvId);

// BACK
function goBack() {
  window.history.back();
}

// LOAD TV DETAILS
async function loadTV() {
  try {

    if (!tvId) {
      alert("TV ID not found");
      return;
    }

    // =====================
    // TV DETAILS
    // =====================
    const res = await fetch(`${BASE}/tv/${tvId}?api_key=${API_KEY}`);
    const data = await res.json();

    console.log("TV DATA:", data);

    document.getElementById("poster").src =
      data.poster_path ? IMG + data.poster_path : "";

    document.getElementById("title").innerText =
      data.name || "No Title";

    document.getElementById("rating").innerText =
      "⭐ " + (data.vote_average || "N/A");

    document.getElementById("overview").innerText =
      data.overview || "No description";

    // =====================
    // 🎬 TRAILER
    // =====================
    const vidRes = await fetch(`${BASE}/tv/${tvId}/videos?api_key=${API_KEY}`);
    const vidData = await vidRes.json();

    console.log("VIDEOS:", vidData);

    const trailerFrame = document.getElementById("trailer");

    const videos = vidData.results?.filter(v => v.site === "YouTube") || [];

    let video =
      videos.find(v => v.type === "Trailer" && v.official) ||
      videos.find(v => v.type === "Trailer") ||
      videos.find(v => v.type === "Teaser") ||
      videos.find(v => v.type === "Clip") ||
      videos[0];

    if (video && video.key) {
      trailerFrame.src =
        `https://www.youtube.com/embed/${video.key}?autoplay=1&mute=1`;
    } else {
      trailerFrame.style.display = "none";
    }

    // =====================
    // 📺 SEASONS
    // =====================
    const container = document.getElementById("seasonList");
    container.innerHTML = "";

    console.log("SEASONS:", data.seasons);

    data.seasons.forEach(season => {
      if (!season.poster_path) return;

      container.innerHTML += `
        <div class="movie" onclick="loadSeason(${season.season_number})">
          <img src="${IMG + season.poster_path}">
          <p>${season.name}</p>
        </div>
      `;
    });

  } catch (err) {
    console.error("Error:", err);
  }
}

// =====================
// LOAD SEASON DETAILS
// =====================
async function loadSeason(seasonNumber) {

  const res = await fetch(
    `${BASE}/tv/${tvId}/season/${seasonNumber}?api_key=${API_KEY}`
  );
  const data = await res.json();

  const box = document.getElementById("seasonDetails");

  box.innerHTML = `
    <div class="season-box">

      <h2>${data.name}</h2>
      <p>${data.overview || "No description available"}</p>

      <h3>Episodes</h3>

      <div class="episode-list">
        ${data.episodes.map(ep => `
          <div class="episode-item">
            <b>Ep ${ep.episode_number}:</b> ${ep.name}
          </div>
        `).join("")}
      </div>

    </div>
  `;

  box.scrollIntoView({ behavior: "smooth" });
}

// INIT
loadTV();
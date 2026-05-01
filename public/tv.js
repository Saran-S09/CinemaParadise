const BASE = "/api/tmdb";
const IMG = "https://image.tmdb.org/t/p/w500";

const params = new URLSearchParams(window.location.search);
const tvId = params.get("id") || params.get("tv");


const LANGUAGES = [
  { code: "en-US", label: "English" },
  { code: "ta-IN", label: "Tamil" },
  { code: "hi-IN", label: "Hindi" },
  { code: "te-IN", label: "Telugu" },
  { code: "ml-IN", label: "Malayalam" }
];

function goBack() {
  window.history.back();
}

// 🔥 WAIT FOR PAGE LOAD (IMPORTANT FIX)
window.addEventListener("DOMContentLoaded", loadTV);

async function loadTV() {
  try {

    if (!tvId) {
      alert("TV ID not found");
      return;
    }

    // =====================
    // TV DETAILS
    // =====================
    const res = await fetch(`${BASE}/tv/${tvId}`);
    const data = await res.json();

    document.getElementById("poster").src =
      data.poster_path ? IMG + data.poster_path : "";

    document.getElementById("title").innerText = data.name || "No Title";
    document.getElementById("rating").innerText = "⭐ " + (data.vote_average ? data.vote_average.toFixed(1) : "N/A");
    document.getElementById("overview").innerText =
      data.overview || "No description";

    // GENRES
    const genresEl = document.getElementById("genres");
    if (genresEl && data.genres) {
      genresEl.innerHTML = data.genres.map(g => `<span>${g.name}</span>`).join("");
    }

    // META ROW
    const metaEl = document.getElementById("meta");
    if (metaEl) {
      const parts = [];
      if (data.first_air_date) parts.push(`<span>📅 ${data.first_air_date.split("-")[0]}</span>`);
      if (data.number_of_seasons) parts.push(`<span>📺 ${data.number_of_seasons} Season${data.number_of_seasons > 1 ? "s" : ""}</span>`);
      if (data.number_of_episodes) parts.push(`<span>🎬 ${data.number_of_episodes} Episodes</span>`);
      if (data.status) parts.push(`<span>● ${data.status}</span>`);
      metaEl.innerHTML = parts.join("");
    }

    // =====================
    // 🎬 TRAILER FIX
    // =====================
    const vidRes = await fetch(`${BASE}/tv/${tvId}/videos`);
    const vidData = await vidRes.json();

// =====================
// 🎬 SMART MULTI-LANGUAGE TRAILER SYSTEM (TV)
// =====================

const trailerFrame = document.getElementById("trailer");
const trailerSelect = document.getElementById("trailerSelect");

const PRIORITY = ["Trailer", "Teaser", "Promo", "Featurette", "Clip"];

let allVideos = [];

// get priority weight
function getPriority(type) {
  const index = PRIORITY.indexOf(type);
  return index === -1 ? 999 : index;
}

// fetch videos in multiple languages
for (let lang of LANGUAGES) {

  const res = await fetch(
    `${BASE}/tv/${tvId}/videos?language=${lang.code}`
  );

  const data = await res.json();

  const videos = data.results
    .filter(v => v.site === "YouTube")
    .map(v => ({
      key: v.key,
      name: v.name,
      type: v.type,
      lang: lang.label
    }));

  allVideos.push(...videos);
}

// remove duplicates (same video across languages)
const seen = new Set();
allVideos = allVideos.filter(v => {
  if (seen.has(v.key)) return false;
  seen.add(v.key);
  return true;
});

// sort by best type first (Trailer > Teaser > Promo ...)
allVideos.sort((a, b) => {
  return getPriority(a.type) - getPriority(b.type);
});

// render UI
if (allVideos.length > 0) {

  trailerSelect.innerHTML = "";

  allVideos.forEach((v, i) => {

    const opt = document.createElement("option");
    opt.value = v.key;
    opt.textContent = `${v.lang} - ${v.type} - ${v.name}`;

    trailerSelect.appendChild(opt);

    // load best trailer first
    if (i === 0) {
      trailerFrame.src = `https://www.youtube.com/embed/${v.key}?rel=0`;
    }
  });

  // change trailer on select
  trailerSelect.onchange = (e) => {
    trailerFrame.src = `https://www.youtube.com/embed/${e.target.value}?rel=0`;
  };

} else {

  // fallback
  trailerFrame.style.display = "none";
  trailerSelect.style.display = "none";

  const box = document.querySelector(".trailer-box");

  if (box) {
    box.innerHTML += `
      <p style="margin-top:10px; color:#ccc;">
        No trailer available
      </p>
      <a href="https://www.youtube.com/results?search_query=${
        encodeURIComponent(document.getElementById("title").innerText + " trailer")
      }" target="_blank">
        ▶ Watch on YouTube
      </a>
    `;
  }
}

    // =====================
    // 📺 SEASONS FIX
    // =====================
    const container = document.getElementById("seasonList");
    container.innerHTML = "";

    data.seasons.forEach(season => {

      if (!season.poster_path) return;

      const div = document.createElement("div");
      div.className = "movie";
      div.onclick = () => loadSeason(season.season_number);

      div.innerHTML = `
        <img src="${IMG + season.poster_path}">
        <p>${season.name}</p>
      `;

      container.appendChild(div);
    });

  } catch (err) {
    console.error(err);
  }
}

// =====================
// LOAD SEASON DETAILS
// =====================
async function loadSeason(seasonNumber) {

  const res = await fetch(
    `${BASE}/tv/${tvId}/season/${seasonNumber}`
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
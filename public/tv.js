// Dynamically set BASE URL: if running locally on a different port (like Live Server 5500) or file://, point to Express proxy
const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || window.location.protocol === "file:";
const BASE = (isLocal && window.location.port !== "3000") ? "http://localhost:3000/api/tmdb" : "/api/tmdb";
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

// HELPER: FETCH WITH RETRY
async function fetchWithRetry(url, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return res;
      console.warn(`⚠️ Fetch attempt ${i + 1} failed for ${url}. Status: ${res.status}`);
    } catch (err) {
      console.warn(`⚠️ Fetch attempt ${i + 1} error for ${url}: ${err.message}`);
    }
    if (i < retries - 1) await new Promise(r => setTimeout(r, delay));
  }
  return fetch(url);
}

function goBack() {
  window.history.back();
}

// 🔥 WAIT FOR PAGE LOAD
window.addEventListener("DOMContentLoaded", loadTV);

async function loadTV() {
  try {
    if (!tvId) {
      console.error("❌ TV ID not found");
      return;
    }

    // =====================
    // TV DETAILS
    // =====================
    console.log(`📺 Loading TV details for ID: ${tvId}`);
    const res = await fetchWithRetry(`${BASE}/tv/${tvId}`);
    
    if (!res.ok) {
      console.error(`❌ TV Details error (${res.status}): ${res.statusText}`);
      return;
    }

    const data = await res.json();

    const posterEl = document.getElementById("poster");
    if (posterEl) posterEl.src = data.poster_path ? IMG + data.poster_path : "";

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
    // 🎬 SMART MULTI-LANGUAGE TRAILER SYSTEM (TV)
    // =====================

    const trailerFrame = document.getElementById("trailer");
    const trailerSelect = document.getElementById("trailerSelect");

    const PRIORITY = ["Trailer", "Teaser", "Promo", "Featurette", "Clip"];

    function getPriority(type) {
      const index = PRIORITY.indexOf(type);
      return index === -1 ? 999 : index;
    }

    const videoPromises = LANGUAGES.map(async (lang) => {
      try {
        const res = await fetchWithRetry(`${BASE}/tv/${tvId}/videos?language=${lang.code}`);
        const data = await res.json();
        
        return (data.results || [])
          .filter(v => v.site === "YouTube")
          .map(v => ({
            key: v.key,
            name: v.name,
            type: v.type,
            lang: lang.label
          }));
      } catch (e) {
        console.error(`Failed to fetch TV videos for ${lang.label}`, e);
        return [];
      }
    });

    const videoResults = await Promise.all(videoPromises);
    let allVideos = videoResults.flat();

    const seen = new Set();
    allVideos = allVideos.filter(v => {
      if (seen.has(v.key)) return false;
      seen.add(v.key);
      return true;
    });

    allVideos.sort((a, b) => getPriority(a.type) - getPriority(b.type));

    if (allVideos.length > 0) {
      if (trailerSelect) {
        trailerSelect.innerHTML = "";
        allVideos.forEach((v, i) => {
          const opt = document.createElement("option");
          opt.value = v.key;
          opt.textContent = `${v.lang} - ${v.type} - ${v.name}`;
          trailerSelect.appendChild(opt);

          if (i === 0 && trailerFrame) {
            trailerFrame.src = `https://www.youtube.com/embed/${v.key}?rel=0`;
          }
        });

        trailerSelect.onchange = (e) => {
          if (trailerFrame) trailerFrame.src = `https://www.youtube.com/embed/${e.target.value}?rel=0`;
        };
      }
    }

    // =====================
    // 📺 SEASONS FIX
    // =====================
    const seasonListContainer = document.getElementById("seasonList");
    if (seasonListContainer && data.seasons) {
      seasonListContainer.innerHTML = "";
      data.seasons.forEach(season => {
        if (!season.poster_path) return;
        const div = document.createElement("div");
        div.className = "movie";
        div.onclick = () => loadSeason(season.season_number);
        div.innerHTML = `
          <img src="${IMG + season.poster_path}">
          <p>${season.name}</p>
        `;
        seasonListContainer.appendChild(div);
      });
    }

  } catch (err) {
    console.error("❌ TV Load Error:", err);
  }
}

// =====================
// LOAD SEASON DETAILS
// =====================
async function loadSeason(seasonNumber) {
  try {
    const res = await fetchWithRetry(`${BASE}/tv/${tvId}/season/${seasonNumber}`);
    const data = await res.json();
    const box = document.getElementById("seasonDetails");
    if (box) {
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
  } catch (err) {
    console.error("❌ Season Load Error:", err);
  }
}
// Dynamically set BASE URL: if running locally on a different port (like Live Server 5500) or file://, point to Express proxy
const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || window.location.protocol === "file:";
const BASE = (isLocal && window.location.port !== "3000") ? "http://localhost:3000/api/tmdb" : "/api/tmdb";
const IMG = "https://image.tmdb.org/t/p/w500";

const params = new URLSearchParams(window.location.search);
const movieId = params.get("id");

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

// BACK
function goBack() {
  window.history.back();
}

// LOAD MOVIE
async function loadMovie() {
  try {
    console.log(`🎬 Loading movie details for ID: ${movieId}`);
    const res = await fetchWithRetry(`${BASE}/movie/${movieId}`);
    
    if (!res.ok) {
      console.error(`❌ Movie Details error (${res.status}): ${res.statusText}`);
      return;
    }

    const data = await res.json();

    const posterEl = document.getElementById("poster");
    if (posterEl) posterEl.src = data.poster_path ? IMG + data.poster_path : "";

    document.getElementById("title").innerText = data.title || "No Title";
    document.getElementById("rating").innerText =
      "⭐ " + (data.vote_average ? data.vote_average.toFixed(1) : "N/A");

    document.getElementById("overview").innerText =
      data.overview || "No description available.";

    // GENRES
    const genresEl = document.getElementById("genres");
    if (genresEl && data.genres) {
      genresEl.innerHTML = data.genres.map(g => `<span>${g.name}</span>`).join("");
    }

    // META ROW
    const metaEl = document.getElementById("meta");
    if (metaEl) {
      const parts = [];
      if (data.release_date) parts.push(`<span>📅 ${data.release_date.split("-")[0]}</span>`);
      if (data.runtime) {
        const hrs = Math.floor(data.runtime / 60);
        const mins = data.runtime % 60;
        parts.push(`<span>⏱ ${hrs}h ${mins}m</span>`);
      }
      if (data.original_language) parts.push(`<span>🌐 ${data.original_language.toUpperCase()}</span>`);
      if (data.status) parts.push(`<span>● ${data.status}</span>`);
      metaEl.innerHTML = parts.join("");
    }

    // CREDITS
    const credRes = await fetchWithRetry(`${BASE}/movie/${movieId}/credits`);
    const credData = await credRes.json();

    const director = credData.crew.find(p => p.job === "Director");
    const music = credData.crew.find(p => p.job === "Original Music Composer");

    document.getElementById("director").innerText =
      director ? director.name : "N/A";

    document.getElementById("music").innerText =
      music ? music.name : "N/A";

    // =====================
    // 🎬 MULTI LANGUAGE TRAILERS
    // =====================

    const trailerFrame = document.getElementById("trailer");
    const trailerSelect = document.getElementById("trailerSelect");
    const trailerFallback = document.getElementById("trailerFallback");

    let allVideos = [];

    // fetch videos for each language in parallel
    const videoPromises = LANGUAGES.map(async (lang) => {
      try {
        const res = await fetchWithRetry(`${BASE}/movie/${movieId}/videos?language=${lang.code}`);
        const data = await res.json();
        
        return (data.results || [])
          .filter(v => v.site === "YouTube")
          .map(v => ({
            key: v.key,
            name: v.name,
            lang: lang.label
          }));
      } catch (e) {
        console.error(`Failed to fetch videos for ${lang.label}`, e);
        return [];
      }
    });

    const videoResults = await Promise.all(videoPromises);
    allVideos = videoResults.flat();

    // remove duplicates
    const seen = new Set();
    allVideos = allVideos.filter(v => {
      if (seen.has(v.key)) return false;
      seen.add(v.key);
      return true;
    });

    // render dropdown
    if (allVideos.length > 0) {
      if (trailerSelect) {
        trailerSelect.innerHTML = "";
        allVideos.forEach((v, i) => {
          const opt = document.createElement("option");
          opt.value = v.key;
          opt.textContent = `${v.lang} - ${v.name}`;
          trailerSelect.appendChild(opt);

          // first video load
          if (i === 0 && trailerFrame) {
            trailerFrame.src = `https://www.youtube.com/embed/${v.key}?rel=0`;
          }
        });

        // change video
        trailerSelect.onchange = (e) => {
          if (trailerFrame) trailerFrame.src = `https://www.youtube.com/embed/${e.target.value}?rel=0`;
        };
      }
    } else {
      if (trailerFrame) trailerFrame.style.display = "none";
      if (trailerSelect) trailerSelect.style.display = "none";

      if (trailerFallback) {
        const movieTitle = document.getElementById("title").innerText;
        trailerFallback.innerHTML = `
          <div class="no-trailer-box">
            <p>😔 No trailer available for this movie</p>
            <a href="https://www.youtube.com/results?search_query=${encodeURIComponent(
              movieTitle + " trailer"
            )}" target="_blank" class="yt-link-btn">
              ▶ Search on YouTube
            </a>
          </div>
        `;
      }
    }
  } catch (err) {
    console.error("❌ Movie Details Load Error:", err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (movieId) {
    loadMovie();
  } else {
    console.warn("⚠️ No Movie ID found in URL");
  }
});
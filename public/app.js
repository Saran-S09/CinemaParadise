// Dynamically set BASE URL for foolproof local and production routing
const port = window.location.port;
const isLocalDevServer = window.location.protocol === "file:" || (port && port !== "3000" && port !== "80" && port !== "443");
const BASE = isLocalDevServer ? `http://${window.location.hostname || "localhost"}:3000/api/tmdb` : "/api/tmdb";
const IMG = "https://image.tmdb.org/t/p/w500";

let heroMovies = [];
let heroIndex = 0;

// HELPER: FETCH WITH RETRY
async function fetchWithRetry(url, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return res;
      
      console.warn(`⚠️ Fetch attempt ${i + 1} failed with status ${res.status}. Retrying...`);
    } catch (err) {
      console.warn(`⚠️ Fetch attempt ${i + 1} threw error: ${err.message}. Retrying...`);
    }
    if (i < retries - 1) await new Promise(r => setTimeout(r, delay));
  }
  return fetch(url); // Final attempt without catching
}

// INIT
document.addEventListener("DOMContentLoaded", async () => {
  const searchBtn = document.getElementById("searchBtn");
  const homeBtn = document.getElementById("homeBtn");
  const tvBtn = document.getElementById("tvBtn");

  if (searchBtn) searchBtn.onclick = searchMovies;
  if (homeBtn) homeBtn.onclick = showHome;
  if (tvBtn) tvBtn.onclick = showTV;

  // CHECK WHERE TO OPEN
  const params = new URLSearchParams(window.location.search);
  const page = params.get("page");

  if (page === "tv") {
    showTV();
  } else {
    loadHome();
  }
});

// ===============================
// HOME
// ===============================
function loadHome() {
  showHome();
  
  console.log("🚀 Loading Home data...");

  
  fetchMovies(`${BASE}/trending/movie/week`, "trending");

  fetchMovies(`${BASE}/movie/popular`, "popular");

  fetchMovies(
    `${BASE}/discover/movie?with_original_language=ta&sort_by=release_date.desc`,
    "tamilRecent"
  );

  fetchMovies(
    `${BASE}/discover/movie?with_original_language=ta&sort_by=popularity.desc`,
    "tamilPopular"
  );
  // 🇮🇳 Tamil TV Series
  fetchTV(
    `${BASE}/discover/tv?with_original_language=ta&sort_by=popularity.desc`,
    "tamilTV"
  );
  loadHero();
}

// (Old fetchTV removed to avoid duplication)

// ===============================
// TV SECTION
// ===============================
function showTV() {
  document.getElementById("homeSection").style.display = "none";
  document.getElementById("searchSection").style.display = "none";
  document.getElementById("tvSection").style.display = "block";

  loadTV();
}

function loadTV() {
  fetchTV(`${BASE}/trending/tv/week`, "tvTrending");
  fetchTV(`${BASE}/tv/popular`, "tvPopular");
}


// ===============================
// FETCH MOVIES
// ===============================
async function fetchMovies(url, containerId) {
  try {
    console.log(`📡 Fetching movies from: ${url}`);
    const res = await fetchWithRetry(url);
    
    if (!res.ok) {
      console.error(`❌ API error (${res.status}): ${res.statusText}`);
      const errData = await res.json().catch(() => ({}));
      console.error("Error details:", errData);
      return;
    }

    const data = await res.json();

    const container = document.getElementById(containerId);
    if (!container) {
      console.warn(`⚠️ Container #${containerId} not found`);
      return;
    }

    if (!data.results || data.results.length === 0) {
      console.warn(`Empty results for ${url}`, data);
      container.innerHTML = "<p class='no-results'>No movies found.</p>";
      return;
    }

    container.innerHTML = "";

    data.results.forEach(m => {
      if (!m.poster_path || m.adult) return;

      container.innerHTML += `
        <div class="movie" onclick="openMovie(${m.id})">
          <img src="${IMG + m.poster_path}" alt="${m.title}">
          <p>${m.title}</p>
        </div>
      `;
    });

  } catch (err) {
    console.error("❌ Fetch error:", err);
  }
}


// ===============================
// FETCH TV
// ===============================
async function fetchTV(url, containerId) {
  try {
    console.log(`📡 Fetching TV from: ${url}`);
    const res = await fetchWithRetry(url);
    
    if (!res.ok) {
      console.error(`❌ TV API error (${res.status}): ${res.statusText}`);
      const errData = await res.json().catch(() => ({}));
      console.error("Error details:", errData);
      return;
    }

    const data = await res.json();

    const container = document.getElementById(containerId);
    if (!container) {
      console.warn(`⚠️ Container #${containerId} not found`);
      return;
    }

    if (!data.results || data.results.length === 0) {
      console.warn(`Empty results for ${url}`, data);
      container.innerHTML = "<p class='no-results'>No TV shows found.</p>";
      return;
    }

    container.innerHTML = "";

    data.results.forEach(tv => {
      if (!tv.poster_path) return;

      container.innerHTML += `
        <div class="movie" onclick="openTV(${tv.id})">
          <img src="${IMG + tv.poster_path}" alt="${tv.name}">
          <p>${tv.name}</p>
        </div>
      `;
    });

  } catch (err) {
    console.error("❌ TV fetch error:", err);
  }
}

function openTV(id) {
  window.location.href = `tv.html?id=${id}&from=tv`;
}


// ===============================
// HERO
// ===============================
async function loadHero() {
  try {
    const res = await fetchWithRetry(`${BASE}/trending/movie/week?include_adult=false`);
    const data = await res.json();

    const slider = document.getElementById("heroSlider");
    if (!slider) return;

    slider.innerHTML = "";

    heroMovies = data.results
      .filter(m => m.backdrop_path && m.title && !m.adult)
      .slice(0, 10);

    heroMovies.forEach(m => {
      slider.innerHTML += `
        <div class="hero-slide">
          <div class="hero-bg"
            style="background-image:url(https://image.tmdb.org/t/p/original${m.backdrop_path})">
          </div>

          <div class="hero-img"
            style="background-image:url(https://image.tmdb.org/t/p/original${m.backdrop_path})">
          </div>
        </div>
      `;
    });

    updateHeroContent();

    setInterval(() => {
      heroIndex = (heroIndex + 1) % heroMovies.length;
      moveSlider();
      updateHeroContent();
    }, 4000);

  } catch (err) {
    console.error("Hero error:", err);
  }
}


// MOVE SLIDER
function moveSlider() {
  const slider = document.getElementById("heroSlider");
  if (!slider) return;

  slider.style.transform = `translateX(-${heroIndex * 100}%)`;
}


// UPDATE HERO TEXT
function updateHeroContent() {
  const movie = heroMovies[heroIndex];
  if (!movie) return;

  document.getElementById("heroTitle").innerText = movie.title;
  document.getElementById("heroDesc").innerText =
    movie.overview?.substring(0, 120) + "...";

  document.getElementById("heroBtn").onclick = () => openMovie(movie.id);
}


// ===============================
// SEARCH
// ===============================
function searchMovies() {
  const q = document.getElementById("search").value.trim();
  if (!q) return;

  document.getElementById("homeSection").style.display = "none";
  document.getElementById("tvSection").style.display = "none";
  document.getElementById("searchSection").style.display = "block";

  fetchMovies(
    `${BASE}/search/movie?query=${q}&include_adult=false`,
    "searchResults"
  );
}


// ===============================
// NAVIGATION
// ===============================
function showHome() {
  document.getElementById("homeSection").style.display = "block";
  document.getElementById("searchSection").style.display = "none";
  document.getElementById("tvSection").style.display = "none";
}


// ===============================
// OPEN MOVIE
// ===============================
function openMovie(id) {
  window.location.href = `movie.html?id=${id}`;
}
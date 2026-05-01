const BASE = "/api/tmdb";
const IMG = "https://image.tmdb.org/t/p/w500";

let heroMovies = [];
let heroIndex = 0;

// INIT
document.getElementById("searchBtn").onclick = searchMovies;
document.getElementById("homeBtn").onclick = showHome;
document.getElementById("tvBtn").onclick = showTV;

loadHome();
// CHECK WHERE TO OPEN
window.onload = () => {
  const params = new URLSearchParams(window.location.search);
  const page = params.get("page");

  if (page === "tv") {
    showTV();
  } else {
    showHome();
  }
};

// ===============================
// HOME
// ===============================
function loadHome() {
  showHome();

  
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
    const res = await fetch(url);
    const data = await res.json();

    const container = document.getElementById(containerId);
    if (!container) return;

    if (!data.results) {
      console.warn(`No results for ${url}`, data);
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
    console.error("Fetch error:", err);
  }
}


// ===============================
// FETCH TV
// ===============================
async function fetchTV(url, containerId) {
  try {
    const res = await fetch(url);
    const data = await res.json();

    const container = document.getElementById(containerId);
    if (!container) return;

    if (!data.results) {
      console.warn(`No results for ${url}`, data);
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
    console.error("TV fetch error:", err);
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
    const res = await fetch(`${BASE}/trending/movie/week?include_adult=false`);
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
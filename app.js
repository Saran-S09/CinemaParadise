const API_KEY = "0ad6526135eb6a510c0d21afee0d557e";
const BASE = "https://api.themoviedb.org/3";
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

  
  fetchMovies(`${BASE}/trending/movie/week?api_key=${API_KEY}`, "trending");

  fetchMovies(`${BASE}/movie/popular?api_key=${API_KEY}`, "popular");

  fetchMovies(
    `${BASE}/discover/movie?api_key=${API_KEY}&with_original_language=ta&sort_by=release_date.desc`,
    "tamilRecent"
  );

  fetchMovies(
    `${BASE}/discover/movie?api_key=${API_KEY}&with_original_language=ta&sort_by=popularity.desc`,
    "tamilPopular"
  );
  // 🇮🇳 Tamil TV Series
  fetchTV(
    `${BASE}/discover/tv?api_key=${API_KEY}&with_original_language=ta&sort_by=popularity.desc`,
    "tamilTV"
  );
  loadHero();
}

async function fetchTV(url, containerId) {
  try {
    const res = await fetch(url);
    const data = await res.json();

    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = "";

    data.results.forEach(tv => {
      if (!tv.poster_path) return;

      container.innerHTML += `
        <div class="movie" onclick="openTV(${tv.id})">
          <img src="${IMG + tv.poster_path}">
          <p>${tv.name}</p>
        </div>
      `;
    });

  } catch (err) {
    console.error("TV Fetch error:", err);
  }
}

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
  fetchTV(`${BASE}/trending/tv/week?api_key=${API_KEY}`, "tvTrending");
  fetchTV(`${BASE}/tv/popular?api_key=${API_KEY}`, "tvPopular");
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

    container.innerHTML = "";

    data.results.forEach(m => {
      if (!m.poster_path || m.adult) return;

      container.innerHTML += `
        <div class="movie" onclick="openMovie(${m.id})">
          <img src="${IMG + m.poster_path}">
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

    container.innerHTML = "";

    data.results.forEach(tv => {
      if (!tv.poster_path) return;

      container.innerHTML += `
        <div class="movie" onclick="openTV(${tv.id})">
          <img src="${IMG + tv.poster_path}">
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
    const res = await fetch(`${BASE}/trending/movie/week?api_key=${API_KEY}&include_adult=false`);
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
    `${BASE}/search/movie?api_key=${API_KEY}&query=${q}&include_adult=false`,
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
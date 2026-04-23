const API_KEY = "0ad6526135eb6a510c0d21afee0d557e";
const BASE = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p/w500";


let heroMovies = [];
let heroIndex = 0;
// INIT
document.getElementById("searchBtn").onclick = searchMovies;
loadHome();

// HOME
function loadHome() {
  fetchMovies(`${BASE}/trending/movie/week?api_key=${API_KEY}`, "trending");

  fetchMovies(`${BASE}/movie/popular?api_key=${API_KEY}`, "popular");

  // 🇮🇳 Tamil Recent
  fetchMovies(
    `${BASE}/discover/movie?api_key=${API_KEY}&with_original_language=ta&sort_by=release_date.desc`,
    "tamilRecent"
  );

  // 🇮🇳 Tamil Popular
  fetchMovies(
    `${BASE}/discover/movie?api_key=${API_KEY}&with_original_language=ta&sort_by=popularity.desc`,
    "tamilPopular"
  );

  loadHero();
}

// FETCH
async function fetchMovies(url, containerId) {
  const res = await fetch(url);
  const data = await res.json();

  const container = document.getElementById(containerId);
  container.innerHTML = "";

  data.results.forEach(m => {
    if (!m.poster_path) return;

    container.innerHTML += `
      <div class="movie" onclick="openMovie(${m.id})">
        <img src="${IMG + m.poster_path}">
        <p>${m.title}</p>
      </div>
    `;
  });
}

// HERO
async function loadHero() {
  try {
    const res = await fetch(`${BASE}/trending/movie/week?api_key=${API_KEY}`);
    const data = await res.json();

    const slider = document.getElementById("heroSlider");

    // safety check
    if (!slider) return;

    slider.innerHTML = "";

    // filter good movies
    heroMovies = data.results.filter(m =>
      m.backdrop_path && m.title && !m.adult
    ).slice(0, 6);

    // create slides
    heroMovies.forEach(m => {
      slider.innerHTML += `
        <div class="hero-slide"
          style="background-image:url(https://image.tmdb.org/t/p/original${m.backdrop_path})">
        </div>
      `;
    });

    updateHeroContent();

    // auto slide
    setInterval(() => {
      heroIndex = (heroIndex + 1) % heroMovies.length;
      moveSlider();
      updateHeroContent();
    }, 4000);

  } catch (err) {
    console.error("Hero error:", err);
  }
}

function moveSlider() {
  const slider = document.getElementById("heroSlider");
  if (!slider) return;

  slider.style.transform = `translateX(-${heroIndex * 100}%)`;
}

function updateHeroContent() {
  const movie = heroMovies[heroIndex];
  if (!movie) return;

  document.getElementById("heroTitle").innerText = movie.title;
  document.getElementById("heroDesc").innerText =
    movie.overview?.substring(0, 120) + "...";

  document.getElementById("heroBtn").onclick = () => openMovie(movie.id);
}

// SEARCH
function searchMovies() {
  const q = document.getElementById("search").value;

  fetchMovies(`${BASE}/search/movie?api_key=${API_KEY}&query=${q}`, "trending");
}

// OPEN
function openMovie(id) {
  window.location.href = `movie.html?id=${id}`;
}
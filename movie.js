const API_KEY = "0ad6526135eb6a510c0d21afee0d557e";
const BASE = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p/w500";

const params = new URLSearchParams(window.location.search);
const movieId = params.get("id");

// BACK
function goBack() {
  window.history.back();
}

// LOAD MOVIE
async function loadMovie() {

  const res = await fetch(`${BASE}/movie/${movieId}?api_key=${API_KEY}`);
  const data = await res.json();

  document.getElementById("poster").src =
    IMG + data.poster_path;

  document.getElementById("title").innerText = data.title;
  document.getElementById("rating").innerText =
    "⭐ " + data.vote_average;

  document.getElementById("overview").innerText =
    data.overview;

  // CREDITS
  const credRes = await fetch(`${BASE}/movie/${movieId}/credits?api_key=${API_KEY}`);
  const credData = await credRes.json();

  const director = credData.crew.find(p => p.job === "Director");
  const music = credData.crew.find(p => p.job === "Original Music Composer");

  document.getElementById("director").innerText =
    director ? director.name : "N/A";

  document.getElementById("music").innerText =
    music ? music.name : "N/A";

  // TRAILER
  // 🎥 VIDEOS (SMART SELECTION)
const vidRes = await fetch(`${BASE}/movie/${movieId}/videos?api_key=${API_KEY}`);
const vidData = await vidRes.json();

const trailerFrame = document.getElementById("trailer");

// ✅ Only YouTube videos
const videos = vidData.results?.filter(v => v.site === "YouTube") || [];

// 🔥 PRIORITY ORDER
let video =
  videos.find(v => v.type === "Trailer" && v.official) ||   // best
  videos.find(v => v.type === "Trailer") ||
  videos.find(v => v.type === "Teaser" && v.official) ||
  videos.find(v => v.type === "Teaser") ||
  videos.find(v => v.type === "Clip" || v.type === "Featurette") ||
  videos[0]; // fallback

// 🎬 SHOW VIDEO
if (video && video.key) {
  trailerFrame.src =
    `https://www.youtube.com/embed/${video.key}?autoplay=1&mute=1&rel=0`;
} else {
  trailerFrame.style.display = "none";

  const right = document.querySelector(".right");

  right.innerHTML += `
    <p style="margin-top:20px;">No trailer available</p>
    <a href="https://www.youtube.com/results?search_query=${encodeURIComponent(data.title + ' trailer')}" target="_blank">
      ▶ Watch on YouTube
    </a>
  `;
}
}

loadMovie();
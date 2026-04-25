const API_KEY = "0ad6526135eb6a510c0d21afee0d557e";
const BASE = "https://api.themoviedb.org/3";
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

// =====================
// 🎬 MULTI LANGUAGE TRAILERS
// =====================

const trailerFrame = document.getElementById("trailer");
const trailerSelect = document.getElementById("trailerSelect");

let allVideos = [];

// 🔥 fetch videos for each language
for (let lang of LANGUAGES) {

  const res = await fetch(
    `${BASE}/movie/${movieId}/videos?api_key=${API_KEY}&language=${lang.code}`
  );

  const data = await res.json();

  const videos = data.results
    .filter(v => v.site === "YouTube")
    .map(v => ({
      key: v.key,
      name: v.name,
      lang: lang.label
    }));

  allVideos.push(...videos);
}

console.log("MOVIE MULTI LANG VIDEOS:", allVideos);

// 🎬 render dropdown
if (allVideos.length > 0) {

  trailerSelect.innerHTML = "";

  allVideos.forEach((v, i) => {

    const opt = document.createElement("option");
    opt.value = v.key;
    opt.textContent = `${v.lang} - ${v.name}`;

    trailerSelect.appendChild(opt);

    // first video load
    if (i === 0) {
      trailerFrame.src =
        `https://www.youtube.com/embed/${v.key}?rel=0`;
    }
  });

  // change video
  trailerSelect.onchange = (e) => {
    trailerFrame.src =
      `https://www.youtube.com/embed/${e.target.value}?rel=0`;
  };

} else {

  trailerFrame.style.display = "none";

  const right = document.querySelector(".right");

  right.innerHTML += `
    <p style="margin-top:20px;">No trailer available</p>
    <a href="https://www.youtube.com/results?search_query=${encodeURIComponent(
      document.getElementById("title").innerText + " trailer"
    )}" target="_blank">
      ▶ Watch on YouTube
    </a>
  `;
}
}

loadMovie();
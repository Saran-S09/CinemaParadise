const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const TMDB_KEY = process.env.TMDB_API_KEY;

// Security check
if (!TMDB_KEY) {
  console.error("❌ TMDB_API_KEY not found in .env file!");
  process.exit(1);
}

// Middleware
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

// =====================
// 🔒 TMDB PROXY ROUTE
// =====================
app.use("/api/tmdb", async (req, res) => {
  try {
    // In app.use, req.url is the relative path (e.g. /movie/popular)
    const tmdbPath = req.url.split("?")[0].replace(/^\//, "");

    if (!tmdbPath) {
      return res.status(400).json({ error: "No path provided" });
    }

    // Build query string (forward all params + inject API key)
    const queryParams = new URLSearchParams(req.query);
    queryParams.set("api_key", TMDB_KEY);

    const tmdbUrl = `https://api.themoviedb.org/3/${tmdbPath}?${queryParams.toString()}`;
    console.log(`📡 Proxying: ${tmdbUrl}`);

    const response = await fetch(tmdbUrl, {
      headers: {
        "User-Agent": "FilmRoll/1.0",
        "Accept": "application/json"
      }
    });

    const data = await response.json();

    // Forward the actual status code from TMDB (e.g. 404, 401)
    res.status(response.status).json(data);

  } catch (err) {
    console.error("❌ Proxy error:", err.message);
    res.status(500).json({ error: "Internal Server Error during fetch" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🎬 Film Roll server running at http://localhost:${PORT}`);
  console.log(`🔒 API key is hidden from frontend`);
});

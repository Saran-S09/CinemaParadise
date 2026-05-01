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
app.get("/api/tmdb/*path", async (req, res) => {
  try {
    // Extract the TMDB path from originalUrl to preserve slashes
    const tmdbPath = req.originalUrl.split("?")[0].replace("/api/tmdb/", "");

    // Build query string (forward all params + inject API key)
    const queryParams = new URLSearchParams(req.query);
    queryParams.set("api_key", TMDB_KEY);

    const tmdbUrl = `https://api.themoviedb.org/3/${tmdbPath}?${queryParams.toString()}`;
    console.log(`Proxying request to: ${tmdbUrl}`);

    const response = await fetch(tmdbUrl);
    const data = await response.json();

    res.json(data);

  } catch (err) {
    console.error("Proxy error:", err.message);
    res.status(500).json({ error: "Failed to fetch from TMDB" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🎬 Film Roll server running at http://localhost:${PORT}`);
  console.log(`🔒 API key is hidden from frontend`);
});

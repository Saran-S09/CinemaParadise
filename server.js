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

// =====================
// 🩺 HEALTH CHECK
// =====================
app.get("/api/health", (req, res) => {
  console.log("🩺 Health check requested");
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    apiKeyPresent: !!TMDB_KEY,
    apiKeyPrefix: TMDB_KEY ? TMDB_KEY.substring(0, 4) + "****" : "missing"
  });
});

// Middleware
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

// =====================
// 🔒 TMDB PROXY ROUTE
// =====================
app.use("/api/tmdb", async (req, res) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    // req.path is the path relative to /api/tmdb (e.g. "/movie/popular")
    const tmdbPath = req.path.replace(/^\//, "");

    if (!tmdbPath) {
      return res.status(400).json({ error: "No TMDB path provided" });
    }

    // Build query string (forward all incoming params + inject API key)
    const queryParams = new URLSearchParams(req.query);
    queryParams.set("api_key", TMDB_KEY.trim());

    const tmdbUrl = `https://api.themoviedb.org/3/${tmdbPath}?${queryParams.toString()}`;
    console.log(`📡 Fetching: ${tmdbUrl}`);

    const response = await fetch(tmdbUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    // Check if response is JSON before parsing
    const contentType = response.headers.get("content-type");
    let data;
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.warn(`⚠️ Non-JSON response from TMDB: ${text.substring(0, 100)}...`);
      data = { 
        error: "Non-JSON response from TMDB", 
        status: response.status,
        body: text.substring(0, 200) 
      };
    }

    console.log(`✅ TMDB: ${response.status}`);
    res.status(response.status).json(data);

  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      console.error("❌ TMDB request timed out");
      return res.status(504).json({ error: "TMDB Request Timeout" });
    }
    console.error("❌ Proxy error:", err);
    res.status(500).json({ 
      error: "Internal Server Error during fetch", 
      message: err.message 
    });
  }
});

// Start server (Only if running locally, Vercel handles this automatically)
if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🎬 Film Roll server running at http://localhost:${PORT}`);
    console.log(`🔒 API key is hidden from frontend`);
  });
}

// Export the app for Vercel Serverless
module.exports = app;

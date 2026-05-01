const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());

const TMDB_KEY = process.env.TMDB_API_KEY;

// =====================
// 🩺 HEALTH CHECK
// =====================
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    apiKeyPresent: !!TMDB_KEY,
    apiKeyPrefix: TMDB_KEY ? TMDB_KEY.substring(0, 4) + "****" : "missing"
  });
});

// =====================
// 🔒 TMDB PROXY ROUTE
// =====================
app.use("/api/tmdb", async (req, res) => {
  if (!TMDB_KEY) {
    console.error("❌ TMDB_API_KEY is missing from environment variables!");
    return res.status(500).json({ error: "Server Configuration Error: API Key missing" });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const tmdbPath = req.path.replace(/^\//, "");
    if (!tmdbPath) {
      return res.status(400).json({ error: "No TMDB path provided" });
    }

    const queryParams = new URLSearchParams(req.query);
    queryParams.set("api_key", TMDB_KEY.trim());

    const tmdbUrl = `https://api.themoviedb.org/3/${tmdbPath}?${queryParams.toString()}`;
    console.log(`📡 Fetching: ${tmdbUrl}`);

    const response = await fetch(tmdbUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    const contentType = response.headers.get("content-type");
    let data;
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
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

module.exports = app;

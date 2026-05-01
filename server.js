const path = require("path");
const express = require("express");

// Import the Vercel-ready Express app from the api folder
const app = require("./api/index.js");

const PORT = process.env.PORT || 3000;

// Serve static files locally (Vercel handles this automatically in production)
app.use(express.static(path.join(__dirname, "public")));

// Start server locally
app.listen(PORT, () => {
  console.log(`🎬 Film Roll local server running at http://localhost:${PORT}`);
  console.log(`🔒 Proxy routes are mounted at /api/*`);
});

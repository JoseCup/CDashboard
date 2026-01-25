// /routes/stats.routes.js
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const path = require("path");
// api endpoint to get GSC data

const { google } = require("googleapis");

async function getSearchConsoleClient() {
  const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, "../keys/analytics-key.json"),
    scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
  });
  return google.webmasters({ version: "v3", auth: await auth.getClient() });
}

// api endpoint to get GSC data
router.get("/gsc", verifyToken, async (req, res) => {
  try {
    const webmasters = await getSearchConsoleClient();

    const propertyUrl = process.env.GSC_PROPERTY_URL; // e.g. "https://example.com/"
    const response = await webmasters.searchanalytics.query({
      siteUrl: propertyUrl,
      requestBody: {
        startDate: daysAgo(30),
        endDate: daysAgo(0),
        dimensions: ["query"],
        searchType: "web",
        rowLimit: 50,
      },
    });

    res.json(response.data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch Search Console data" });
  }
});

function daysAgo(num) {
  const d = new Date();
  d.setDate(d.getDate() - num);
  return d.toISOString().split("T")[0]; // YYYY-MM-DD
}
module.exports = router;

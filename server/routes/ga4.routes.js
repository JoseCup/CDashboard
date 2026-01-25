// /routes/stats.routes.js
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const path = require("path");

// ga4 analytics
const { BetaAnalyticsDataClient } = require("@google-analytics/data");

const analyticsClient = new BetaAnalyticsDataClient({
  keyFilename: path.join(__dirname, "../keys/analytics-key.json"),
});

// Example endpoint: get pageviews in last 30 days
router.get("/ga4", verifyToken, async (req, res) => {
  try {
    const [response] = await analyticsClient.runReport({
      property: `properties/${process.env.GA4_PROPERTY_ID}`,
      dateRanges: [
        { startDate: "30daysAgo", endDate: "today" }, // current
      ],
      dimensions: [
        // { name: 'date' },   // dimensionalValues[0]
        { name: "landingPage" },
        // { name: 'pageTitle' },
        { name: "sessionDefaultChannelGroup" },
      ],
      metrics: [
        { name: "sessions" },
        { name: "bounceRate" },
        { name: "newUsers" },
      ],
      limit: 5,
      orderBys: [{ desc: true, metric: { metricName: "sessions" } }],
    });

    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch GA stats" });
  }
});
module.exports = router;

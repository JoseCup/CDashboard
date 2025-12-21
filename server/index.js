
// Routes
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const puppeteer = require('puppeteer');
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: "http://localhost:4200", credentials: true }));

const USERS = [
  {
    id: 1,
    email: "admin@example.com",
    password: "ChangeMeNow!",
    role: "admin",
    name: "Jose",
  },
  {
    id: 2,
    email: "client@example.com",
    password: "ChangeMeNow!",
    role: "client",
    name: "Client",
  },
];

function sign(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "15m" });
}
function verifyToken(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: "No token provided" });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

// Endpoint to fetch puppeteer data
app.get('/api/report/pdf', verifyToken, async (req, res) => {
  try {
    const token = req.cookies.token;           // reuse the validated cookie

    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    // set the auth cookie for the app domain
    await page.setCookie({
      name: 'token',
      value: token,
      domain: 'localhost', // adjust if you use a different host
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    });

    await page.goto('http://localhost:4200', { waitUntil: 'networkidle0' });
    await page.goto('http://localhost:4200/account', { waitUntil: 'networkidle0' });


    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' },
    });

    await browser.close();

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="SEO_Report.pdf"',
      'Content-Length': pdf.length
    });

    res.send(pdf);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});


app.get("/api/health", (_, res) => res.json({ ok: true }));

app.post("/api/login", (req, res) => {
  const { email, password } = req.body || {};
  const user = USERS.find((u) => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ message: "Bad credentials" });
  // Adding name to the token payload
  const token = sign({
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  });
  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 15 * 60 * 1000,
  });
  res.json({ message: "ok" });
});

// ga4 analytics
const { BetaAnalyticsDataClient } = require("@google-analytics/data");
const path = require("path");

const analyticsClient = new BetaAnalyticsDataClient({
  keyFilename: path.join(__dirname, "keys/analytics-key.json"),
});

// Example endpoint: get pageviews in last 30 days
app.get("/api/stats", verifyToken, async (req, res) => {
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

// Google Search Console GSC backend route
const { google } = require("googleapis");

async function getSearchConsoleClient() {
  const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, "keys/analytics-key.json"),
    scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
  });
  return google.webmasters({ version: "v3", auth: await auth.getClient() });
}

// api endpoint to get GSC data
app.get("/api/gsc", verifyToken, async (req, res) => {
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

app.post("/api/logout", (req, res) => {
  res.clearCookie("token", {
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  res.json({ message: "logged out" });
});

app.get("/api/me", verifyToken, (req, res) => res.json(req.user));

app.get("/api/dashboard", verifyToken, (req, res) => {
  res.json({ websiteVisits: 1234, leads: 42, conversionRate: "3.4%" });
});

app.listen(process.env.PORT || 5000, () =>
  console.log(`API on http://localhost:${process.env.PORT || 5000}`)
);

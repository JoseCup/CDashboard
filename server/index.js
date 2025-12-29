
// Routes
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const puppeteer = require('puppeteer');
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const bcrypt = require('bcrypt');
const pool = require('./db');
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: "http://localhost:4200", credentials: true }));
// Backend company dashboard API
const requirePlatformAdmin = require('./middleware/requirePlatformAdmin');


// GET all companies - platform admin only
app.get('/api/admin/companies', verifyToken, requirePlatformAdmin, async (req, res) => {
  const result = await pool.query(
    `SELECT id, name, created_at FROM companies ORDER BY created_at DESC`
  );
  res.json(result.rows);
});

// Get members of a company (platform admin only)
app.get(
  '/api/admin/companies/:companyId/users',
  verifyToken,
  requirePlatformAdmin,
  async (req, res) => {
    const { companyId } = req.params;

    const result = await pool.query(
      `
      SELECT 
        u.id,
        u.email,
        u.name,
        cu.role
      FROM company_users cu
      JOIN users u ON u.id = cu.user_id
      WHERE cu.company_id = $1
      ORDER BY u.email
      `,
      [companyId]
    );

    res.json(result.rows);
  }
);


// Create new company - platform admin only
app.post('/api/admin/companies', verifyToken, requirePlatformAdmin, async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Company name required' });
  }

  const result = await pool.query(
    `INSERT INTO companies (name)
     VALUES ($1)
     RETURNING id, name, created_at`,
    [name]
  );

  res.status(201).json(result.rows[0]);
});

// Assign user to company with role - platform admin only
app.post(
  '/api/admin/companies/:companyId/users',
  verifyToken,
  requirePlatformAdmin,
  async (req, res) => {
    const { companyId } = req.params;
    const { email, name, role } = req.body;

    if (!email || !role) {
      return res.status(400).json({ message: 'Email and role required' });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Find or create user
      const userResult = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      let userId;

      if (userResult.rowCount === 0) {
        const tempPassword = 'ChangeMeNow!';
        const hash = await bcrypt.hash(tempPassword, 12);

        const insertUser = await client.query(
          `INSERT INTO users (email, password_hash, name)
           VALUES ($1, $2, $3)
           RETURNING id`,
          [email, hash, name]
        );

        userId = insertUser.rows[0].id;
      } else {
        userId = userResult.rows[0].id;
      }

      // 2. Assign role
      await client.query(
        `INSERT INTO company_users (company_id, user_id, role)
         VALUES ($1, $2, $3)
         ON CONFLICT (company_id, user_id)
         DO UPDATE SET role = EXCLUDED.role`,
        [companyId, userId, role]
      );

      await client.query('COMMIT');

      res.json({ success: true });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(err);
      res.status(500).json({ message: 'Failed to assign user' });
    } finally {
      client.release();
    }
  }
);

// Add member to company - platform or company admin
// Platform admins bypass company restriction
// Company admins are scoped automatically
// No duplicate routes needed
/**
 * Add member to a company
 * - Platform admins: can add to ANY company
 * - Company admins: can only add to THEIR company
 */
app.post(
  '/api/companies/:companyId/members',
  verifyToken,
  async (req, res) => {
    const { companyId } = req.params;
    const { email, role } = req.body;
    const requester = req.user;

    console.log('➡️ Add member request', {
      requester,
      companyId,
      email,
      role
    });

    // 1. Validate input
    if (!email || !role) {
      return res.status(400).json({ message: 'Email and role required' });
    }

    // 2. Platform admin bypass
    if (requester.isPlatformAdmin === true) {
      console.log('✅ Platform admin detected — bypassing company checks');
      return assignUserToCompany(companyId, email, role, res);
    }

    // 3. Company admin check
    const access = await pool.query(
      `
      SELECT role
      FROM company_users
      WHERE user_id = $1 AND company_id = $2
      `,
      [requester.userId, companyId]
    );

    const isCompanyAdmin = access.rows.some(
      r => r.role === 'company_admin'
    );

    if (!isCompanyAdmin) {
      console.warn('⛔ Not authorized to add member', {
        requester: requester.userId,
        companyId
      });
      return res.status(403).json({ message: 'Not authorized' });
    }

    // 4. Authorized — proceed
    return assignUserToCompany(companyId, email, role, res);
  }
);

async function assignUserToCompany(companyId, email, role, res) {
  try {
    console.log('➡️ Assigning user', { companyId, email, role });

    // Find user
    const userResult = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rowCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userId = userResult.rows[0].id;

    // Insert or update role
    await pool.query(
      `
      INSERT INTO company_users (company_id, user_id, role)
      VALUES ($1, $2, $3)
      ON CONFLICT (company_id, user_id)
      DO UPDATE SET role = EXCLUDED.role
      `,
      [companyId, userId, role]
    );

    console.log('✅ Member added successfully');

    res.json({ success: true });

  } catch (err) {
    console.error('❌ Failed to assign member', err);
    res.status(500).json({ message: 'Failed to assign member' });
  }
}


app.delete(
  '/api/companies/:companyId/members/:userId',
  verifyToken,
  async (req, res) => {
    const { companyId, userId } = req.params;

    await pool.query(
      `
      DELETE FROM company_users
      WHERE company_id = $1 AND user_id = $2
      `,
      [companyId, userId]
    );

    res.json({ success: true });
  }
);


// User login with JWT auth and role loading
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Find user
    const userResult = await pool.query(
      `SELECT id, email, password_hash, is_active
       FROM users
       WHERE email = $1`,
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = userResult.rows[0];

    if (!user.is_active) {
      return res.status(403).json({ message: 'Account disabled' });
    }

    // 2. Verify password
    const passwordValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // 3. Load company + role
    const roleResult = await pool.query(
      `SELECT company_id, role
       FROM company_users
       WHERE user_id = $1`,
      [user.id]
    );

    if (roleResult.rows.length === 0) {
      return res.status(403).json({ message: 'No company assigned' });
    }

    const isPlatformAdmin = roleResult.rows.some(r => r.role === 'platform_admin');

    const { company_id, role } = roleResult.rows[0];

    // 4. Create JWT
    const token = jwt.sign(
      {
        userId: user.id,
        companyId: company_id,
        role,
        isPlatformAdmin
      },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    // 5. Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 15 * 60 * 1000
    });

    res.json({
      id: user.id,
      email: user.email,
      role
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user info
app.get('/api/me', verifyToken, (req, res) => {
  res.json(req.user);
});


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


app.get("/api/dashboard", verifyToken, (req, res) => {
  res.json({ websiteVisits: 1234, leads: 42, conversionRate: "3.4%" });
});

app.listen(process.env.PORT || 5000, () =>
  console.log(`API on http://localhost:${process.env.PORT || 5000}`)
);

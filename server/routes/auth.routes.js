
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

app.get("/api/health", (_, res) => res.json({ ok: true }));

app.post("/api/logout", (req, res) => {
  res.clearCookie("token", {
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  res.json({ message: "logged out" });
});

app.listen(process.env.PORT || 5000, () =>
  console.log(`API on http://localhost:${process.env.PORT || 5000}`)
);

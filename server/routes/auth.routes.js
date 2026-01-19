// server/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');              //  FIXED PATH
const verifyToken = require('../middleware/verifyToken');

/**
 * POST /auth/login
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
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

    const passwordValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const roles = await pool.query(
      `SELECT company_id, role FROM company_users WHERE user_id = $1`,
      [user.id]
    );

    if (roles.rows.length === 0) {
      return res.status(403).json({ message: 'No company assigned' });
    }

    const isPlatformAdmin = roles.rows.some(r => r.role === 'platform_admin');
    const { company_id, role } = roles.rows[0];

    const token = jwt.sign(
      { userId: user.id, companyId: company_id, role, isPlatformAdmin },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 15 * 60 * 1000
    });

    res.json({ id: user.id, email: user.email, role, isPlatformAdmin });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /auth/me
 */
router.get('/me', verifyToken, (req, res) => {
  res.json(req.user);
});

/**
 * POST /auth/logout
 */
router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  });
  res.json({ message: 'logged out' });
});



module.exports = router;

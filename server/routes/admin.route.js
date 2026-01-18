
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

    if (!email || !role) {
      return res.status(400).json({ message: 'Email and role required' });
    }

    if (requester.isPlatformAdmin === true) {
      console.log('✅ Platform admin detected — bypassing company checks');
      return assignUserToCompany(companyId, email, role, res);
    }

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

// Update company details - platform admin only
app.put('/api/companies/:id', verifyToken, async (req, res) => {
  try {
    // Only platform admins can update
    if (req.user.role !== 'platform_admin') {
      return res.status(403).json({ error: 'Forbidden: not authorized' });
    }

    const { name, website, contactEmail } = req.body;
    const companyId = req.params.id;

    db.run(
      `UPDATE companies 
       SET name = COALESCE(?, name),
           website = COALESCE(?, website),
           contactEmail = COALESCE(?, contactEmail)
       WHERE id = ?`,
      [name || null, website || null, contactEmail || null, companyId],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ message: 'Company not found' });
        res.json({ message: 'Company updated successfully' });
      }
    );
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update company' });
  }
});

// Delete company - platform admin only
app.delete('/api/companies/:id', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'platform_admin') {
      return res.status(403).json({ error: 'Forbidden: not authorized' });
    }

    const companyId = req.params.id;
    db.run(`DELETE FROM companies WHERE id = ?`, [companyId], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ message: 'Company not found' });
      res.json({ message: 'Company deleted successfully' });
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to delete company' });
  }
});




app.listen(process.env.PORT || 5000, () =>
  console.log(`API on http://localhost:${process.env.PORT || 5000}`)
);

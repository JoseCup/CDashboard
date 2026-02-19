const express = require('express');
const router = express.Router();
const pool = require('../db');
const verifyToken = require('../middleware/verifyToken');
const requirePlatformAdmin = require('../middleware/requirePlatformAdmin');
const requirePlatformStaff = require('../middleware/requirePlatformStaff');
const bcrypt = require('bcrypt');

// GET all companies - platform admin only
router.get('/companies', verifyToken, requirePlatformStaff, async (req, res) => {
  const result = await pool.query(
    `SELECT id, name, created_at FROM companies ORDER BY created_at DESC`
  );
  res.json(result.rows);
});

// Get members of a company (platform admin only)
router.get(
  '/companies/:companyId/users',
  verifyToken,
  requirePlatformStaff,
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

// GET single company - platform admin only
router.get(
  '/companies/:companyId',
  verifyToken,
  requirePlatformAdmin,
  async (req, res) => {
    const { companyId } = req.params;

    try {
      const result = await pool.query(
        `
        SELECT
          id,
          name,
          website,
          contact_email AS "contactEmail",
          created_at
        FROM companies
        WHERE id = $1
        `,
        [companyId]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ message: 'Company not found' });
      }

      res.json(result.rows[0]);
    } catch (err) {
      console.error('Get company error:', err);
      res.status(500).json({ message: 'Failed to load company' });
    }
  }
);


// Create new company - platform admin only
router.post('/companies', verifyToken, requirePlatformAdmin, async (req, res) => {
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



// Add user to company with role - platform admin only (with password)
router.post(
  '/companies/:companyId/users',
  verifyToken,
  requirePlatformAdmin,
  async (req, res) => {
    const { companyId } = req.params;
    const {
      email,
      firstName,
      lastName,
      password,
      role
    } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({
        message: 'Email, password, and role are required'
      });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Check if user exists
      const existingUser = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      let userId;

      if (existingUser.rowCount === 0) {
        // 2. Create user
        const passwordHash = await bcrypt.hash(password, 12);

        const insertUser = await client.query(
          `
          INSERT INTO users (email, password_hash, first_name, last_name)
          VALUES ($1, $2, $3, $4)
          RETURNING id
          `,
          [
            email.toLowerCase(),
            passwordHash,
            firstName || null,
            lastName || null
          ]
        );

        userId = insertUser.rows[0].id;
      } else {
        userId = existingUser.rows[0].id;
      }

      // 3. Assign to company
      await client.query(
        `
        INSERT INTO company_users (company_id, user_id, role)
        VALUES ($1, $2, $3)
        ON CONFLICT (company_id, user_id)
        DO UPDATE SET role = EXCLUDED.role
        `,
        [companyId, userId, role]
      );

      await client.query('COMMIT');

      res.json({ success: true });

    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Add user error:', err);
      res.status(500).json({ message: 'Failed to add user' });
    } finally {
      client.release();
    }
  }
);


// Add member to company - platform or company admin
router.post(
  '/companies/:companyId/members',
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

// Update company details - platform admin only
router.put('/companies/:id', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'platform_admin') {
      return res.status(403).json({ error: 'Forbidden: not authorized' });
    }

    const { name, website, contactEmail } = req.body;
    const companyId = req.params.id;

    const result = await pool.query(
      `
      UPDATE companies
      SET
        name = COALESCE($1, name),
        website = COALESCE($2, website),
        contact_email = COALESCE($3, contact_email)
      WHERE id = $4
      RETURNING *
      `,
      [
        name ?? null,
        website ?? null,
        contactEmail ?? null,
        companyId
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.json({
      message: 'Company updated successfully',
      company: result.rows[0]
    });

  } catch (e) {
    console.error('Update company error:', e);
    res.status(500).json({ error: 'Failed to update company' });
  }
});


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

// Remove user from company - platform admin only
router.delete(
  '/companies/:companyId/users/:userId',
  verifyToken,
  requirePlatformAdmin,
  async (req, res) => {
    const { companyId, userId } = req.params;

    try {
      const result = await pool.query(
        `
        DELETE FROM company_users
        WHERE company_id = $1 AND user_id = $2
        RETURNING id
        `,
        [companyId, userId]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ message: 'User not found in company' });
      }

      res.json({ success: true });
    } catch (err) {
      console.error('Remove user error:', err);
      res.status(500).json({ message: 'Failed to remove user' });
    }
  }
);


module.exports = router;

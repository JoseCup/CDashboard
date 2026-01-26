// Routes
const express = require('express');
const router = express.Router();
const jwt = require("jsonwebtoken");
const pool = require('../db');    

const verifyToken = require('../middleware/verifyToken');
//FIXME
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
// Company Admin 
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


router.get("/dashboard", verifyToken, (req, res) => {
  res.json({ websiteVisits: 1234, leads: 42, conversionRate: "3.4%" });
});


module.exports = router;

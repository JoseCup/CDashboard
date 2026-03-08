const express = require('express');
const router = express.Router();
const pool = require('../db');

const verifyToken = require('../middleware/verifyToken');
const requirePlatformStaff = require('../middleware/requirePlatformStaff');


// GET all users
router.get('/', verifyToken, requirePlatformStaff, async (req, res) => {

  try {

    const result = await pool.query(`
      SELECT id, email, first_name, last_name, platform_role
      FROM users
      ORDER BY email
    `);

    res.json(result.rows);

  } catch (err) {

    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'server error' });

  }

});


// CREATE user
router.post('/', verifyToken, requirePlatformStaff, async (req, res) => {

  const { email, firstName, lastName, password, platformRole } = req.body;

  try {

    const result = await pool.query(`
      INSERT INTO users
      (email, first_name, last_name, password_hash, platform_role)
      VALUES ($1,$2,$3,crypt($4, gen_salt('bf')),$5)
      RETURNING id,email,first_name,last_name,platform_role
    `,
    [email, firstName, lastName, password, platformRole || 'USER']);

    res.status(201).json(result.rows[0]);

  } catch (err) {

    console.error('Error creating user:', err);
    res.status(500).json({ error: 'server error' });

  }

});


// DELETE user
router.delete('/:id', verifyToken, requirePlatformStaff, async (req, res) => {

  const { id } = req.params;

  try {

    await pool.query(
      `DELETE FROM users WHERE id=$1`,
      [id]
    );

    res.json({ success: true });

  } catch (err) {

    console.error('Error deleting user:', err);
    res.status(500).json({ error: 'server error' });

  }

});

module.exports = router;
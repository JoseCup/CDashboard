const express = require('express');
const router = express.Router();
const pool = require('../db');

const verifyToken = require('../middleware/verifyToken');
const requirePlatformStaff = require('../middleware/requirePlatformStaff');


// Get campaigns for company
router.get('/company/:companyId', verifyToken, async (req, res) => {
  const { companyId } = req.params;

  try {
    const result = await pool.query(
      `SELECT * 
       FROM campaigns 
       WHERE company_id = $1 
       AND lifecycle_state = 'ACTIVE'
       ORDER BY updated_at DESC`,
      [companyId]
    );

    res.json(result.rows);

  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Get campaign details
router.get('/:campaignId', verifyToken, async (req, res) => {
  const { campaignId } = req.params;

  try {

    const campaignResult = await pool.query(
      `SELECT * FROM campaigns WHERE id = $1`,
      [campaignId]
    );

    if (campaignResult.rows.length === 0) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const versionsResult = await pool.query(
      `SELECT *
       FROM campaign_versions
       WHERE campaign_id = $1
       ORDER BY version_number DESC`,
      [campaignId]
    );

    const commentsResult = await pool.query(
      `SELECT cc.*, u.email
       FROM campaign_comments cc
       JOIN users u ON cc.user_id = u.id
       WHERE campaign_id = $1
       ORDER BY created_at ASC`,
      [campaignId]
    );

    res.json({
      campaign: campaignResult.rows[0],
      versions: versionsResult.rows,
      comments: commentsResult.rows
    });

  } catch (error) {
    console.error('Error fetching campaign details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create campaign
router.post('/company/:companyId', verifyToken, requirePlatformStaff, async (req, res) => {
  const { companyId } = req.params;
  const { title } = req.body;

  try {

    const result = await pool.query(
      `INSERT INTO campaigns (company_id, title)
       VALUES ($1, $2)
       RETURNING *`,
      [companyId, title]
    );

    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Add version
router.post('/:campaignId/versions', verifyToken, requirePlatformStaff, async (req, res) => {

  const { campaignId } = req.params;
  const { previewUrl, fileType } = req.body;

  try {

    const versionResult = await pool.query(
      `SELECT COALESCE(MAX(version_number),0) + 1 AS next_version
       FROM campaign_versions
       WHERE campaign_id = $1`,
      [campaignId]
    );

    const nextVersion = versionResult.rows[0].next_version;

    const insert = await pool.query(
      `INSERT INTO campaign_versions
       (campaign_id, version_number, preview_url, file_type)
       VALUES ($1,$2,$3,$4)
       RETURNING *`,
      [campaignId, nextVersion, previewUrl, fileType]
    );

    await pool.query(
      `UPDATE campaigns
       SET approved_version = NULL,
           approved_at = NULL,
           updated_at = NOW()
       WHERE id = $1`,
      [campaignId]
    );

    res.status(201).json(insert.rows[0]);

  } catch (error) {
    console.error('Error creating campaign version:', error);
    res.status(500).json({ error: 'server error' });
  }
});

// Add comment
router.post('/:campaignId/comments', verifyToken, async (req, res) => {

  const { campaignId } = req.params;
  const { message } = req.body;

  try {

    const result = await pool.query(
      `INSERT INTO campaign_comments (campaign_id, user_id, message)
       VALUES ($1,$2,$3)
       RETURNING *`,
      [campaignId, req.user.userId, message]
    );

    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Approve campaign
router.post('/:campaignId/approve', verifyToken, async (req, res) => {

  const { campaignId } = req.params;

  try {

    const versionResult = await pool.query(
      `SELECT MAX(version_number) AS latest
       FROM campaign_versions
       WHERE campaign_id = $1`,
      [campaignId]
    );

    const latestVersion = versionResult.rows[0].latest;

    await pool.query(
      `UPDATE campaigns
       SET approved_version = $1,
           approved_at = NOW(),
           approved_by = $2
       WHERE id = $3`,
      [latestVersion, req.user.userId, campaignId]
    );

    res.json({ success: true });

  } catch (error) {
    console.error('Error approving campaign:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Close campaign
router.post('/:campaignId/close', verifyToken, requirePlatformStaff, async (req, res) => {

  const { campaignId } = req.params;

  try {

    const result = await pool.query(
      `UPDATE campaigns
       SET lifecycle_state = 'CLOSED'
       WHERE id = $1
       RETURNING *`,
      [campaignId]
    );

    res.json(result.rows[0]);

  } catch (error) {
    console.error('Error closing campaign:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
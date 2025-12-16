const pool = require('../config/database');
const { body, validationResult } = require('express-validator');

// Get all organizations
const getOrganizations = async (req, res, next) => {
  try {
    const { org_type, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM organizations WHERE 1=1';
    const params = [];

    if (org_type) {
      query += ' AND org_type = ?';
      params.push(org_type);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [organizations] = await pool.execute(query, params);

    res.json({ organizations });
  } catch (error) {
    next(error);
  }
};

// Get organization by ID
const getOrganizationById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [organizations] = await pool.execute(
      'SELECT * FROM organizations WHERE id = ?',
      [id]
    );

    if (organizations.length === 0) {
      return res.status(404).json({ error: 'Organization not found.' });
    }

    // Get affiliated users
    const [affiliations] = await pool.execute(
      `SELECT ua.*, u.full_name, u.email, u.role
       FROM user_affiliations ua
       JOIN users u ON ua.user_id = u.id
       WHERE ua.org_id = ?`,
      [id]
    );

    res.json({
      organization: organizations[0],
      affiliations
    });
  } catch (error) {
    next(error);
  }
};

// Create organization (admin only)
const createOrganization = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, org_type } = req.body;

    const [result] = await pool.execute(
      'INSERT INTO organizations (name, org_type) VALUES (?, ?)',
      [name, org_type]
    );

    const [organizations] = await pool.execute(
      'SELECT * FROM organizations WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({ message: 'Organization created successfully', organization: organizations[0] });
  } catch (error) {
    next(error);
  }
};

// Create user affiliation
const createAffiliation = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { org_id } = req.body;
    const user_id = req.user.id;

    // Check if already affiliated
    const [existing] = await pool.execute(
      'SELECT * FROM user_affiliations WHERE user_id = ? AND org_id = ?',
      [user_id, org_id]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: 'User is already affiliated with this organization.' });
    }

    await pool.execute(
      'INSERT INTO user_affiliations (user_id, org_id, status) VALUES (?, ?, ?)',
      [user_id, org_id, 'pending']
    );

    const [affiliations] = await pool.execute(
      'SELECT * FROM user_affiliations WHERE user_id = ? AND org_id = ?',
      [user_id, org_id]
    );

    res.status(201).json({ message: 'Affiliation request created', affiliation: affiliations[0] });
  } catch (error) {
    next(error);
  }
};

// Update affiliation status (admin only)
const updateAffiliationStatus = async (req, res, next) => {
  try {
    const { user_id, org_id } = req.params;
    const { status } = req.body;

    if (!['pending', 'verified', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }

    await pool.execute(
      'UPDATE user_affiliations SET status = ?, verified_at = ? WHERE user_id = ? AND org_id = ?',
      [status, status === 'verified' ? new Date() : null, user_id, org_id]
    );

    const [affiliations] = await pool.execute(
      'SELECT * FROM user_affiliations WHERE user_id = ? AND org_id = ?',
      [user_id, org_id]
    );

    res.json({ message: 'Affiliation status updated', affiliation: affiliations[0] });
  } catch (error) {
    next(error);
  }
};

// Validation rules
const createOrganizationValidation = [
  body('name').trim().isLength({ min: 1 }).withMessage('Organization name is required'),
  body('org_type').isIn(['university', 'industrial_park', 'company']).withMessage('Invalid organization type')
];

const createAffiliationValidation = [
  body('org_id').isInt().withMessage('Organization ID is required')
];

module.exports = {
  getOrganizations,
  getOrganizationById,
  createOrganization,
  createAffiliation,
  updateAffiliationStatus,
  createOrganizationValidation,
  createAffiliationValidation
};




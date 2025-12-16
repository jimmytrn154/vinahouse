const pool = require('../config/database');
const { body, validationResult } = require('express-validator');

// Get all verifications
const getVerifications = async (req, res, next) => {
  try {
    const { target_type, target_id, status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT v.*,
             u.full_name as verifier_name
      FROM verifications v
      LEFT JOIN users u ON v.verifier_user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (target_type) {
      query += ' AND v.target_type = ?';
      params.push(target_type);
    }

    if (target_id) {
      query += ' AND v.target_id = ?';
      params.push(target_id);
    }

    if (status) {
      query += ' AND v.status = ?';
      params.push(status);
    }

    query += ' ORDER BY v.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [verifications] = await pool.execute(query, params);

    res.json({ verifications });
  } catch (error) {
    next(error);
  }
};

// Get verification by ID
const getVerificationById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [verifications] = await pool.execute(
      `SELECT v.*,
              u.full_name as verifier_name,
              u.email as verifier_email
       FROM verifications v
       LEFT JOIN users u ON v.verifier_user_id = u.id
       WHERE v.id = ?`,
      [id]
    );

    if (verifications.length === 0) {
      return res.status(404).json({ error: 'Verification not found.' });
    }

    res.json({ verification: verifications[0] });
  } catch (error) {
    next(error);
  }
};

// Create verification (admin only)
const createVerification = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { target_type, target_id, status, notes } = req.body;
    const verifier_user_id = req.user.id;

    // Check if verification already exists
    const [existing] = await pool.execute(
      'SELECT id FROM verifications WHERE target_type = ? AND target_id = ?',
      [target_type, target_id]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: 'Verification already exists for this target.' });
    }

    const [result] = await pool.execute(
      'INSERT INTO verifications (verifier_user_id, target_type, target_id, status, notes) VALUES (?, ?, ?, ?, ?)',
      [verifier_user_id, target_type, target_id, status || 'pending', notes || null]
    );

    // If verified, update listing status if target is a listing
    if (status === 'verified' && target_type === 'listing') {
      await pool.execute(
        'UPDATE listings SET status = ? WHERE id = ?',
        ['verified', target_id]
      );
    }

    const [verifications] = await pool.execute(
      'SELECT * FROM verifications WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({ message: 'Verification created successfully', verification: verifications[0] });
  } catch (error) {
    next(error);
  }
};

// Update verification (admin only)
const updateVerification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    // Get current verification
    const [verifications] = await pool.execute(
      'SELECT target_type, target_id, status FROM verifications WHERE id = ?',
      [id]
    );

    if (verifications.length === 0) {
      return res.status(404).json({ error: 'Verification not found.' });
    }

    const verification = verifications[0];

    // Build update query
    const updates = [];
    const params = [];

    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }

    if (notes !== undefined) {
      updates.push('notes = ?');
      params.push(notes);
    }

    if (updates.length > 0) {
      params.push(id);
      await pool.execute(
        `UPDATE verifications SET ${updates.join(', ')} WHERE id = ?`,
        params
      );

      // If verified, update listing status if target is a listing
      if (status === 'verified' && verification.target_type === 'listing') {
        await pool.execute(
          'UPDATE listings SET status = ? WHERE id = ?',
          ['verified', verification.target_id]
        );
      }
    }

    const [updated] = await pool.execute(
      'SELECT * FROM verifications WHERE id = ?',
      [id]
    );

    res.json({ message: 'Verification updated successfully', verification: updated[0] });
  } catch (error) {
    next(error);
  }
};

// Validation rules
const createVerificationValidation = [
  body('target_type').isIn(['landlord', 'property', 'listing']).withMessage('Invalid target type'),
  body('target_id').isInt().withMessage('Target ID is required'),
  body('status').optional().isIn(['pending', 'verified', 'rejected']),
  body('notes').optional().trim()
];

module.exports = {
  getVerifications,
  getVerificationById,
  createVerification,
  updateVerification,
  createVerificationValidation
};




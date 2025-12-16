const pool = require('../config/database');
const { body, validationResult } = require('express-validator');

// Get all reviews
const getReviews = async (req, res, next) => {
  try {
    const { contract_id, target_type, target_id, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT r.*,
             u.full_name as reviewer_name,
             c.id as contract_id
      FROM reviews r
      LEFT JOIN users u ON r.reviewer_user_id = u.id
      LEFT JOIN contracts c ON r.contract_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (contract_id) {
      query += ' AND r.contract_id = ?';
      params.push(contract_id);
    }

    if (target_type) {
      query += ' AND r.target_type = ?';
      params.push(target_type);
    }

    if (target_id) {
      query += ' AND r.target_id = ?';
      params.push(target_id);
    }

    query += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [reviews] = await pool.execute(query, params);

    res.json({ reviews });
  } catch (error) {
    next(error);
  }
};

// Get review by ID
const getReviewById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [reviews] = await pool.execute(
      `SELECT r.*,
              u.full_name as reviewer_name,
              u.email as reviewer_email
       FROM reviews r
       LEFT JOIN users u ON r.reviewer_user_id = u.id
       WHERE r.id = ?`,
      [id]
    );

    if (reviews.length === 0) {
      return res.status(404).json({ error: 'Review not found.' });
    }

    res.json({ review: reviews[0] });
  } catch (error) {
    next(error);
  }
};

// Create review
const createReview = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { contract_id, target_type, target_id, rating, comment } = req.body;
    const reviewer_user_id = req.user.id;

    // Verify contract access and that contract is active/signed
    const [contracts] = await pool.execute(
      `SELECT c.id, c.status,
              EXISTS(SELECT 1 FROM contract_tenants ct WHERE ct.contract_id = c.id AND ct.tenant_user_id = ?) as is_tenant
       FROM contracts c
       WHERE c.id = ?`,
      [reviewer_user_id, contract_id]
    );

    if (contracts.length === 0) {
      return res.status(404).json({ error: 'Contract not found.' });
    }

    const contract = contracts[0];

    // Only tenants can review
    if (contract.is_tenant !== 1 && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only tenants can create reviews.' });
    }

    // Check if contract is signed or active
    if (!['signed', 'active'].includes(contract.status)) {
      return res.status(400).json({ error: 'Can only review signed or active contracts.' });
    }

    // Check for duplicate review
    const [existing] = await pool.execute(
      'SELECT id FROM reviews WHERE contract_id = ? AND reviewer_user_id = ? AND target_type = ? AND target_id = ?',
      [contract_id, reviewer_user_id, target_type, target_id]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: 'You have already reviewed this target for this contract.' });
    }

    const [result] = await pool.execute(
      'INSERT INTO reviews (contract_id, reviewer_user_id, target_type, target_id, rating, comment) VALUES (?, ?, ?, ?, ?, ?)',
      [contract_id, reviewer_user_id, target_type, target_id, rating, comment || null]
    );

    const [reviews] = await pool.execute(
      'SELECT * FROM reviews WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({ message: 'Review created successfully', review: reviews[0] });
  } catch (error) {
    next(error);
  }
};

// Get average rating for a target
const getAverageRating = async (req, res, next) => {
  try {
    const { target_type, target_id } = req.query;

    if (!target_type || !target_id) {
      return res.status(400).json({ error: 'target_type and target_id are required.' });
    }

    const [stats] = await pool.execute(
      `SELECT 
         AVG(rating) as average_rating,
         COUNT(*) as total_reviews,
         SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
         SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
         SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
         SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
         SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
       FROM reviews
       WHERE target_type = ? AND target_id = ?`,
      [target_type, target_id]
    );

    res.json({ rating_stats: stats[0] });
  } catch (error) {
    next(error);
  }
};

// Validation rules
const createReviewValidation = [
  body('contract_id').isInt().withMessage('Contract ID is required'),
  body('target_type').isIn(['listing', 'landlord', 'property', 'room']).withMessage('Invalid target type'),
  body('target_id').isInt().withMessage('Target ID is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().trim()
];

module.exports = {
  getReviews,
  getReviewById,
  createReview,
  getAverageRating,
  createReviewValidation
};




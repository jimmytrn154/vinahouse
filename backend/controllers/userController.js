const pool = require('../config/database');
const { body, validationResult } = require('express-validator');

// Get all users (admin only)
const getUsers = async (req, res, next) => {
  try {
    const { role, status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT id, email, full_name, phone, role, status, created_at, updated_at FROM users WHERE 1=1';
    const params = [];

    if (role) {
      query += ' AND role = ?';
      params.push(role);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [users] = await pool.execute(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
    const countParams = [];
    if (role) {
      countQuery += ' AND role = ?';
      countParams.push(role);
    }
    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }
    const [countResult] = await pool.execute(countQuery, countParams);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        pages: Math.ceil(countResult[0].total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get user by ID
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [users] = await pool.execute(
      'SELECT id, email, full_name, phone, role, status, created_at, updated_at FROM users WHERE id = ?',
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({ user: users[0] });
  } catch (error) {
    next(error);
  }
};

// Update user profile
const updateProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { full_name, phone } = req.body;
    const userId = req.user.id;

    await pool.execute(
      'UPDATE users SET full_name = ?, phone = ? WHERE id = ?',
      [full_name, phone || null, userId]
    );

    const [users] = await pool.execute(
      'SELECT id, email, full_name, phone, role, status, created_at, updated_at FROM users WHERE id = ?',
      [userId]
    );

    res.json({ message: 'Profile updated successfully', user: users[0] });
  } catch (error) {
    next(error);
  }
};

// Update user status (admin only)
const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'suspended', 'deleted'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value.' });
    }

    await pool.execute(
      'UPDATE users SET status = ? WHERE id = ?',
      [status, id]
    );

    res.json({ message: 'User status updated successfully' });
  } catch (error) {
    next(error);
  }
};

// Get user preferences
const getUserPreferences = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [prefs] = await pool.execute(
      'SELECT * FROM user_preferences WHERE user_id = ?',
      [userId]
    );

    if (prefs.length === 0) {
      return res.json({ preferences: null });
    }

    res.json({ preferences: prefs[0] });
  } catch (error) {
    next(error);
  }
};

// Update user preferences
const updateUserPreferences = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { budget_min, budget_max, move_in, commute_max_km, tags_json } = req.body;

    // Check if preferences exist
    const [existing] = await pool.execute(
      'SELECT user_id FROM user_preferences WHERE user_id = ?',
      [userId]
    );

    if (existing.length === 0) {
      // Insert
      await pool.execute(
        'INSERT INTO user_preferences (user_id, budget_min, budget_max, move_in, commute_max_km, tags_json) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, budget_min || null, budget_max || null, move_in || null, commute_max_km || null, tags_json ? JSON.stringify(tags_json) : null]
      );
    } else {
      // Update
      await pool.execute(
        'UPDATE user_preferences SET budget_min = ?, budget_max = ?, move_in = ?, commute_max_km = ?, tags_json = ? WHERE user_id = ?',
        [budget_min || null, budget_max || null, move_in || null, commute_max_km || null, tags_json ? JSON.stringify(tags_json) : null, userId]
      );
    }

    const [prefs] = await pool.execute(
      'SELECT * FROM user_preferences WHERE user_id = ?',
      [userId]
    );

    res.json({ message: 'Preferences updated successfully', preferences: prefs[0] });
  } catch (error) {
    next(error);
  }
};

// Validation rules
const updateProfileValidation = [
  body('full_name').optional().trim().isLength({ min: 1 }),
  body('phone').optional().trim()
];

module.exports = {
  getUsers,
  getUserById,
  updateProfile,
  updateUserStatus,
  getUserPreferences,
  updateUserPreferences,
  updateProfileValidation
};




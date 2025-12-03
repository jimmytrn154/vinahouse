const pool = require('../config/database');
const { body, validationResult } = require('express-validator');

// Get all properties
const getProperties = async (req, res, next) => {
  try {
    const { owner_id, org_id, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT p.*, u.full_name as owner_name, o.name as org_name
      FROM properties p
      LEFT JOIN users u ON p.owner_user_id = u.id
      LEFT JOIN organizations o ON p.org_id = o.id
      WHERE 1=1
    `;
    const params = [];

    if (owner_id) {
      query += ' AND p.owner_user_id = ?';
      params.push(owner_id);
    }

    if (org_id) {
      query += ' AND p.org_id = ?';
      params.push(org_id);
    }

    query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [properties] = await pool.execute(query, params);

    res.json({ properties });
  } catch (error) {
    next(error);
  }
};

// Get property by ID
const getPropertyById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [properties] = await pool.execute(
      `SELECT p.*, u.full_name as owner_name, o.name as org_name
       FROM properties p
       LEFT JOIN users u ON p.owner_user_id = u.id
       LEFT JOIN organizations o ON p.org_id = o.id
       WHERE p.id = ?`,
      [id]
    );

    if (properties.length === 0) {
      return res.status(404).json({ error: 'Property not found.' });
    }

    // Get house rules
    const [rules] = await pool.execute(
      'SELECT * FROM house_rules WHERE property_id = ?',
      [id]
    );

    // Get rooms
    const [rooms] = await pool.execute(
      'SELECT * FROM rooms WHERE property_id = ? ORDER BY created_at',
      [id]
    );

    res.json({
      property: properties[0],
      house_rules: rules[0] || null,
      rooms
    });
  } catch (error) {
    next(error);
  }
};

// Create property
const createProperty = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { address, geo_lat, geo_lng, description, org_id } = req.body;
    const owner_user_id = req.user.id;

    const [result] = await pool.execute(
      'INSERT INTO properties (owner_user_id, org_id, address, geo_lat, geo_lng, description) VALUES (?, ?, ?, ?, ?, ?)',
      [owner_user_id, org_id || null, address, geo_lat || null, geo_lng || null, description || null]
    );

    const [properties] = await pool.execute(
      'SELECT * FROM properties WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({ message: 'Property created successfully', property: properties[0] });
  } catch (error) {
    next(error);
  }
};

// Update property
const updateProperty = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { address, geo_lat, geo_lng, description, org_id } = req.body;

    // Check ownership
    const [properties] = await pool.execute(
      'SELECT owner_user_id FROM properties WHERE id = ?',
      [id]
    );

    if (properties.length === 0) {
      return res.status(404).json({ error: 'Property not found.' });
    }

    if (properties[0].owner_user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You do not have permission to update this property.' });
    }

    await pool.execute(
      'UPDATE properties SET address = ?, geo_lat = ?, geo_lng = ?, description = ?, org_id = ? WHERE id = ?',
      [address, geo_lat || null, geo_lng || null, description || null, org_id || null, id]
    );

    const [updated] = await pool.execute(
      'SELECT * FROM properties WHERE id = ?',
      [id]
    );

    res.json({ message: 'Property updated successfully', property: updated[0] });
  } catch (error) {
    next(error);
  }
};

// Delete property
const deleteProperty = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check ownership
    const [properties] = await pool.execute(
      'SELECT owner_user_id FROM properties WHERE id = ?',
      [id]
    );

    if (properties.length === 0) {
      return res.status(404).json({ error: 'Property not found.' });
    }

    if (properties[0].owner_user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You do not have permission to delete this property.' });
    }

    await pool.execute('DELETE FROM properties WHERE id = ?', [id]);

    res.json({ message: 'Property deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Create or update house rules
const updateHouseRules = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rules_text } = req.body;

    // Check ownership
    const [properties] = await pool.execute(
      'SELECT owner_user_id FROM properties WHERE id = ?',
      [id]
    );

    if (properties.length === 0) {
      return res.status(404).json({ error: 'Property not found.' });
    }

    if (properties[0].owner_user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You do not have permission to update house rules.' });
    }

    // Check if rules exist
    const [existing] = await pool.execute(
      'SELECT property_id FROM house_rules WHERE property_id = ?',
      [id]
    );

    if (existing.length === 0) {
      await pool.execute(
        'INSERT INTO house_rules (property_id, rules_text) VALUES (?, ?)',
        [id, rules_text]
      );
    } else {
      await pool.execute(
        'UPDATE house_rules SET rules_text = ? WHERE property_id = ?',
        [rules_text, id]
      );
    }

    const [rules] = await pool.execute(
      'SELECT * FROM house_rules WHERE property_id = ?',
      [id]
    );

    res.json({ message: 'House rules updated successfully', house_rules: rules[0] });
  } catch (error) {
    next(error);
  }
};

// Create room
const createRoom = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { property_id, room_name, capacity, area_m2, base_rent } = req.body;

    // Check property ownership
    const [properties] = await pool.execute(
      'SELECT owner_user_id FROM properties WHERE id = ?',
      [property_id]
    );

    if (properties.length === 0) {
      return res.status(404).json({ error: 'Property not found.' });
    }

    if (properties[0].owner_user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You do not have permission to add rooms to this property.' });
    }

    const [result] = await pool.execute(
      'INSERT INTO rooms (property_id, room_name, capacity, area_m2, base_rent) VALUES (?, ?, ?, ?, ?)',
      [property_id, room_name, capacity, area_m2 || null, base_rent || null]
    );

    const [rooms] = await pool.execute(
      'SELECT * FROM rooms WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({ message: 'Room created successfully', room: rooms[0] });
  } catch (error) {
    next(error);
  }
};

// Validation rules
const createPropertyValidation = [
  body('address').trim().isLength({ min: 1 }).withMessage('Address is required'),
  body('geo_lat').optional().isFloat(),
  body('geo_lng').optional().isFloat(),
  body('description').optional().trim()
];

const createRoomValidation = [
  body('property_id').isInt().withMessage('Property ID is required'),
  body('room_name').trim().isLength({ min: 1 }).withMessage('Room name is required'),
  body('capacity').isInt({ min: 1 }).withMessage('Capacity must be at least 1'),
  body('area_m2').optional().isFloat({ min: 0 }),
  body('base_rent').optional().isFloat({ min: 0 })
];

module.exports = {
  getProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  updateHouseRules,
  createRoom,
  createPropertyValidation,
  createRoomValidation
};



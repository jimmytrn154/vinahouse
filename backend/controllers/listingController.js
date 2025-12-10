const pool = require('../config/database');
const { body, validationResult } = require('express-validator');

// Get all listings with filters
// backend/controllers/listingController.js
const getListings = async (req, res, next) => {
  try {
    const {
      status,
      property_id,
      room_id,
      owner_id,
      min_price,
      max_price,
      available_from,
      page = 1,
      limit = 20
    } = req.query;

    // 1. ✅ Force Integer Conversion (The Fix)
    const limitNum = parseInt(limit, 10);
    const offsetNum = (parseInt(page, 10) - 1) * limitNum;

    let query = `
      SELECT l.*, 
             u.full_name as owner_name,
             p.address as property_address,
             r.room_name,
             lf.features_json
      FROM listings l
      LEFT JOIN users u ON l.owner_user_id = u.id
      LEFT JOIN properties p ON l.property_id = p.id
      LEFT JOIN rooms r ON l.room_id = r.id
      LEFT JOIN listing_features lf ON l.id = lf.listing_id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND l.status = ?';
      params.push(status);
    }

    if (property_id) {
      query += ' AND l.property_id = ?';
      params.push(property_id);
    }

    if (room_id) {
      query += ' AND l.room_id = ?';
      params.push(room_id);
    }

    if (owner_id) {
      query += ' AND l.owner_user_id = ?';
      params.push(owner_id);
    }

    if (min_price) {
      query += ' AND l.price >= ?';
      params.push(min_price);
    }

    if (max_price) {
      query += ' AND l.price <= ?';
      params.push(max_price);
    }

    if (available_from) {
      query += ' AND l.available_from <= ?';
      params.push(available_from);
    }

    query += ' ORDER BY l.created_at DESC LIMIT ? OFFSET ?';
    
    // 2. ✅ Push the Numbers
    params.push(limitNum, offsetNum);

    // 3. ✅ Use pool.query (Safer for LIMIT/OFFSET)
    const [listings] = await pool.query(query, params);

    // Parse JSON features
    listings.forEach(listing => {
      if (listing.features_json) {
        // Handle double-stringified JSON if necessary, or just parse
        try {
          listing.features_json = typeof listing.features_json === 'string' 
            ? JSON.parse(listing.features_json) 
            : listing.features_json;
        } catch (e) {
          listing.features_json = {};
        }
      }
    });

    res.json({ listings });
  } catch (error) {
    next(error);
  }
};

// Get listing by ID
const getListingById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [listings] = await pool.execute(
      `SELECT l.*, 
              u.full_name as owner_name,
              p.address as property_address,
              r.room_name,
              lf.features_json
       FROM listings l
       LEFT JOIN users u ON l.owner_user_id = u.id
       LEFT JOIN properties p ON l.property_id = p.id
       LEFT JOIN rooms r ON l.room_id = r.id
       LEFT JOIN listing_features lf ON l.id = lf.listing_id
       WHERE l.id = ?`,
      [id]
    );

    if (listings.length === 0) {
      return res.status(404).json({ error: 'Listing not found.' });
    }

    const listing = listings[0];
    if (listing.features_json) {
      listing.features_json = JSON.parse(listing.features_json);
    }

    res.json({ listing });
  } catch (error) {
    next(error);
  }
};

// Create listing
const createListing = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { property_id, room_id, price, deposit, available_from, features_json } = req.body;
    const owner_user_id = req.user.id;

    // Validate that exactly one of property_id or room_id is provided
    if (!property_id && !room_id) {
      return res.status(400).json({ error: 'Either property_id or room_id must be provided.' });
    }

    if (property_id && room_id) {
      return res.status(400).json({ error: 'Cannot specify both property_id and room_id.' });
    }

    // Verify ownership if room_id is provided
    if (room_id) {
      const [rooms] = await pool.execute(
        'SELECT p.owner_user_id FROM rooms r JOIN properties p ON r.property_id = p.id WHERE r.id = ?',
        [room_id]
      );

      if (rooms.length === 0) {
        return res.status(404).json({ error: 'Room not found.' });
      }

      if (rooms[0].owner_user_id !== owner_user_id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'You do not own this room.' });
      }
    }

    // Verify ownership if property_id is provided
    if (property_id) {
      const [properties] = await pool.execute(
        'SELECT owner_user_id FROM properties WHERE id = ?',
        [property_id]
      );

      if (properties.length === 0) {
        return res.status(404).json({ error: 'Property not found.' });
      }

      if (properties[0].owner_user_id !== owner_user_id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'You do not own this property.' });
      }
    }

    const [result] = await pool.execute(
      'INSERT INTO listings (owner_user_id, property_id, room_id, price, deposit, available_from, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [owner_user_id, property_id || null, room_id || null, price, deposit || 0, available_from || null, 'pending_verification']
    );

    // Create listing features if provided
    if (features_json) {
      await pool.execute(
        'INSERT INTO listing_features (listing_id, features_json) VALUES (?, ?)',
        [result.insertId, JSON.stringify(features_json)]
      );
    }

    const [listings] = await pool.execute(
      'SELECT * FROM listings WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({ message: 'Listing created successfully', listing: listings[0] });
  } catch (error) {
    next(error);
  }
};

// Update listing
const updateListing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { price, deposit, available_from, status, features_json } = req.body;

    // Check ownership
    const [listings] = await pool.execute(
      'SELECT owner_user_id FROM listings WHERE id = ?',
      [id]
    );

    if (listings.length === 0) {
      return res.status(404).json({ error: 'Listing not found.' });
    }

    if (listings[0].owner_user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You do not have permission to update this listing.' });
    }

    // Build update query dynamically
    const updates = [];
    const params = [];

    if (price !== undefined) {
      updates.push('price = ?');
      params.push(price);
    }
    if (deposit !== undefined) {
      updates.push('deposit = ?');
      params.push(deposit);
    }
    if (available_from !== undefined) {
      updates.push('available_from = ?');
      params.push(available_from);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }

    if (updates.length > 0) {
      params.push(id);
      await pool.execute(
        `UPDATE listings SET ${updates.join(', ')} WHERE id = ?`,
        params
      );
    }

    // Update features if provided
    if (features_json !== undefined) {
      const [existing] = await pool.execute(
        'SELECT listing_id FROM listing_features WHERE listing_id = ?',
        [id]
      );

      if (existing.length === 0) {
        await pool.execute(
          'INSERT INTO listing_features (listing_id, features_json) VALUES (?, ?)',
          [id, JSON.stringify(features_json)]
        );
      } else {
        await pool.execute(
          'UPDATE listing_features SET features_json = ? WHERE listing_id = ?',
          [JSON.stringify(features_json), id]
        );
      }
    }

    const [updated] = await pool.execute(
      'SELECT * FROM listings WHERE id = ?',
      [id]
    );

    res.json({ message: 'Listing updated successfully', listing: updated[0] });
  } catch (error) {
    next(error);
  }
};

// Delete listing
const deleteListing = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check ownership
    const [listings] = await pool.execute(
      'SELECT owner_user_id FROM listings WHERE id = ?',
      [id]
    );

    if (listings.length === 0) {
      return res.status(404).json({ error: 'Listing not found.' });
    }

    if (listings[0].owner_user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You do not have permission to delete this listing.' });
    }

    await pool.execute('DELETE FROM listings WHERE id = ?', [id]);

    res.json({ message: 'Listing deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Validation rules
const createListingValidation = [
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('deposit').optional().isFloat({ min: 0 }),
  body('available_from').optional().isISO8601().toDate(),
  body('property_id').optional().isInt(),
  body('room_id').optional().isInt(),
  body('features_json').optional().isObject()
];

module.exports = {
  getListings,
  getListingById,
  createListing,
  updateListing,
  deleteListing,
  createListingValidation
};



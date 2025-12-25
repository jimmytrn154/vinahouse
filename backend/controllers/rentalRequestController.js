const pool = require('../config/database');
const { body, validationResult } = require('express-validator');

// Get all rental requests
const getRentalRequests = async (req, res, next) => {
  try {
    const { listing_id, requester_id, status, owner_id, page = 1, limit = 20 } = req.query;

    // 1. ✅ Fix: Force Integer Conversion
    const limitNum = parseInt(limit, 10);
    const offsetNum = (parseInt(page, 10) - 1) * limitNum;

    let query = `
      SELECT rr.*, 
             l.price, 
             p.address as property_address,
             u.full_name as requester_name,
             u.email as requester_email
      FROM rental_requests rr
      LEFT JOIN listings l ON rr.listing_id = l.id
      LEFT JOIN properties p ON l.property_id = p.id
      LEFT JOIN users u ON rr.requester_user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (owner_id) {
      query += ' AND l.owner_user_id = ?';
      params.push(owner_id);
    }

    if (listing_id) {
      query += ' AND rr.listing_id = ?';
      params.push(listing_id);
    }

    if (requester_id) {
      query += ' AND rr.requester_user_id = ?';
      params.push(requester_id);
    }

    if (status) {
      query += ' AND rr.status = ?';
      params.push(status);
    }

    // Add ordering
    query += ' ORDER BY rr.created_at DESC LIMIT ? OFFSET ?';

    // 2. ✅ Fix: Push Numbers
    params.push(limitNum, offsetNum);

    // 3. ✅ Fix: Use pool.query instead of pool.execute
    const [requests] = await pool.query(query, params);

    res.json({ requests });
  } catch (error) {
    next(error);
  }
};

// Get rental request by ID
const getRentalRequestById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [requests] = await pool.execute(
      `SELECT rr.*, 
              u.full_name as requester_name,
              u.email as requester_email,
              l.price as listing_price,
              p.address as property_address
       FROM rental_requests rr
       LEFT JOIN users u ON rr.requester_user_id = u.id
       LEFT JOIN listings l ON rr.listing_id = l.id
       LEFT JOIN properties p ON l.property_id = p.id
       WHERE rr.id = ?`,
      [id]
    );

    if (requests.length === 0) {
      return res.status(404).json({ error: 'Rental request not found.' });
    }

    res.json({ rental_request: requests[0] });
  } catch (error) {
    next(error);
  }
};

// Create rental request
// backend/controllers/rentalRequestController.js

const createRentalRequest = async (req, res, next) => {
  try {
    // 1. Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { listing_id, message, desired_move_in } = req.body;
    const requester_user_id = req.user.id; // Assumes auth middleware sets this

    // --- LOGIC MOVED FROM STORED PROCEDURE TO NODE.JS ---

    // Check 1: Listing Exists & Is Verified
    // We use pool.query to avoid TiDB "Prepared Statement" issues
    const [listings] = await pool.query(
      'SELECT status, owner_user_id FROM listings WHERE id = ?', 
      [listing_id]
    );

    if (listings.length === 0) {
      return res.status(404).json({ error: 'Listing does not exist' });
    }
    
    const listing = listings[0];
    if (listing.status !== 'verified') {
      return res.status(400).json({ error: 'Listing is not open for rental requests' });
    }

    // Check 2: Requester is a Tenant
    // (Optional: You can likely get this from req.user.role if your JWT has it, 
    // but we'll query DB to be 100% safe matching the procedure logic)
    const [users] = await pool.query(
      'SELECT role FROM users WHERE id = ?', 
      [requester_user_id]
    );

    if (users.length === 0 || users[0].role !== 'tenant') {
      return res.status(403).json({ error: 'Only tenants can create rental requests' });
    }

    // Check 3: Prevent Duplicates
    const [duplicates] = await pool.query(
      'SELECT id FROM rental_requests WHERE listing_id = ? AND requester_user_id = ? AND status = "pending"',
      [listing_id, requester_user_id]
    );

    if (duplicates.length > 0) {
      return res.status(409).json({ error: 'You already have a pending request for this listing' });
    }

    // --- ALL CHECKS PASSED, INSERT DATA ---

    const [insertResult] = await pool.query(
      `INSERT INTO rental_requests (listing_id, requester_user_id, message, desired_move_in, status) 
       VALUES (?, ?, ?, ?, 'pending')`,
      [listing_id, requester_user_id, message || null, desired_move_in || null]
    );

    // Fetch the newly created request to return it (matching previous behavior)
    const [newRequest] = await pool.query(
      'SELECT * FROM rental_requests WHERE id = ?',
      [insertResult.insertId]
    );

    // Real-time notification
    if (req.io) {
      req.io.emit('rental_request_created', newRequest[0]);
    }

    res.status(201).json({
      message: 'Rental request created successfully',
      rental_request: newRequest[0]
    });

  } catch (error) {
    next(error);
  }
};

// Update rental request status (accept/reject/cancel)
const updateRentalRequestStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['accepted', 'rejected', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be accepted, rejected, or cancelled.' });
    }

    // Get rental request
    const [requests] = await pool.execute(
      `SELECT rr.*, l.owner_user_id, l.price, l.deposit 
       FROM rental_requests rr
       JOIN listings l ON rr.listing_id = l.id
       WHERE rr.id = ?`,
      [id]
    );

    if (requests.length === 0) {
      return res.status(404).json({ error: 'Rental request not found.' });
    }

    const request = requests[0];
    console.log("--- DEBUG PERMISSIONS ---");
    console.log("Listing ID:", request.listing_id);
    console.log("Real Owner ID (DB):", request.owner_user_id);
    console.log("Current User ID (You):", req.user.id);
    console.log("-------------------------");


    // Check permissions
    if (status === 'cancelled') {
      // Only requester can cancel
      if (request.requester_user_id !== req.user.id) {
        return res.status(403).json({ error: 'Only the requester can cancel this request.' });
      }
    } else {
      // Only landlord can accept/reject
      if (request.owner_user_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Only the listing owner can accept or reject requests.' });
      }
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request is no longer pending.' });
    }

    await pool.execute(
      'UPDATE rental_requests SET status = ? WHERE id = ?',
      [status, id]
    );

    // If accepted, create a draft contract automatically
    if (status === 'accepted') {
      // Check if contract already exists to prevent duplicates
      const [existingContract] = await pool.execute(
        'SELECT id FROM contracts WHERE listing_id = ? AND landlord_user_id = ? AND status != "cancelled"',
        [request.listing_id, request.owner_user_id]
      );

      // Only create if no active/draft contract exists (basic check)
      if (existingContract.length === 0) {
        const startDate = request.desired_move_in || new Date();
        const rent = request.price || 0;
        const deposit = request.deposit || 0;

        const [contractResult] = await pool.execute(
          'INSERT INTO contracts (listing_id, landlord_user_id, start_date, rent, deposit, status) VALUES (?, ?, ?, ?, ?, ?)',
          [request.listing_id, request.owner_user_id, startDate, rent, deposit, 'draft']
        );

        const newContractId = contractResult.insertId;

        await pool.execute(
          'INSERT INTO contract_tenants (contract_id, tenant_user_id) VALUES (?, ?)',
          [newContractId, request.requester_user_id]
        );
      }
    }

    const [updated] = await pool.execute(
      'SELECT * FROM rental_requests WHERE id = ?',
      [id]
    );

    res.json({ message: `Rental request ${status} successfully`, rental_request: updated[0] });
  } catch (error) {
    next(error);
  }
};

// Validation rules
const createRentalRequestValidation = [
  body('listing_id').isInt().withMessage('Listing ID is required'),
  body('message').optional().trim(),
  body('desired_move_in').optional().isISO8601().toDate()
];

module.exports = {
  getRentalRequests,
  getRentalRequestById,
  createRentalRequest,
  updateRentalRequestStatus,
  createRentalRequestValidation
};




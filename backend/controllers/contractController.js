const pool = require('../config/database');
const { body, validationResult } = require('express-validator');

// Get all contracts
const getContracts = async (req, res, next) => {
  try {
    const { landlord_id, tenant_id, status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT c.*, 
             u_landlord.full_name as landlord_name,
             l.price as listing_price,
             p.address as property_address
      FROM contracts c
      LEFT JOIN users u_landlord ON c.landlord_user_id = u_landlord.id
      LEFT JOIN listings l ON c.listing_id = l.id
      LEFT JOIN properties p ON l.property_id = p.id
      WHERE 1=1
    `;
    const params = [];

    // Filter by user role
    if (req.user.role === 'landlord') {
      query += ' AND c.landlord_user_id = ?';
      params.push(req.user.id);
    } else if (req.user.role === 'tenant') {
      query += ' AND EXISTS (SELECT 1 FROM contract_tenants ct WHERE ct.contract_id = c.id AND ct.tenant_user_id = ?)';
      params.push(req.user.id);
    }

    if (landlord_id) {
      query += ' AND c.landlord_user_id = ?';
      params.push(landlord_id);
    }

    if (tenant_id) {
      query += ' AND EXISTS (SELECT 1 FROM contract_tenants ct WHERE ct.contract_id = c.id AND ct.tenant_user_id = ?)';
      params.push(tenant_id);
    }

    if (status) {
      query += ' AND c.status = ?';
      params.push(status);
    }

    query += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [contracts] = await pool.execute(query, params);

    // Get tenants for each contract
    for (let contract of contracts) {
      const [tenants] = await pool.execute(
        `SELECT u.id, u.full_name, u.email 
         FROM contract_tenants ct
         JOIN users u ON ct.tenant_user_id = u.id
         WHERE ct.contract_id = ?`,
        [contract.id]
      );
      contract.tenants = tenants;
    }

    res.json({ contracts });
  } catch (error) {
    next(error);
  }
};

// Get contract by ID
const getContractById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [contracts] = await pool.execute(
      `SELECT c.*, 
              u_landlord.full_name as landlord_name,
              u_landlord.email as landlord_email,
              l.price as listing_price,
              p.address as property_address
       FROM contracts c
       LEFT JOIN users u_landlord ON c.landlord_user_id = u_landlord.id
       LEFT JOIN listings l ON c.listing_id = l.id
       LEFT JOIN properties p ON l.property_id = p.id
       WHERE c.id = ?`,
      [id]
    );

    if (contracts.length === 0) {
      return res.status(404).json({ error: 'Contract not found.' });
    }

    const contract = contracts[0];

    // Get tenants
    const [tenants] = await pool.execute(
      `SELECT u.id, u.full_name, u.email 
       FROM contract_tenants ct
       JOIN users u ON ct.tenant_user_id = u.id
       WHERE ct.contract_id = ?`,
      [id]
    );
    contract.tenants = tenants;

    // Get signatures
    const [signatures] = await pool.execute(
      `SELECT cs.*, u.full_name, u.email
       FROM contract_signatures cs
       JOIN users u ON cs.user_id = u.id
       WHERE cs.contract_id = ?`,
      [id]
    );
    contract.signatures = signatures;

    res.json({ contract });
  } catch (error) {
    next(error);
  }
};

// Create contract from accepted rental request
const createContract = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { rental_request_id, start_date, end_date, rent, deposit, tenant_ids } = req.body;

    // Get rental request
    const [requests] = await pool.execute(
      `SELECT rr.*, l.owner_user_id, l.id as listing_id
       FROM rental_requests rr
       JOIN listings l ON rr.listing_id = l.id
       WHERE rr.id = ? AND rr.status = 'accepted'`,
      [rental_request_id]
    );

    if (requests.length === 0) {
      return res.status(404).json({ error: 'Accepted rental request not found.' });
    }

    const request = requests[0];

    // Verify landlord ownership
    if (request.owner_user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You do not own this listing.' });
    }

    // Create contract
    const [result] = await pool.execute(
      'INSERT INTO contracts (listing_id, landlord_user_id, start_date, end_date, rent, deposit, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [request.listing_id, req.user.id, start_date, end_date || null, rent, deposit || 0, 'draft']
    );

    const contractId = result.insertId;

    // Add tenants (include requester by default)
    const tenantIds = tenant_ids || [request.requester_user_id];
    if (!tenantIds.includes(request.requester_user_id)) {
      tenantIds.push(request.requester_user_id);
    }

    for (const tenantId of tenantIds) {
      await pool.execute(
        'INSERT INTO contract_tenants (contract_id, tenant_user_id) VALUES (?, ?)',
        [contractId, tenantId]
      );
    }

    const [contracts] = await pool.execute(
      'SELECT * FROM contracts WHERE id = ?',
      [contractId]
    );

    res.status(201).json({ message: 'Contract created successfully', contract: contracts[0] });
  } catch (error) {
    next(error);
  }
};

// Update contract
const updateContract = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { start_date, end_date, rent, deposit, status } = req.body;

    // Check ownership
    const [contracts] = await pool.execute(
      'SELECT landlord_user_id, status FROM contracts WHERE id = ?',
      [id]
    );

    if (contracts.length === 0) {
      return res.status(404).json({ error: 'Contract not found.' });
    }

    const contract = contracts[0];

    if (contract.landlord_user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You do not have permission to update this contract.' });
    }

    // Build update query
    const updates = [];
    const params = [];

    if (start_date !== undefined) {
      updates.push('start_date = ?');
      params.push(start_date);
    }
    if (end_date !== undefined) {
      updates.push('end_date = ?');
      params.push(end_date);
    }
    if (rent !== undefined) {
      updates.push('rent = ?');
      params.push(rent);
    }
    if (deposit !== undefined) {
      updates.push('deposit = ?');
      params.push(deposit);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
      if (status === 'signed') {
        updates.push('signed_at = NOW()');
      }
    }

    if (updates.length > 0) {
      params.push(id);
      await pool.execute(
        `UPDATE contracts SET ${updates.join(', ')} WHERE id = ?`,
        params
      );
    }

    const [updated] = await pool.execute(
      'SELECT * FROM contracts WHERE id = ?',
      [id]
    );

    res.json({ message: 'Contract updated successfully', contract: updated[0] });
  } catch (error) {
    next(error);
  }
};

// Sign contract
const signContract = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { signature_method = 'checkbox' } = req.body;

    // Get contract
    const [contracts] = await pool.execute(
      `SELECT c.*, 
              EXISTS(SELECT 1 FROM contract_tenants ct WHERE ct.contract_id = c.id AND ct.tenant_user_id = ?) as is_tenant
       FROM contracts c
       WHERE c.id = ?`,
      [req.user.id, id]
    );

    if (contracts.length === 0) {
      return res.status(404).json({ error: 'Contract not found.' });
    }

    const contract = contracts[0];

    // Check if user is landlord or tenant
    const isLandlord = contract.landlord_user_id === req.user.id;
    const isTenant = contract.is_tenant === 1;

    if (!isLandlord && !isTenant) {
      return res.status(403).json({ error: 'You are not authorized to sign this contract.' });
    }

    // Check if already signed
    const [existing] = await pool.execute(
      'SELECT * FROM contract_signatures WHERE contract_id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: 'You have already signed this contract.' });
    }

    // Add signature
    await pool.execute(
      'INSERT INTO contract_signatures (contract_id, user_id, signed_at, signature_method) VALUES (?, ?, NOW(), ?)',
      [id, req.user.id, signature_method]
    );

    // Check if all parties have signed
    const [allSignatures] = await pool.execute(
      `SELECT COUNT(DISTINCT cs.user_id) as signed_count,
              (SELECT COUNT(*) FROM contract_tenants WHERE contract_id = ?) + 1 as total_parties
       FROM contract_signatures cs
       WHERE cs.contract_id = ?`,
      [id, id]
    );

    if (allSignatures[0].signed_count === allSignatures[0].total_parties) {
      // All parties signed, update contract status
      await pool.execute(
        'UPDATE contracts SET status = ?, signed_at = NOW() WHERE id = ?',
        ['signed', id]
      );
    }

    const [signatures] = await pool.execute(
      'SELECT * FROM contract_signatures WHERE contract_id = ? AND user_id = ?',
      [id, req.user.id]
    );

    res.json({ message: 'Contract signed successfully', signature: signatures[0] });
  } catch (error) {
    next(error);
  }
};

// Validation rules
const createContractValidation = [
  body('rental_request_id').isInt().withMessage('Rental request ID is required'),
  body('start_date').isISO8601().toDate().withMessage('Valid start date is required'),
  body('end_date').optional().isISO8601().toDate(),
  body('rent').isFloat({ min: 0 }).withMessage('Rent must be a positive number'),
  body('deposit').optional().isFloat({ min: 0 }),
  body('tenant_ids').optional().isArray()
];

module.exports = {
  getContracts,
  getContractById,
  createContract,
  updateContract,
  signContract,
  createContractValidation
};




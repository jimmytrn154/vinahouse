const pool = require('../config/database');
const { body, validationResult } = require('express-validator');

// Get all contracts
// Get all contracts
const getContracts = async (req, res, next) => {
  try {
    const { landlord_id, tenant_id, status, page = 1, limit = 20 } = req.query;
    const limitNum = parseInt(limit, 10);
    const pageNum = parseInt(page, 10);
    const offset = (pageNum - 1) * limitNum;

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
    params.push(limitNum, offset);

    const [contracts] = await pool.query(query, params);

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
              l.id as listing_id,
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

    // Check authorization: user must be either the landlord or a tenant
    const isLandlord = contract.landlord_user_id === req.user.id;
    
    // Check if user is a tenant
    const [tenantCheck] = await pool.execute(
      'SELECT 1 FROM contract_tenants WHERE contract_id = ? AND tenant_user_id = ?',
      [id, req.user.id]
    );
    const isTenant = tenantCheck.length > 0;

    // Admin can access all contracts
    if (!isLandlord && !isTenant && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You are not authorized to view this contract.' });
    }

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

    // Get proposed end dates (if table exists)
    try {
      const [proposedEndDates] = await pool.execute(
        `SELECT user_id, proposed_end_date
         FROM contract_proposed_end_dates
         WHERE contract_id = ?`,
        [id]
      );
      
      // Add proposed end dates to contract
      contract.proposed_end_dates = {};
      proposedEndDates.forEach(item => {
        // Format date to YYYY-MM-DD string to avoid timezone issues
        let dateStr = item.proposed_end_date;
        if (dateStr instanceof Date) {
          const year = dateStr.getFullYear();
          const month = String(dateStr.getMonth() + 1).padStart(2, '0');
          const day = String(dateStr.getDate()).padStart(2, '0');
          dateStr = `${year}-${month}-${day}`;
        } else if (typeof dateStr === 'string' && dateStr.includes('T')) {
          dateStr = dateStr.split('T')[0];
        }
        
        if (item.user_id === contract.landlord_user_id) {
          contract.proposed_end_dates.landlord = dateStr;
        } else {
          // Check if it's a tenant
          const tenant = tenants.find(t => t.id === item.user_id);
          if (tenant) {
            if (!contract.proposed_end_dates.tenants) {
              contract.proposed_end_dates.tenants = {};
            }
            contract.proposed_end_dates.tenants[item.user_id] = dateStr;
          }
        }
      });
    } catch (err) {
      // Table doesn't exist yet, initialize empty object
      contract.proposed_end_dates = {};
    }

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

    // Check ownership and authorization
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
    const isLandlord = contract.landlord_user_id === req.user.id;
    const isTenant = contract.is_tenant === 1;

    // For end_date updates, allow both landlord and tenant (when both have agreed)
    // For other fields, only landlord can update
    const isUpdatingEndDateOnly = end_date !== undefined && 
                                   start_date === undefined && 
                                   rent === undefined && 
                                   deposit === undefined && 
                                   status === undefined;

    if (!isUpdatingEndDateOnly && contract.landlord_user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You do not have permission to update this contract.' });
    }

    // For end_date updates, verify user is either landlord or tenant
    if (isUpdatingEndDateOnly && !isLandlord && !isTenant && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You are not authorized to update this contract.' });
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

// Save proposed end date
const saveProposedEndDate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { proposed_end_date } = req.body;

    if (!proposed_end_date) {
      return res.status(400).json({ error: 'Proposed end date is required.' });
    }

    // Get contract to verify authorization
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
      return res.status(403).json({ error: 'You are not authorized to propose an end date for this contract.' });
    }

    // Validate end date is after start date
    if (new Date(proposed_end_date) < new Date(contract.start_date)) {
      return res.status(400).json({ error: 'End date must be after start date.' });
    }

    // Insert or update proposed end date
    await pool.execute(
      `INSERT INTO contract_proposed_end_dates (contract_id, user_id, proposed_end_date, updated_at)
       VALUES (?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE proposed_end_date = ?, updated_at = NOW()`,
      [id, req.user.id, proposed_end_date, proposed_end_date]
    );

    res.json({ message: 'Proposed end date saved successfully', proposed_end_date });
  } catch (error) {
    // If table doesn't exist, create it
    if (error.code === 'ER_NO_SUCH_TABLE') {
      try {
        await pool.execute(`
          CREATE TABLE IF NOT EXISTS contract_proposed_end_dates (
            contract_id BIGINT UNSIGNED NOT NULL,
            user_id BIGINT UNSIGNED NOT NULL,
            proposed_end_date DATE NOT NULL,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (contract_id, user_id),
            CONSTRAINT fk_cped_contract FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE,
            CONSTRAINT fk_cped_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
          ) ENGINE=InnoDB
        `);
        
        // Retry the insert
        await pool.execute(
          `INSERT INTO contract_proposed_end_dates (contract_id, user_id, proposed_end_date, updated_at)
           VALUES (?, ?, ?, NOW())
           ON DUPLICATE KEY UPDATE proposed_end_date = ?, updated_at = NOW()`,
          [id, req.user.id, proposed_end_date, proposed_end_date]
        );
        
        res.json({ message: 'Proposed end date saved successfully', proposed_end_date });
      } catch (createError) {
        next(createError);
      }
    } else {
      next(error);
    }
  }
};

module.exports = {
  getContracts,
  getContractById,
  createContract,
  updateContract,
  signContract,
  saveProposedEndDate,
  createContractValidation
};




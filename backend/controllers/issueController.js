const pool = require('../config/database');
const { body, validationResult } = require('express-validator');

// Get all issue reports
const getIssues = async (req, res, next) => {
  try {
    const { contract_id, status, category, severity, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT ir.*,
             u_reporter.full_name as reporter_name,
             u_assignee.full_name as assignee_name,
             c.id as contract_id
      FROM issue_reports ir
      LEFT JOIN users u_reporter ON ir.reporter_user_id = u_reporter.id
      LEFT JOIN users u_assignee ON ir.assignee_user_id = u_assignee.id
      LEFT JOIN contracts c ON ir.contract_id = c.id
      WHERE 1=1
    `;
    const params = [];

    // Filter by user role
    if (req.user.role === 'tenant') {
      query += ' AND (ir.reporter_user_id = ? OR EXISTS (SELECT 1 FROM contract_tenants ct WHERE ct.contract_id = ir.contract_id AND ct.tenant_user_id = ?))';
      params.push(req.user.id, req.user.id);
    } else if (req.user.role === 'landlord') {
      query += ' AND EXISTS (SELECT 1 FROM contracts c WHERE c.id = ir.contract_id AND c.landlord_user_id = ?)';
      params.push(req.user.id);
    }

    if (contract_id) {
      query += ' AND ir.contract_id = ?';
      params.push(contract_id);
    }

    if (status) {
      query += ' AND ir.status = ?';
      params.push(status);
    }

    if (category) {
      query += ' AND ir.category = ?';
      params.push(category);
    }

    if (severity) {
      query += ' AND ir.severity = ?';
      params.push(severity);
    }

    query += ' ORDER BY ir.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [issues] = await pool.execute(query, params);

    res.json({ issues });
  } catch (error) {
    next(error);
  }
};

// Get issue by ID
const getIssueById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [issues] = await pool.execute(
      `SELECT ir.*,
              u_reporter.full_name as reporter_name,
              u_reporter.email as reporter_email,
              u_assignee.full_name as assignee_name,
              u_assignee.email as assignee_email
       FROM issue_reports ir
       LEFT JOIN users u_reporter ON ir.reporter_user_id = u_reporter.id
       LEFT JOIN users u_assignee ON ir.assignee_user_id = u_assignee.id
       WHERE ir.id = ?`,
      [id]
    );

    if (issues.length === 0) {
      return res.status(404).json({ error: 'Issue not found.' });
    }

    const issue = issues[0];

    // Get attachments
    const [attachments] = await pool.execute(
      `SELECT ia.*, u.full_name as uploaded_by_name
       FROM issue_attachments ia
       LEFT JOIN users u ON ia.uploaded_by = u.id
       WHERE ia.issue_id = ?`,
      [id]
    );
    issue.attachments = attachments;

    // Get status history
    const [history] = await pool.execute(
      `SELECT ish.*, u.full_name as changed_by_name
       FROM issue_status_history ish
       LEFT JOIN users u ON ish.changed_by = u.id
       WHERE ish.issue_id = ?
       ORDER BY ish.changed_at`,
      [id]
    );
    issue.status_history = history;

    res.json({ issue });
  } catch (error) {
    next(error);
  }
};

// Create issue report
const createIssue = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { contract_id, category, severity, description, sla_hours } = req.body;
    const reporter_user_id = req.user.id;

    // Verify contract access
    const [contracts] = await pool.execute(
      `SELECT c.id, c.landlord_user_id,
              EXISTS(SELECT 1 FROM contract_tenants ct WHERE ct.contract_id = c.id AND ct.tenant_user_id = ?) as is_tenant
       FROM contracts c
       WHERE c.id = ?`,
      [reporter_user_id, contract_id]
    );

    if (contracts.length === 0) {
      return res.status(404).json({ error: 'Contract not found.' });
    }

    const contract = contracts[0];
    if (contract.landlord_user_id !== reporter_user_id && contract.is_tenant !== 1 && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You do not have access to this contract.' });
    }

    const [result] = await pool.execute(
      'INSERT INTO issue_reports (contract_id, reporter_user_id, category, severity, description, sla_hours, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [contract_id, reporter_user_id, category, severity || 'medium', description, sla_hours || 24, 'open']
    );

    // Create initial status history
    await pool.execute(
      'INSERT INTO issue_status_history (issue_id, from_status, to_status, changed_by, changed_at) VALUES (?, ?, ?, ?, NOW())',
      [result.insertId, 'open', 'open', reporter_user_id]
    );

    const [issues] = await pool.execute(
      'SELECT * FROM issue_reports WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({ message: 'Issue report created successfully', issue: issues[0] });
  } catch (error) {
    next(error);
  }
};

// Update issue status
const updateIssueStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, assignee_user_id } = req.body;

    // Get current issue
    const [issues] = await pool.execute(
      'SELECT status, assignee_user_id FROM issue_reports WHERE id = ?',
      [id]
    );

    if (issues.length === 0) {
      return res.status(404).json({ error: 'Issue not found.' });
    }

    const currentIssue = issues[0];
    const oldStatus = currentIssue.status;

    // Only admin can change status to triaged/in_progress/resolved/rejected
    if (['triaged', 'in_progress', 'resolved', 'rejected'].includes(status) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can update issue status to this value.' });
    }

    // Build update query
    const updates = [];
    const params = [];

    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }

    if (assignee_user_id !== undefined) {
      updates.push('assignee_user_id = ?');
      params.push(assignee_user_id);
    }

    if (status === 'resolved') {
      updates.push('resolved_at = NOW()');
    }

    if (updates.length > 0) {
      params.push(id);
      await pool.execute(
        `UPDATE issue_reports SET ${updates.join(', ')} WHERE id = ?`,
        params
      );

      // Record status change
      if (status && status !== oldStatus) {
        await pool.execute(
          'INSERT INTO issue_status_history (issue_id, from_status, to_status, changed_by, changed_at) VALUES (?, ?, ?, ?, NOW())',
          [id, oldStatus, status, req.user.id]
        );
      }
    }

    const [updated] = await pool.execute(
      'SELECT * FROM issue_reports WHERE id = ?',
      [id]
    );

    res.json({ message: 'Issue updated successfully', issue: updated[0] });
  } catch (error) {
    next(error);
  }
};

// Add attachment to issue
const addAttachment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { file_url } = req.body;

    if (!file_url) {
      return res.status(400).json({ error: 'File URL is required.' });
    }

    // Verify issue access
    const [issues] = await pool.execute(
      'SELECT reporter_user_id FROM issue_reports WHERE id = ?',
      [id]
    );

    if (issues.length === 0) {
      return res.status(404).json({ error: 'Issue not found.' });
    }

    const [result] = await pool.execute(
      'INSERT INTO issue_attachments (issue_id, uploaded_by, file_url) VALUES (?, ?, ?)',
      [id, req.user.id, file_url]
    );

    const [attachments] = await pool.execute(
      'SELECT * FROM issue_attachments WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({ message: 'Attachment added successfully', attachment: attachments[0] });
  } catch (error) {
    next(error);
  }
};

// Validation rules
const createIssueValidation = [
  body('contract_id').isInt().withMessage('Contract ID is required'),
  body('category').isIn(['maintenance', 'scam', 'safety', 'noise', 'hygiene', 'contract_dispute', 'other']).withMessage('Invalid category'),
  body('severity').optional().isIn(['low', 'medium', 'high', 'critical']),
  body('description').trim().isLength({ min: 1 }).withMessage('Description is required'),
  body('sla_hours').optional().isInt({ min: 1 })
];

module.exports = {
  getIssues,
  getIssueById,
  createIssue,
  updateIssueStatus,
  addAttachment,
  createIssueValidation
};




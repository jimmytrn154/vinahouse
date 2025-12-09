const express = require('express');
const router = express.Router();
const issueController = require('../controllers/issueController');
const { authenticate } = require('../middleware/auth');

// Get all issues
router.get('/', authenticate, issueController.getIssues);

// Get issue by ID
router.get('/:id', authenticate, issueController.getIssueById);

// Create issue
router.post('/', authenticate, issueController.createIssueValidation, issueController.createIssue);

// Update issue status
router.put('/:id/status', authenticate, issueController.updateIssueStatus);

// Add attachment
router.post('/:id/attachments', authenticate, issueController.addAttachment);

module.exports = router;



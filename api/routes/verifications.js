const express = require('express');
const router = express.Router();
const verificationController = require('../controllers/verificationController');
const { authenticate, authorize } = require('../middleware/auth');

// Get all verifications
router.get('/', authenticate, verificationController.getVerifications);

// Get verification by ID
router.get('/:id', authenticate, verificationController.getVerificationById);

// Create verification (admin only)
router.post('/', authenticate, authorize('admin'), verificationController.createVerificationValidation, verificationController.createVerification);

// Update verification (admin only)
router.put('/:id', authenticate, authorize('admin'), verificationController.updateVerification);

module.exports = router;



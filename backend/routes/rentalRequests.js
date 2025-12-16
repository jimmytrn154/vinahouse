const express = require('express');
const router = express.Router();
const rentalRequestController = require('../controllers/rentalRequestController');
const { authenticate } = require('../middleware/auth');

// Get all rental requests
router.get('/', authenticate, rentalRequestController.getRentalRequests);

// Get rental request by ID
router.get('/:id', authenticate, rentalRequestController.getRentalRequestById);

// Create rental request (tenant only)
router.post('/', authenticate, rentalRequestController.createRentalRequestValidation, rentalRequestController.createRentalRequest);

// Update rental request status
router.put('/:id/status', authenticate, rentalRequestController.updateRentalRequestStatus);

module.exports = router;




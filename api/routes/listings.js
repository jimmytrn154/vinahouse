const express = require('express');
const router = express.Router();
const listingController = require('../controllers/listingController');
const { authenticate, authorize } = require('../middleware/auth');

// Get all listings
router.get('/', listingController.getListings);

// Get listing by ID
router.get('/:id', listingController.getListingById);

// Create listing (landlord/admin only)
router.post('/', authenticate, authorize('landlord', 'admin'), listingController.createListingValidation, listingController.createListing);

// Update listing
router.put('/:id', authenticate, listingController.updateListing);

// Delete listing
router.delete('/:id', authenticate, listingController.deleteListing);

module.exports = router;



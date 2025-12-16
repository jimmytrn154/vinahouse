const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/propertyController');
const { authenticate, authorize } = require('../middleware/auth');

// Get all properties
router.get('/', propertyController.getProperties);

// Get property by ID
router.get('/:id', propertyController.getPropertyById);

// Create property (landlord/admin only)
router.post('/', authenticate, authorize('landlord', 'admin'), propertyController.createPropertyValidation, propertyController.createProperty);

// Update property
router.put('/:id', authenticate, propertyController.updateProperty);

// Delete property
router.delete('/:id', authenticate, propertyController.deleteProperty);

// House rules
router.put('/:id/rules', authenticate, propertyController.updateHouseRules);

// Rooms
router.post('/:id/rooms', authenticate, propertyController.createRoomValidation, propertyController.createRoom);

module.exports = router;




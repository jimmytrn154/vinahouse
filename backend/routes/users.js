const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

// Get all users (admin only)
router.get('/', authenticate, authorize('admin'), userController.getUsers);

// Get user by ID
router.get('/:id', authenticate, userController.getUserById);

// Update own profile
router.put('/profile', authenticate, userController.updateProfileValidation, userController.updateProfile);

// Update user status (admin only)
router.put('/:id/status', authenticate, authorize('admin'), userController.updateUserStatus);

// User preferences
router.get('/preferences/me', authenticate, userController.getUserPreferences);
router.put('/preferences/me', authenticate, userController.updateUserPreferences);

module.exports = router;




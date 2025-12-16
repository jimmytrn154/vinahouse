const express = require('express');
const router = express.Router();
const organizationController = require('../controllers/organizationController');
const { authenticate, authorize } = require('../middleware/auth');

// Get all organizations
router.get('/', organizationController.getOrganizations);

// Get organization by ID
router.get('/:id', organizationController.getOrganizationById);

// Create organization (admin only)
router.post('/', authenticate, authorize('admin'), organizationController.createOrganizationValidation, organizationController.createOrganization);

// Create affiliation
router.post('/affiliations', authenticate, organizationController.createAffiliationValidation, organizationController.createAffiliation);

// Update affiliation status (admin only)
router.put('/affiliations/:user_id/:org_id', authenticate, authorize('admin'), organizationController.updateAffiliationStatus);

module.exports = router;




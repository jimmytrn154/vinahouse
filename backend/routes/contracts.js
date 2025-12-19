const express = require('express');
const router = express.Router();
const contractController = require('../controllers/contractController');
const { authenticate } = require('../middleware/auth');

// Get all contracts
router.get('/', authenticate, contractController.getContracts);

// Get contract by ID
router.get('/:id', authenticate, contractController.getContractById);

// Create contract (landlord/admin only)
router.post('/', authenticate, contractController.createContractValidation, contractController.createContract);

// Update contract
router.put('/:id', authenticate, contractController.updateContract);

// Sign contract
router.post('/:id/sign', authenticate, contractController.signContract);

// Save proposed end date
router.post('/:id/proposed-end-date', authenticate, contractController.saveProposedEndDate);

module.exports = router;




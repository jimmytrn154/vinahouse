const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticate } = require('../middleware/auth');

// Get all reviews
router.get('/', reviewController.getReviews);

// Get average rating
router.get('/stats', reviewController.getAverageRating);

// Get review by ID
router.get('/:id', reviewController.getReviewById);

// Create review (authenticated users)
router.post('/', authenticate, reviewController.createReviewValidation, reviewController.createReview);

module.exports = router;




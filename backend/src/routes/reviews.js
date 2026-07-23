const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authRequired } = require('../middleware/authMiddleware');

router.get('/', reviewController.listReviews);
router.post('/', authRequired, reviewController.createReview);
router.post('/:id/reply', authRequired, reviewController.replyToReview);
router.delete('/:id', authRequired, reviewController.deleteReview);

module.exports = router;


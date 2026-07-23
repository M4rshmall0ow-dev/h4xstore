const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authRequired } = require('../middleware/authMiddleware');

router.get('/', authRequired, analyticsController.getAnalytics);
router.get('/overview', authRequired, analyticsController.getAnalytics);

module.exports = router;


const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authRequired } = require('../middleware/authMiddleware');

router.post('/', orderController.createOrder);
router.get('/', authRequired, orderController.listOrders);
router.get('/:id', authRequired, orderController.getOrder);

module.exports = router;


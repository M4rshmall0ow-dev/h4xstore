const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');
const { authRequired } = require('../middleware/authMiddleware');

router.use(authRequired);
router.get('/', couponController.listCoupons);
router.post('/', couponController.createCoupon);
router.put('/:id', couponController.updateCoupon);
router.delete('/:id', couponController.deleteCoupon);

module.exports = router;

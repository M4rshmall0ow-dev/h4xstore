const express = require('express');
const router = express.Router();
const affiliateController = require('../controllers/affiliateController');
const { authRequired } = require('../middleware/authMiddleware');

router.post('/click', affiliateController.recordClick);
router.use(authRequired);
router.get('/me', affiliateController.getAffiliateForUser);
router.post('/join', affiliateController.joinAffiliate);
router.get('/withdrawals', affiliateController.listWithdrawals);
router.post('/withdrawals', affiliateController.requestWithdrawal);
router.get('/stats', affiliateController.getAffiliateStats);
router.get('/', affiliateController.listAffiliates);
router.post('/:id/payouts', affiliateController.createAffiliatePayout);
router.patch('/:id', affiliateController.patchAffiliate);
router.delete('/:id', affiliateController.deleteAffiliate);

module.exports = router;


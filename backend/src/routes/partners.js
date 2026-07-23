const express = require('express');
const router = express.Router();
const partnerController = require('../controllers/partnerController');
const { authRequired, requirePermission } = require('../middleware/authMiddleware');

router.get('/', partnerController.listPartners);
router.post('/', authRequired, requirePermission('partners.edit'), partnerController.createPartner);
router.patch('/:id', authRequired, requirePermission('partners.edit'), partnerController.updatePartner);
router.delete('/:id', authRequired, requirePermission('partners.edit'), partnerController.deletePartner);

module.exports = router;


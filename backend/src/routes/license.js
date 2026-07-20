const express = require('express');
const router = express.Router();
const licenseController = require('../controllers/licenseController');

router.post('/import', licenseController.importKeys);
router.get('/', licenseController.listKeys);
router.post('/:id/revoke', licenseController.revokeKey);

module.exports = router;

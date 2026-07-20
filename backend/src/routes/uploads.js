const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');

router.post('/presign', uploadController.createPresignedUpload);

module.exports = router;
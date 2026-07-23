const express = require('express');
const router = express.Router();
const { authRequired } = require('../middleware/authMiddleware');
const komerzaController = require('../controllers/komerzaController');

router.use(authRequired);
router.all('/*', komerzaController.proxyRequest);

module.exports = router;


const express = require('express');
const router = express.Router();
const mediaController = require('../controllers/mediaController');
const { authRequired } = require('../middleware/authMiddleware');

router.use(authRequired);
router.get('/', mediaController.listMedia);
router.post('/', mediaController.createMedia);
router.delete('/:id', mediaController.deleteMedia);

module.exports = router;

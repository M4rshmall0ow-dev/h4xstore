const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcementController');
const { authRequired } = require('../middleware/authMiddleware');

router.use(authRequired);
router.get('/', announcementController.listAnnouncements);
router.post('/', announcementController.createAnnouncement);
router.delete('/:id', announcementController.deleteAnnouncement);

module.exports = router;

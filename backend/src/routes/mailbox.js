const express = require('express');
const router = express.Router();
const mailboxController = require('../controllers/mailboxController');
const { authRequired } = require('../middleware/authMiddleware');

router.use(authRequired);
router.get('/', mailboxController.listMailbox);
router.patch('/:id/read', mailboxController.markMessageRead);
router.delete('/:id', mailboxController.deleteMessage);
router.post('/send', mailboxController.sendMail);
router.post('/presign-attachment', mailboxController.presignAttachment);

module.exports = router;

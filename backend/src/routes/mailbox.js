const express = require('express');
const router = express.Router();
const mailboxController = require('../controllers/mailboxController');

router.get('/', mailboxController.listMailbox);
router.post('/send', mailboxController.sendMail);
router.post('/presign-attachment', mailboxController.presignAttachment);

module.exports = router;
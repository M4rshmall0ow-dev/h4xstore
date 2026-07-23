const express = require('express');
const router = express.Router();
const auth = require('../controllers/authController');
const { authRequired } = require('../middleware/authMiddleware');

router.post('/register', auth.register);
router.post('/login', auth.login);
router.post('/logout', auth.logout);
router.post('/refresh', auth.refresh);
router.post('/forgot-password', auth.forgotPassword);
router.post('/reset-password', auth.resetPassword);
router.post('/oauth/discord', auth.discordOAuth);
router.post('/change-password', authRequired, auth.changePassword);
router.get('/me', authRequired, auth.me);

module.exports = router;


const express = require('express');
const router = express.Router();
const controller = require('../controllers/userController');
const { authRequired, requirePermission } = require('../middleware/authMiddleware');

router.use(authRequired);

// list & search
router.get('/', requirePermission('users.view'), controller.listUsers);
router.get('/:id', requirePermission('users.view'), controller.getUser);
router.patch('/:id', requirePermission('users.edit'), controller.patchUser);
router.delete('/:id', requirePermission('users.delete'), controller.deleteUser);

router.post('/:id/suspend', requirePermission('users.suspend'), controller.suspendUser);
router.post('/:id/terminate', requirePermission('users.terminate'), controller.terminateUser);
router.post('/:id/force-logout', requirePermission('users.forceLogout'), controller.forceLogout);
router.post('/:id/reset-password', requirePermission('users.resetPassword'), controller.resetUserPasswordAdmin);

module.exports = router;

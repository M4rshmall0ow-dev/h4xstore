const express = require('express');
const router = express.Router();
const controller = require('../controllers/permissionController');
const { authRequired, requirePermission } = require('../middleware/authMiddleware');

router.use(authRequired);

router.get('/', requirePermission('permissions.view'), controller.listPermissions);
router.post('/', requirePermission('permissions.create'), controller.createPermission);
router.get('/:id', requirePermission('permissions.view'), controller.getPermission);
router.put('/:id', requirePermission('permissions.edit'), controller.updatePermission);
router.delete('/:id', requirePermission('permissions.delete'), controller.deletePermission);

module.exports = router;
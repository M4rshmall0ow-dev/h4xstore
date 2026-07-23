const express = require('express');
const router = express.Router();
const controller = require('../controllers/roleController');
const { authRequired, requirePermission } = require('../middleware/authMiddleware');

router.use(authRequired);

router.get('/', requirePermission('roles.view'), controller.listRoles);
router.post('/', requirePermission('roles.create'), controller.createRole);
router.get('/:id', requirePermission('roles.view'), controller.getRole);
router.put('/:id', requirePermission('roles.edit'), controller.updateRole);
router.delete('/:id', requirePermission('roles.delete'), controller.deleteRole);
router.post('/:id/permissions', requirePermission('roles.edit'), controller.assignPermissions);

module.exports = router;

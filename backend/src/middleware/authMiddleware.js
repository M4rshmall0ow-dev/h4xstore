const { verifyAccessToken } = require('../auth/jwt');
const prisma = require('../database/prismaClient');

async function authRequired(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ success: false, error: 'Missing authorization header' });

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ success: false, error: 'Invalid authorization format' });

    const token = parts[1];
    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch (err) {
      return res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }

    // load user and roles
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: { roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } }
    });

    if (!user) return res.status(401).json({ success: false, error: 'User not found' });
    if (user.isSuspended) return res.status(403).json({ success: false, error: 'User suspended' });

    // convert role & permissions into usable lists
    const roles = user.roles.map((ur) => ur.role.name);
    const permissions = [];
    user.roles.forEach((ur) => {
      ur.role.permissions.forEach((rp) => {
        if (rp.permission && !permissions.includes(rp.permission.name)) {
          permissions.push(rp.permission.name);
        }
      });
    });

    req.user = { id: user.id, email: user.email, roles, permissions };
    next();
  } catch (err) {
    next(err);
  }
}

function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, error: 'Authentication required' });
    if (req.user.permissions.includes(permission) || req.user.roles.includes('Admin')) return next();
    return res.status(403).json({ success: false, error: 'Insufficient permissions' });
  };
}

module.exports = { authRequired, requirePermission };


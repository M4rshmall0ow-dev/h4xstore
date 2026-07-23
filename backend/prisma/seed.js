const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding roles and permissions...');

  const permissions = [
    'users.view','users.edit','users.delete','users.suspend','users.terminate','users.forceLogout','users.resetPassword',
    'products.view','products.create','products.edit','products.delete',
    'roles.view','roles.create','roles.edit','roles.delete','permissions.view','permissions.create','permissions.edit','permissions.delete'
  ];

  for (const p of permissions) {
    await prisma.permission.upsert({ where: { name: p }, update: {}, create: { name: p } });
  }

  const roles = [
    { name: 'Admin', permissions: permissions },
    { name: 'Staff', permissions: ['users.view','products.view','products.edit'] },
    { name: 'User', permissions: [] },
    { name: 'External', permissions: [] }
  ];

  for (const r of roles) {
    const role = await prisma.role.upsert({ where: { name: r.name }, update: {}, create: { name: r.name } });
    for (const p of r.permissions) {
      const perm = await prisma.permission.findUnique({ where: { name: p } });
      if (perm) {
        await prisma.rolePermission.upsert({ where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } }, update: {}, create: { roleId: role.id, permissionId: perm.id } });
      }
    }
  }

  console.log('Seeding complete');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });


require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  try {
    const cols = await prisma.$queryRaw`select table_name,column_name,data_type from information_schema.columns where table_schema='public' and table_name in ('Product','ProductVariant','Inventory') order by table_name,ordinal_position`;
    console.log(JSON.stringify(cols, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
})();

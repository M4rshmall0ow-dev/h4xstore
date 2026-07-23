const { v4: uuidv4 } = require('uuid');

async function createProduct(data, prismaClient) {
  // create product and return
  const created = await prismaClient.product.create({ data });
  return created;
}

async function listProducts({ page = 1, perPage = 25, q, categories, visible }, prismaClient) {
  const skip = (page - 1) * perPage;
  const take = perPage;

  const where = {};
  if (typeof visible !== 'undefined') {
    where.visible = visible;
  } else {
    where.visible = true;
  }

  if (categories && categories.length > 0) {
    where.categories = { hasSome: categories };
  }

  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { sku: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } }
    ];
  }

  const [items, total] = await Promise.all([
    prismaClient.product.findMany({ where, skip, take }),
    prismaClient.product.count ? prismaClient.product.count({ where }) : (async () => {
      const all = await prismaClient.product.findMany({ where });
      return all.length;
    })()
  ]);

  return { total, items };
}

async function getProductById(id, prismaClient) {
  const product = await prismaClient.product.findUnique({ where: { id }, include: { variants: true, inventory: true } });
  return product;
}

async function updateProduct(id, data, prismaClient) {
  const updated = await prismaClient.product.update({ where: { id }, data });
  return updated;
}

async function deleteProduct(id, prismaClient) {
  // soft delete: set visible = false if field exists
  try {
    const updated = await prismaClient.product.update({ where: { id }, data: { visible: false } });
    return updated;
  } catch (err) {
    // fallback: delete
    if (prismaClient.product.delete) {
      return await prismaClient.product.delete({ where: { id } });
    }
    throw err;
  }
}

// Variants
async function createVariant(productId, data, prismaClient) {
  // use transaction if available
  if (prismaClient.$transaction) {
    return await prismaClient.$transaction(async (tx) => {
      const created = await tx.productVariant.create({ data: { ...data, productId } });
      return created;
    });
  }
  const created = await prismaClient.productVariant.create({ data: { ...data, productId } });
  return created;
}

async function updateVariant(variantId, data, prismaClient) {
  const updated = await prismaClient.productVariant.update({ where: { id: variantId }, data });
  return updated;
}

async function deleteVariant(variantId, prismaClient) {
  // remove variant
  if (prismaClient.productVariant.delete) {
    return await prismaClient.productVariant.delete({ where: { id: variantId } });
  }
  // otherwise soft delete: set _deleted flag if present
  return await prismaClient.productVariant.update({ where: { id: variantId }, data: { deleted: true } });
}

module.exports = {
  createProduct,
  listProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  createVariant,
  updateVariant,
  deleteVariant
};

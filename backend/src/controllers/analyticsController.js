const prisma = require('../database/prismaClient');

async function getAnalytics(req, res, next) {
  try {
    const paidOrders = await prisma.order.findMany({ where: { status: 'paid' }, include: { items: true } });
    const totalRevenue = paidOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const totalOrders = paidOrders.length;
    const totalProducts = await prisma.product.count();
    const totalReviews = await prisma.review.count();
    const totalCustomers = await prisma.user.count();
    const suspendedUsers = await prisma.user.count({ where: { isSuspended: true } });
    const totalAffiliates = await prisma.affiliate.count();
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const uniqueCustomerIds = paidOrders.filter(o => o.userId).reduce((acc, order) => {
      acc.add(order.userId);
      return acc;
    }, new Set());
    const customerOrderCounts = paidOrders.filter(o => o.userId).reduce((acc, order) => {
      acc[order.userId] = (acc[order.userId] || 0) + 1;
      return acc;
    }, {});
    const returningCustomers = Object.values(customerOrderCounts).filter(count => count > 1).length;
    const conversionRate = totalCustomers > 0 ? (totalOrders / totalCustomers) * 100 : 0;

    const topProducts = await prisma.product.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, price: true }
    });

    const monthlyRevenue = paidOrders.reduce((acc, order) => {
      const month = new Date(order.createdAt).toISOString().slice(0, 7);
      acc[month] = (acc[month] || 0) + Number(order.total || 0);
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        summary: {
          totalRevenue,
          totalOrders,
          totalProducts,
          totalReviews,
          totalCustomers,
          suspendedUsers,
          totalAffiliates,
          returningCustomers,
          conversionRate,
          averageOrderValue
        },
        monthlyRevenue,
        topProducts
      }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAnalytics };


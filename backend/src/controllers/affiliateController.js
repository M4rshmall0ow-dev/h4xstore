const prisma = require('../database/prismaClient');

function formatAffiliate(affiliate) {
  const meta = affiliate.meta || {};
  const totalCommission = affiliate.sales.reduce((sum, sale) => sum + Number(sale.commission || 0), 0);
  const completedPayouts = affiliate.withdrawals.filter(w => w.status === 'completed');
  const paidCommission = completedPayouts.reduce((sum, payout) => sum + Number(payout.amount || 0), 0);
  const balance = Math.max(0, totalCommission - paidCommission);
  const clicks = affiliate.clicks.length;
  const sales = affiliate.sales.length;

  return {
    id: affiliate.id,
    customerId: affiliate.id,
    emailAddress: affiliate.user?.email || null,
    username: affiliate.user?.username || null,
    link: meta.link || `https://h4xstore.mykomerza.com?ref=${affiliate.code}`,
    returnPercentage: typeof meta.returnPercentage !== 'undefined' ? meta.returnPercentage : 15,
    percentageOff: typeof meta.percentageOff !== 'undefined' ? meta.percentageOff : 0,
    balance,
    isEnabled: typeof meta.isEnabled !== 'undefined' ? meta.isEnabled : true,
    createdAt: affiliate.createdAt,
    clicks,
    sales,
    totalCommission,
    pendingWithdrawals: affiliate.withdrawals.filter(w => w.status === 'pending').length
  };
}

async function getAffiliateForUser(req, res, next) {
  try {
    const affiliate = await prisma.affiliate.findFirst({
      where: { userId: req.user.id },
      include: {
        clicks: true,
        sales: { include: { order: true } },
        withdrawals: true,
        user: true
      }
    });

    if (!affiliate) {
      return res.json({ success: true, data: { affiliate: null } });
    }

    const totalClicks = affiliate.clicks.length;
    const saleEntries = affiliate.sales.map(sale => ({
      id: sale.id,
      orderId: sale.orderId,
      commission: Number(sale.commission || 0),
      amount: sale.order ? Number(sale.order.total || 0) : 0,
      currency: sale.order ? sale.order.currency : 'USD',
      status: sale.order ? sale.order.status : 'unknown',
      createdAt: sale.createdAt
    }));
    const totalSales = saleEntries.length;
    const totalCommission = saleEntries.reduce((sum, sale) => sum + sale.commission, 0);
    const pendingWithdrawals = affiliate.withdrawals.filter(w => w.status === 'pending');
    const conversionRate = totalClicks > 0 ? (totalSales / totalClicks) * 100 : 0;

    res.json({
      success: true,
      data: {
        affiliate: {
          id: affiliate.id,
          code: affiliate.code,
          clicks: totalClicks,
          sales: totalSales,
          salesList: saleEntries,
          commission: totalCommission,
          conversionRate,
          withdrawals: affiliate.withdrawals,
          pendingWithdrawals: pendingWithdrawals.length
        }
      }
    });
  } catch (err) {
    next(err);
  }
}

async function joinAffiliate(req, res, next) {
  try {
    const userId = req.user.id;
    const { email } = req.body;
    const code = req.user.username || `aff_${Date.now().toString(36)}`;

    const existing = await prisma.affiliate.findFirst({ where: { userId } });
    if (existing) {
      return res.json({ success: true, data: { affiliate: existing } });
    }

    const uniqueCode = code.toLowerCase().replace(/[^a-z0-9_-]+/g, '').slice(0, 72) || `aff_${Date.now().toString(36)}`;
    const affiliate = await prisma.affiliate.create({ data: { userId, code: uniqueCode } });

    await prisma.user.update({ where: { id: userId }, data: { email: email || req.user.email } });

    res.status(201).json({ success: true, data: { affiliate } });
  } catch (err) {
    next(err);
  }
}

async function recordClick(req, res, next) {
  try {
    const { ref } = req.body;
    if (!ref) return res.status(400).json({ success: false, error: 'Affiliate ref required' });

    const affiliate = await prisma.affiliate.findUnique({ where: { code: ref } });
    if (!affiliate) return res.status(404).json({ success: false, error: 'Affiliate not found' });

    await prisma.affiliateClick.create({ data: { affiliateId: affiliate.id, ip: req.ip, userAgent: req.headers['user-agent'] || null } });
    res.json({ success: true, data: { message: 'Click recorded' } });
  } catch (err) {
    next(err);
  }
}

async function requestWithdrawal(req, res, next) {
  try {
    const userId = req.user.id;
    const { amount, currency, address, reason } = req.body;
    if (!amount || Number(amount) < 10) {
      return res.status(400).json({ success: false, error: 'Withdrawal amount must be at least 10' });
    }

    const affiliate = await prisma.affiliate.findFirst({ where: { userId } });
    if (!affiliate) return res.status(404).json({ success: false, error: 'Affiliate account not found' });

    const withdrawal = await prisma.affiliateWithdrawal.create({
      data: {
        affiliateId: affiliate.id,
        amount: Number(amount),
        currency: currency || 'USD',
        address: address || null,
        reason: reason || null,
        status: 'pending'
      }
    });

    res.status(201).json({ success: true, data: { withdrawal } });
  } catch (err) {
    next(err);
  }
}

async function listAffiliates(req, res, next) {
  try {
    const affiliates = await prisma.affiliate.findMany({
      include: {
        user: true,
        clicks: true,
        sales: { include: { order: true } },
        withdrawals: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const output = affiliates.map(formatAffiliate);
    res.json({ success: true, data: { affiliates: output } });
  } catch (err) {
    next(err);
  }
}

async function getAffiliateStats(req, res, next) {
  try {
    const affiliates = await prisma.affiliate.findMany({
      include: {
        sales: { include: { order: true } },
        withdrawals: true
      }
    });

    const totalAffiliates = affiliates.length;
    const referralRevenue = affiliates.reduce((sum, aff) => {
      return sum + aff.sales.reduce((sub, sale) => sub + Number(sale.order?.total || 0), 0);
    }, 0);
    const commissionsPaid = affiliates.reduce((sum, aff) => {
      return sum + aff.withdrawals.filter(w => w.status === 'completed').reduce((sub, payout) => sub + Number(payout.amount || 0), 0);
    }, 0);
    const topEarnerAmount = affiliates.reduce((max, aff) => {
      const total = aff.sales.reduce((sub, sale) => sub + Number(sale.commission || 0), 0);
      return Math.max(max, total);
    }, 0);

    res.json({ success: true, data: { totalAffiliates, referralRevenue, commissionsPaid, topEarnerAmount } });
  } catch (err) {
    next(err);
  }
}

async function listWithdrawals(req, res, next) {
  try {
    const withdrawals = await prisma.affiliateWithdrawal.findMany({
      include: {
        affiliate: {
          include: { user: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const output = withdrawals.map(w => ({
      id: w.id,
      customerId: w.affiliateId,
      email: w.affiliate?.user?.email || null,
      username: w.affiliate?.user?.username || null,
      amount: Number(w.amount || 0),
      currency: w.currency || 'USD',
      address: w.address || '',
      reason: w.reason || null,
      status: w.status,
      dateRequested: w.createdAt,
      dateCompleted: w.completedAt || null
    }));

    res.json({ success: true, data: { withdrawals: output } });
  } catch (err) {
    next(err);
  }
}

async function createAffiliatePayout(req, res, next) {
  try {
    const affiliateId = req.params.id;
    const { amount, currency, address, comment } = req.body;
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, error: 'Amount is required for payout' });
    }

    const affiliate = await prisma.affiliate.findUnique({ where: { id: affiliateId } });
    if (!affiliate) return res.status(404).json({ success: false, error: 'Affiliate not found' });

    const payout = await prisma.affiliateWithdrawal.create({
      data: {
        affiliateId: affiliate.id,
        amount: Number(amount),
        currency: currency || 'USD',
        address: address || null,
        reason: comment || null,
        status: 'completed',
        completedAt: new Date()
      }
    });

    res.json({ success: true, data: { payout } });
  } catch (err) {
    next(err);
  }
}

async function patchAffiliate(req, res, next) {
  try {
    const affiliateId = req.params.id;
    const { link, returnPercentage, percentageOff, isEnabled, emailAddress } = req.body;

    const affiliate = await prisma.affiliate.findUnique({ where: { id: affiliateId }, include: { user: true } });
    if (!affiliate) return res.status(404).json({ success: false, error: 'Affiliate not found' });

    const meta = affiliate.meta || {};
    if (typeof link !== 'undefined') meta.link = link;
    if (typeof returnPercentage !== 'undefined') meta.returnPercentage = Number(returnPercentage);
    if (typeof percentageOff !== 'undefined') meta.percentageOff = Number(percentageOff);
    if (typeof isEnabled !== 'undefined') meta.isEnabled = Boolean(isEnabled);

    const updated = await prisma.affiliate.update({
      where: { id: affiliateId },
      data: {
        meta,
        ...(emailAddress && affiliate.userId ? { user: { update: { email: emailAddress } } } : {})
      },
      include: { user: true, clicks: true, sales: true, withdrawals: true }
    });

    res.json({ success: true, data: { affiliate: formatAffiliate(updated) } });
  } catch (err) {
    next(err);
  }
}

async function deleteAffiliate(req, res, next) {
  try {
    const affiliateId = req.params.id;
    await prisma.affiliateWithdrawal.deleteMany({ where: { affiliateId } });
    await prisma.affiliateSale.deleteMany({ where: { affiliateId } });
    await prisma.affiliateClick.deleteMany({ where: { affiliateId } });
    await prisma.affiliate.delete({ where: { id: affiliateId } });
    res.json({ success: true, data: { message: 'Affiliate removed' } });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAffiliateForUser,
  joinAffiliate,
  recordClick,
  requestWithdrawal,
  listAffiliates,
  getAffiliateStats,
  listWithdrawals,
  createAffiliatePayout,
  patchAffiliate,
  deleteAffiliate
};


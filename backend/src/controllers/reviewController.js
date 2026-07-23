const prisma = require('../database/prismaClient');

function sanitizeReview(review) {
  return {
    id: review.id,
    userId: review.userId,
    username: review.user?.username || 'Anonymous',
    productId: review.productId,
    productName: review.product?.name || null,
    rating: review.rating,
    title: review.title,
    body: review.body,
    verified: review.verified,
    createdAt: review.createdAt,
    replies: (review.replies || []).map(reply => ({ id: reply.id, body: reply.body, userId: reply.userId, username: reply.user?.username || 'Admin', createdAt: reply.createdAt }))
  };
}

async function listReviews(req, res, next) {
  try {
    const productId = req.query.productId;
    const userId = req.query.userId;
    const where = {};
    if (productId) where.productId = productId;
    if (userId) where.userId = userId;

    const reviews = await prisma.review.findMany({
      where,
      include: {
        user: { select: { username: true } },
        product: { select: { name: true } },
        replies: { include: { user: { select: { username: true } } } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const items = reviews.map(sanitizeReview);
    const total = items.length;
    const averageRating = total > 0 ? (items.reduce((sum, review) => sum + Number(review.rating || 0), 0) / total).toFixed(1) : '5.0';

    res.json({ success: true, data: { reviews: items, summary: { total, averageRating } } });
  } catch (err) {
    next(err);
  }
}

async function createReview(req, res, next) {
  try {
    const userId = req.user && req.user.id;
    const { productId, rating, title, body } = req.body;
    if (!userId || !productId || !rating) {
      return res.status(400).json({ success: false, error: 'productId and rating are required' });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });

    const review = await prisma.review.create({
      data: {
        userId,
        productId,
        rating: Number(rating),
        title: title || null,
        body: body || null,
        verified: true
      },
      include: { user: { select: { username: true } }, product: { select: { name: true } }, replies: { include: { user: { select: { username: true } } } } }
    });

    res.status(201).json({ success: true, data: { review: sanitizeReview(review) } });
  } catch (err) {
    next(err);
  }
}

async function replyToReview(req, res, next) {
  try {
    const reviewId = req.params.id;
    const { reply } = req.body;
    if (!reply || !reply.trim()) {
      return res.status(400).json({ success: false, error: 'Reply text is required' });
    }

    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) return res.status(404).json({ success: false, error: 'Review not found' });

    const reviewReply = await prisma.reviewReply.create({
      data: {
        reviewId,
        userId: req.user.id,
        body: reply.trim()
      },
      include: { user: { select: { username: true } } }
    });

    res.status(201).json({ success: true, data: { reply: { id: reviewReply.id, body: reviewReply.body, userId: reviewReply.userId, username: reviewReply.user?.username || 'Admin', createdAt: reviewReply.createdAt } } });
  } catch (err) {
    next(err);
  }
}

async function deleteReview(req, res, next) {
  try {
    const reviewId = req.params.id;
    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) return res.status(404).json({ success: false, error: 'Review not found' });

    await prisma.reviewReply.deleteMany({ where: { reviewId } });
    await prisma.review.delete({ where: { id: reviewId } });

    res.json({ success: true, data: { deletedId: reviewId } });
  } catch (err) {
    next(err);
  }
}

module.exports = { listReviews, createReview, replyToReview, deleteReview };


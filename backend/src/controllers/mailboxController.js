const prisma = require('../database/prismaClient');
const emailService = require('../services/emailService');
const { z } = require('zod');

const SendMailSchema = z.object({ to: z.string().email(), subject: z.string().min(1), text: z.string().optional(), html: z.string().optional() });

function sanitizeMailboxItem(item) {
  return {
    id: item.id,
    subject: item.subject,
    body: item.body,
    isRead: item.isRead,
    createdAt: item.createdAt,
    attachments: (item.attachments || []).map(att => ({ id: att.id, filename: att.filename, mimeType: att.mimeType, size: att.size, url: att.url }))
  };
}

async function listMailbox(req, res, next) {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ success: false, error: 'Authentication required' });

    const page = parseInt(req.query.page || '1', 10) || 1;
    const perPage = parseInt(req.query.perPage || req.query.per_page || '25', 10) || 25;
    const skip = (page - 1) * perPage;

    const [total, items] = await Promise.all([
      prisma.mailbox.count({ where: { ownerId: userId } }),
      prisma.mailbox.findMany({
        where: { ownerId: userId },
        include: { attachments: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: perPage
      })
    ]);

    res.json({ success: true, data: { total, page, perPage, items: items.map(sanitizeMailboxItem) } });
  } catch (err) {
    next(err);
  }
}

async function sendMail(req, res, next) {
  try {
    const parsed = SendMailSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.format() });
    const { to, subject, text, html } = parsed.data;

    const recipient = await prisma.user.findUnique({ where: { email: to } });
    if (recipient) {
      await prisma.mailbox.create({
        data: {
          ownerId: recipient.id,
          subject,
          body: html || text || '',
          isRead: false,
          attachments: { create: [] }
        }
      });
    }

    await emailService.sendMail({ to, subject, text, html });
    res.status(202).json({ success: true, data: { message: 'Mail sent successfully' } });
  } catch (err) {
    next(err);
  }
}

async function markMessageRead(req, res, next) {
  try {
    const userId = req.user && req.user.id;
    const { id } = req.params;
    if (!userId) return res.status(401).json({ success: false, error: 'Authentication required' });

    const message = await prisma.mailbox.updateMany({ where: { id, ownerId: userId }, data: { isRead: true } });
    if (message.count === 0) return res.status(404).json({ success: false, error: 'Message not found' });
    res.json({ success: true, data: { message: 'Message marked as read' } });
  } catch (err) {
    next(err);
  }
}

async function deleteMessage(req, res, next) {
  try {
    const userId = req.user && req.user.id;
    const { id } = req.params;
    if (!userId) return res.status(401).json({ success: false, error: 'Authentication required' });

    const deleted = await prisma.mailbox.deleteMany({ where: { id, ownerId: userId } });
    if (deleted.count === 0) return res.status(404).json({ success: false, error: 'Message not found' });
    res.json({ success: true, data: { message: 'Message deleted' } });
  } catch (err) {
    next(err);
  }
}

async function presignAttachment(req, res, next) {
  try {
    const uploadService = require('../services/uploadService');
    const { filename, contentType, size } = req.body || {};
    const out = await uploadService.createPresignedUpload({ filename, contentType, size, bucket: process.env.R2_BUCKET });
    res.json({ success: true, data: out });
  } catch (err) {
    next(err);
  }
}

module.exports = { listMailbox, sendMail, presignAttachment, markMessageRead, deleteMessage };

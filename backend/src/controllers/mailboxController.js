const emailService = require('../services/emailService');
const { z } = require('zod');

const SendMailSchema = z.object({ to: z.string().email(), subject: z.string().min(1), text: z.string().optional(), html: z.string().optional() });

async function listMailbox(req, res, next) {
  try {
    // For real mailbox list, read from Prisma Mailbox model. Here, return empty array or test stub data.
    res.json({ total: 0, items: [] });
  } catch (err) { next(err); }
}

async function sendMail(req, res, next) {
  try {
    const parsed = SendMailSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.format() });
    const data = parsed.data;
    await emailService.sendMail({ to: data.to, subject: data.subject, text: data.text, html: data.html });
    res.status(202).json({ ok: true });
  } catch (err) { next(err); }
}

async function presignAttachment(req, res, next) {
  try {
    // proxy to uploadService to create presigned URL for attachments
    const uploadService = require('../services/uploadService');
    const { filename, contentType, size } = req.body || {};
    const out = await uploadService.createPresignedUpload({ filename, contentType, size, bucket: process.env.R2_BUCKET });
    res.json(out);
  } catch (err) { next(err); }
}

module.exports = { listMailbox, sendMail, presignAttachment };
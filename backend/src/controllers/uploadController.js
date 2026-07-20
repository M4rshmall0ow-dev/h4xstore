const uploadService = require('../services/uploadService');
const { z } = require('zod');

const PresignSchema = z.object({ filename: z.string().min(1), contentType: z.string().optional(), size: z.number().optional(), bucket: z.string().optional() });

async function createPresignedUpload(req, res, next) {
  try {
    const parsed = PresignSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.format() });
    const payload = parsed.data;
    const result = await uploadService.createPresignedUpload({ filename: payload.filename, contentType: payload.contentType, size: payload.size, bucket: payload.bucket });
    res.json(result);
  } catch (err) { next(err); }
}

module.exports = { createPresignedUpload };
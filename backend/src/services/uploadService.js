// Presigned upload service: supports Supabase Storage (preferred) and Cloudflare R2 / S3 fallback
const logger = require('../utils/logger');

function _isTest() { return process.env.NODE_ENV === 'test'; }

async function createPresignedUpload({ filename, contentType = 'application/octet-stream', size = 0, bucket }) {
  if (_isTest()) {
    // return a stubbed URL for tests
    return { url: `https://test.local/uploads/${encodeURIComponent(filename)}`, expiresAt: new Date(Date.now() + 1000 * 60 * 10).toISOString() };
  }

  // If SUPABASE is configured, prefer Supabase Storage signed upload URL (server-side)
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
      const targetBucket = bucket || process.env.SUPABASE_BUCKET || 'uploads';
      // createSignedUploadUrl API: (filename, expiresIn)
      const expiresIn = 60 * 10; // 10 minutes
      const res = await supabase.storage.from(targetBucket).createSignedUploadUrl(filename, expiresIn);
      if (res.error) throw res.error;
      logger.info(`Supabase signed upload URL created for ${filename} in bucket ${targetBucket}`);
      return { url: res.signedUploadUrl || res.data?.signedUrl || res.data?.signedUploadUrl, expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString() };
    } catch (e) {
      logger.warn('Supabase signed upload failed, falling back to S3/R2', e.message || e);
      // fall through to S3/R2 fallback
    }
  }

  // Fallback: S3-compatible provider (Cloudflare R2)
  const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
  const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
  const region = process.env.R2_REGION || process.env.AWS_REGION || 'auto';
  const endpoint = process.env.R2_ENDPOINT || process.env.S3_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
  const targetBucket = bucket || process.env.R2_BUCKET || process.env.S3_BUCKET;
  if (!targetBucket) throw new Error('No bucket configured for uploads');

  const s3Client = new S3Client({ region, endpoint, credentials: { accessKeyId, secretAccessKey }, forcePathStyle: !!endpoint });
  const key = filename;
  const command = new PutObjectCommand({ Bucket: targetBucket, Key: key, ContentType: contentType });
  const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 * 10 });
  const expiresAt = new Date(Date.now() + 1000 * 60 * 10).toISOString();
  logger.info(`Created presigned URL for ${key} (s3-compatible)`);
  return { url: signedUrl, expiresAt };
}

module.exports = { createPresignedUpload };
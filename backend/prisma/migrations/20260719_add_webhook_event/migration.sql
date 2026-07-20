-- Migration: add_webhook_event
-- Creates WebhookEvent table for idempotent webhook processing

CREATE TABLE IF NOT EXISTS "WebhookEvent" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "eventId" text UNIQUE NOT NULL,
  source text,
  payload jsonb,
  "processedAt" timestamptz DEFAULT now()
);

-- Note: gen_random_uuid() requires the pgcrypto extension; alternatively use uuid_generate_v4().
-- If your DB doesn't support gen_random_uuid, adjust the default accordingly.

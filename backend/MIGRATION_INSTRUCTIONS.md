Migration and Deployment Instructions — WebhookEvent table

Purpose
-------
Add a WebhookEvent table to persist incoming webhook event IDs for idempotent processing of payment provider webhooks (Komerza). This file documents how to apply the prepared migration safely in development and production, how to verify it, and rollback guidance.

Files added by the implementer
-----------------------------
- prisma/schema.prisma — WebhookEvent model was added.
- prisma/migrations/20260719_add_webhook_event/migration.sql — migration SQL that creates the WebhookEvent table.

Migration summary (what the SQL does)
-------------------------------------
The migration creates a table "WebhookEvent" with these columns:
- id (uuid primary key, default gen_random_uuid())
- eventId (text unique, NOT NULL)  -- provider event id
- source (text)                    -- e.g., 'komerza'
- payload (jsonb)                  -- raw webhook payload for audit/debug
- processedAt (timestamptz default now())

Note about UUID default:
- The migration SQL uses gen_random_uuid() which requires the pgcrypto extension on Postgres.
- If your Postgres does not have pgcrypto, either enable it (CREATE EXTENSION IF NOT EXISTS pgcrypto;) or change the migration default to uuid_generate_v4() (requires uuid-ossp extension) or remove the default and let the application supply UUIDs.

Pre-flight checklist (important)
--------------------------------
- Backup production DB before applying migrations.
- Ensure you have a maintenance window if your environment requires one.
- Confirm DATABASE_URL points to the correct target for the environment you're migrating.
- Ensure NODE_ENV is set correctly in production (not 'test').

Apply migration — development (local docker-compose)
---------------------------------------------------
1. Start a local Postgres using the provided docker-compose (optional):
   cd backend
   docker-compose up -d db

2. Apply migration with Prisma (this will create the migration if not present and apply it):
   cd backend
   npx prisma migrate dev --name add_webhook_event

3. Generate the client:
   npx prisma generate

4. Seed initial roles/permissions (optional):
   node prisma/seed.js

Notes:
- prisma migrate dev will create a new migration in prisma/migrations if none existed. In this repo the migration SQL was prepared under prisma/migrations/20260719_add_webhook_event. If you prefer Prisma to manage the migration file, run prisma migrate dev without the existing SQL and inspect the generated SQL.

Apply migration — production / CI
---------------------------------
Use the prepared migration SQL (committed under prisma/migrations/20260719_add_webhook_event). In CI or on production, use migrate deploy to apply already-committed migrations.

1. Ensure the repository with the migration files is checked out on the target environment (CI runner).
2. Set DATABASE_URL in the environment (use CI secret): DATABASE_URL=postgresql://user:pass@host:port/dbname
3. Run:
   cd backend
   npx prisma migrate deploy
   npx prisma generate

4. Optionally seed (if desired):
   node prisma/seed.js

Notes about CI (GitHub Actions)
------------------------------
- A CI workflow file was added at .github/workflows/ci.yml. The integration job will run migrations and seed if secrets.DATABASE_URL is set.
- Add DATABASE_URL as a repository secret in GitHub so the integration job can apply migrations and run tests.

Manual SQL alternative (if not using Prisma migrate deploy)
----------------------------------------------------------
- You can apply the SQL directly using psql or your DB console. Example:
  psql "postgresql://user:pass@host:port/dbname" -f prisma/migrations/20260719_add_webhook_event/migration.sql
- If using this path, ensure you also check in the migration into prisma/migrations so Prisma's migration history is in sync.

Verifying the migration
-----------------------
- Connect to the database and run:
  SELECT * FROM "WebhookEvent" LIMIT 5;
  -- Check that table exists and accepts inserts

- Start the backend (or run an integration test) and do an end-to-end webhook delivery (in a staging environment):
  - POST a webhook payload to /api/webhooks/komerza with proper signature headers
  - Verify a row was created in WebhookEvent for that eventId
  - Verify order status updated and license keys assigned

Verification queries
--------------------
- Count events:
  SELECT count(*) FROM "WebhookEvent";
- Verify recent events with payload:
  SELECT eventId, source, processedAt, payload FROM "WebhookEvent" ORDER BY processedAt DESC LIMIT 20;

Rollback guidance
-----------------
- Recommended approach: create a new migration that removes the WebhookEvent table (drop table) and run the normal migrate deploy flow. This preserves the migration history.
- Manual rollback (direct DB change):
  - DROP TABLE "WebhookEvent";
  - Then update Prisma migration history if necessary.

Security & operational notes
----------------------------
- Do not commit secrets to the repo. Use environment variables and CI secret stores.
- Ensure KOMERZA_WEBHOOK_SECRET is set in the environment for strict signature verification (the code bypasses verification only when NODE_ENV === 'test').
- If your DB requires an extension (pgcrypto or uuid-ossp) to generate UUIDs, enable it before applying the migration:
  - CREATE EXTENSION IF NOT EXISTS pgcrypto;
  - or
  - CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

Post-migration checklist (after applying)
-----------------------------------------
- Run npx prisma generate to refresh the client.
- Run node prisma/seed.js to ensure roles and permissions are present (optional but recommended for admin testing).
- Verify the webhook endpoint works in staging and that a WebhookEvent row is created for each processed webhook.
- Remove any temporary test bypass for webhook signature checks in production (the code includes test bypass only when NODE_ENV === 'test').

If you want me to perform the migration for you later
-----------------------------------------------------
I can run the migration and seed in this environment if you later provide a full DATABASE_URL with write privileges. I will not store the value in the repository; it will be used only to run migration commands in this session. Alternatively, you can run the commands above in your environment/CI.

Contact & support
-----------------
If anything fails when you run the migration, paste the exact error message here and I will guide the fix or produce a corrected migration SQL.

End of instructions

H4xStore Backend

This backend provides secure server-side APIs for H4xStore. It includes authentication, user & role management, products, orders, webhooks, license management, and more.

Features included in this scaffold:
- Express.js server
- Prisma ORM + PostgreSQL schema
- JWT authentication with refresh tokens
- Argon2 password hashing
- RBAC primitives (roles & permissions) modelled in Prisma
- Secure middleware: helmet, CORS, rate limiter, cookie parsing
- Structured project layout ready for the phases described in the migration plan

Getting started
1. Copy .env.example to .env and fill values (DATABASE_URL, JWT_SECRET, REFRESH_SECRET, SMTP settings, KOMERZA keys, USER_DELETE_STRATEGY).
2. Install dependencies: npm install
3. Generate Prisma client: npx prisma generate
4. Apply migrations (development): npx prisma migrate dev --name init
5. Seed default roles/permissions: node prisma/seed.js
6. Start dev server: npm run dev

Testing
- Unit tests use Jest. Run: npm test

Environment variables (copy .env.example and fill in values):
- DATABASE_URL
- JWT_SECRET
- REFRESH_SECRET
- ACCESS_TOKEN_EXPIRES_IN (seconds)
- REFRESH_TOKEN_EXPIRES_IN (seconds)
- KOMERZA_API_KEY
- KOMERZA_WEBHOOK_SECRET
- SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD
- CLOUD_STORAGE_PROVIDER (r2|s3)
- R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET (or S3 equivalents)
- NODE_ENV, PORT
- USER_DELETE_STRATEGY (soft|hard)

Webhooks
- Komerza webhook endpoint is mounted at POST /api/webhooks/komerza and verifies signatures using KOMERZA_WEBHOOK_SECRET.

Uploads (presigned)
- Default provider implemented: Cloudflare R2 (S3-compatible). Configure these env vars to enable presigned uploads:
  - CLOUD_STORAGE_PROVIDER=r2
  - R2_ACCOUNT_ID
  - R2_ACCESS_KEY_ID
  - R2_SECRET_ACCESS_KEY
  - R2_BUCKET
  - R2_ENDPOINT (optional, set to Cloudflare R2 endpoint)

OpenAPI
- A minimal OpenAPI stub is available at backend/docs/openapi.yaml

Testing notes
- Integration tests that exercise the real database require a test DATABASE_URL and running migrations + seed before tests.
- Some unit tests use the existing prisma test stub in src/database/prismaClient.js for fast execution.

Email
- Email sending uses nodemailer and reads SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, MAIL_FROM. In test mode an in-memory stub records sent messages accessible during tests.

Webhook events
- A WebhookEvent model was added to prisma/schema.prisma to persist processed webhook event IDs for idempotency. Create and run a migration (npx prisma migrate dev --name add_webhook_event) to apply this change.

CI & Docker
- A GitHub Actions CI workflow was added at .github/workflows/ci.yml which runs unit tests and (optionally) runs migrations and integration tests if DATABASE_URL is provided as a secret.
- A Dockerfile and docker-compose.yml were added to help run the backend + Postgres locally for integration testing. Use docker-compose up -d then run migrations and seed.

What you NEED TO DO next (actionable)
1. Apply Prisma migration for WebhookEvent model (I created a migration SQL file you can apply):
   - cd backend
   - If using the local docker-compose test DB: docker-compose up -d && npx prisma migrate dev --name add_webhook_event
   - Or, if you have a hosted DB: set DATABASE_URL and run: npx prisma migrate deploy
   - After migrations: npx prisma generate
   - node prisma/seed.js (if you want to seed default roles/permissions)

   Note: I added prisma/migrations/20260719_add_webhook_event/migration.sql which creates the WebhookEvent table. If your Postgres instance lacks gen_random_uuid(), adjust the SQL to use uuid_generate_v4() or supply UUIDs from the application.

2. Provide real credentials (in your environment or CI secrets):
   - SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, MAIL_FROM
   - R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET (or S3 equivalents)
   - KOMERZA_API_KEY, KOMERZA_WEBHOOK_SECRET
   - DATABASE_URL, JWT_SECRET, etc.

3. Remove the test bypass for webhook signature verification in production (the code only bypasses if NODE_ENV === 'test'; ensure NODE_ENV is set correctly in CI/production).

4. If you want real Komerza integration (createCheckout calling Komerza API), provide API docs and credentials; I can implement and add integration tests.

5. Decide on deployment method (Docker, PaaS) and I will prepare deployment manifests and CI pipeline; I've added a Dockerfile and docker-compose.yml as a starting point.


Notes
- This initial scaffold gives a full Prisma schema with models required by the spec. Some business logic functions (e.g., Komerza integration, complex analytics, affiliate payout processing) are provided as stubbed services and must be implemented and tested.
- Do not expose secrets in frontend code. The frontend should call the APIs provided here.

Contact
- This backend is provided by Copilot CLI scaffold. For further customizations, implement the service modules in src/services and controllers in src/controllers.

Next steps
- The repository is being extended to implement Phases 4–16 (user management, RBAC, admin panel APIs, payment integration, license management, reviews, mail system, affiliate tracking, analytics, external control panel and deployment notes). Subsequent commits will add the remaining endpoints, tests, and OpenAPI documentation.

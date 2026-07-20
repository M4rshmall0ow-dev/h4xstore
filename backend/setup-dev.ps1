# Setup script for local development — installs deps, runs migrations, generates Prisma client, seeds, and starts dev server
# Usage (PowerShell):
#   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass; .\setup-dev.ps1

$ErrorActionPreference = 'Stop'

Write-Host "Installing npm dependencies..."
npm.cmd install

# Ensure DATABASE_URL is set in environment before running migrations. If not set, use a default local docker-compose DB.
if (-not $env:DATABASE_URL) {
  Write-Host "DATABASE_URL not set — defaulting to local docker-compose Postgres"
  $env:DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/postgres'
}

Write-Host "Applying Prisma migrations (migrate dev)..."
npx prisma migrate dev --name add_webhook_event --preview-feature

Write-Host "Generating Prisma client..."
npx prisma generate

Write-Host "Seeding database (prisma/seed.js)..."
node prisma/seed.js

Write-Host "Starting dev server (npm run dev)..."
npm.cmd run dev

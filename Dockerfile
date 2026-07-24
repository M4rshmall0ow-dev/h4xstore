FROM node:22-bullseye-slim AS builder
WORKDIR /usr/src/app/backend

# Install build dependencies and build the backend packages
COPY backend/package*.json ./
COPY backend/prisma ./prisma
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && npm ci \
  && npx prisma generate \
  && rm -rf /var/lib/apt/lists/*

FROM node:22-bullseye-slim
WORKDIR /usr/src/app

# Copy the full repository, including frontend root files and backend source code
COPY . .

# Copy the built backend dependencies from the builder stage
COPY --from=builder /usr/src/app/backend/node_modules ./backend/node_modules
COPY --from=builder /usr/src/app/backend/node_modules/.prisma ./backend/node_modules/.prisma

WORKDIR /usr/src/app/backend
EXPOSE 3000
ENV NODE_ENV=production
CMD ["sh", "-c", "echo STARTING CONTAINER && pwd && ls -la && cd /usr/src/app/backend && ls -la && npm start"]

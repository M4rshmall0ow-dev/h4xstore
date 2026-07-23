FROM node:22-bullseye-slim AS builder
WORKDIR /usr/src/app
COPY package*.json ./
COPY prisma ./prisma
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && npm ci \
  && npx prisma generate \
  && rm -rf /var/lib/apt/lists/*
COPY . .
RUN npm run build 2>/dev/null || true

FROM node:22-bullseye-slim
WORKDIR /usr/src/app
COPY package*.json ./
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && npm ci --omit=dev \
  && rm -rf /var/lib/apt/lists/*
COPY --from=builder /usr/src/app/node_modules/.prisma ./node_modules/.prisma
COPY . .
RUN npm run build 2>/dev/null || true
EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", "src/server.js"]

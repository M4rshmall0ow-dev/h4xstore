FROM node:18-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build 2>/dev/null || true
EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", "src/server.js"]

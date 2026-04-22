# syntax=docker/dockerfile:1
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001 -G nodejs
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src
COPY openapi ./openapi
USER nodejs
EXPOSE 3001
CMD ["node", "src/server.js"]

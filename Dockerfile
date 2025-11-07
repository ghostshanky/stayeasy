# ---- Base Stage ----
FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# ---- Builder Stage ----
FROM base AS builder
WORKDIR /app

COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build frontend (if needed for static serving, otherwise skip)
# RUN npm run build

# Build backend (TypeScript to JavaScript)
RUN npm run build:server

# ---- Production Stage ----
FROM node:20-alpine AS production
WORKDIR /app

COPY --from=builder /app/package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 3002
CMD ["node", "dist/server.js"]

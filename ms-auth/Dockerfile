# ---- Build stage ----
FROM node:20-slim AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .
# RUN npm run build -- ignoring build for MVP simplicity, we run ts-node directly or build
RUN npm run build

# ---- Production stage ----
FROM node:20-slim

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /usr/src/app/dist ./dist

EXPOSE 3001

CMD ["node", "dist/main"]

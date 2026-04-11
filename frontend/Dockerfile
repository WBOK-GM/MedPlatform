# syntax=docker/dockerfile:1
FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Build the Next.js app (env vars are injected at runtime for NEXT_PUBLIC_*)
ARG NEXT_PUBLIC_AUTH_URL=http://localhost:3001
ARG NEXT_PUBLIC_DOCTOR_URL=http://localhost:3002
ARG NEXT_PUBLIC_APPOINTMENT_URL=http://localhost:3003
ENV NEXT_PUBLIC_AUTH_URL=$NEXT_PUBLIC_AUTH_URL
ENV NEXT_PUBLIC_DOCTOR_URL=$NEXT_PUBLIC_DOCTOR_URL
ENV NEXT_PUBLIC_APPOINTMENT_URL=$NEXT_PUBLIC_APPOINTMENT_URL
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]

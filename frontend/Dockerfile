# Stage 1: Dependencies
FROM oven/bun:1 AS deps

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Stage 2: Build
FROM oven/bun:1 AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* vars are baked into the client bundle at build time
ARG NEXT_PUBLIC_SERVER_URL
ARG NEXT_PUBLIC_FRONTEND_URL
ENV NEXT_PUBLIC_SERVER_URL=$NEXT_PUBLIC_SERVER_URL
ENV NEXT_PUBLIC_FRONTEND_URL=$NEXT_PUBLIC_FRONTEND_URL

RUN bun run build

# Stage 3: Runtime
# Slim image with only the standalone Next.js server
FROM oven/bun:1-slim

WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 --ingroup appgroup appuser

# Copy static assets (standalone output does not include these)
COPY --from=builder --chown=appuser:appgroup /app/public ./public
COPY --from=builder --chown=appuser:appgroup /app/.next/static ./.next/static

# Copy the standalone server (includes minimal node_modules and server.js)
COPY --from=builder --chown=appuser:appgroup /app/.next/standalone ./

ENV NODE_ENV=production
# Next.js standalone must bind to 0.0.0.0 inside a container
ENV HOSTNAME=0.0.0.0

USER appuser

EXPOSE 3000

CMD ["bun", "server.js"]

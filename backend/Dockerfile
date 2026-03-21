# Stage 1: Build
# Use full Debian-based Bun image for native dependency compilation (bcrypt, etc.)
FROM oven/bun:1 AS builder

WORKDIR /app

# Install dependencies first (layer caching — only re-runs when lock file changes)
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy source and build config
COPY tsconfig.json ./
COPY src ./src

# Build the self-contained bundle (all dependencies inlined into dist/server.js)
RUN bun run build

# Stage 2: Runtime
# Slim image — only the Bun runtime, no build tools
FROM oven/bun:1-slim

WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 --ingroup appgroup appuser

# Copy only the bundled output (single file, ~13MB, no node_modules needed)
COPY --from=builder --chown=appuser:appgroup /app/dist/server.js ./dist/server.js

ENV NODE_ENV=production

USER appuser

EXPOSE 5500

CMD ["bun", "dist/server.js"]

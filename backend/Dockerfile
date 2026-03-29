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
# oven/bun:1-slim is Debian slim which lacks the adduser package;
# groupadd/useradd (from passwd) are always present.
RUN groupadd --system --gid 1001 appgroup && \
    useradd --system --uid 1001 --gid appgroup --no-create-home --shell /usr/sbin/nologin appuser

# Give appuser ownership of /app so Bun can write its runtime cache (.bun/)
RUN chown appuser:appgroup /app

# Copy bundled output (server + migrate scripts, no node_modules needed)
COPY --from=builder --chown=appuser:appgroup /app/dist/server.js ./dist/server.js
COPY --from=builder --chown=appuser:appgroup /app/dist/migrate.js ./dist/migrate.js
COPY --from=builder --chown=appuser:appgroup /app/dist/typesense-migrate.js ./dist/typesense-migrate.js

# Copy SQL migration files for drizzle-orm programmatic migrator
COPY --from=builder --chown=appuser:appgroup /app/src/db/migrations ./migrations

# Copy email templates and assets (loaded at runtime by EmailService via process.cwd()/src/)
COPY --from=builder --chown=appuser:appgroup /app/src/email-templates ./src/email-templates
COPY --from=builder --chown=appuser:appgroup /app/src/assets ./src/assets

# Copy Typesense migration .ts files (discovered and imported dynamically at runtime).
# Preserves the relative directory structure so imports (../constants, ./types, ./helpers) resolve.
# TYPESENSE_MIGRATIONS_DIR env var tells the bundled runner where to find these files.
COPY --from=builder --chown=appuser:appgroup /app/src/shared/infrastructure/typesense.service/migrations/*.ts ./typesense-migrations/migrations/
COPY --from=builder --chown=appuser:appgroup /app/src/shared/infrastructure/typesense.service/constants.ts ./typesense-migrations/constants.ts

ENV NODE_ENV=production

USER appuser

EXPOSE 5500

CMD ["bun", "dist/server.js"]

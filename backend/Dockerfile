# ---- Build stage ----
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src

# Generate the Prisma client (output is gitignored, must be produced here)
RUN npx prisma generate
# Compile TS -> dist (includes the generated client compiled to dist/generated/prisma)
RUN npm run build
# Copy any non-TS runtime assets from the generated client next to the compiled output
RUN cp -r src/generated/prisma/. dist/generated/prisma/ 2>/dev/null || true

# ---- Runtime stage ----
FROM node:20-alpine AS run
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist

EXPOSE 5000

# Run idempotent migrations, then start the server.
CMD ["sh", "-c", "node dist/migrations/runMigrations.js && node dist/index.js"]

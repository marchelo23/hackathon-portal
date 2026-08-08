FROM node:22-alpine AS builder

WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.30.1 --activate

# Copy package and lock files
COPY package.json pnpm-lock.yaml* ./

# Install all dependencies (including dev)
RUN pnpm install --frozen-lockfile || pnpm install

# Copy source code
COPY . .

# Build the TypeScript code
RUN pnpm run build

# Production stage
FROM node:22-alpine

WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.30.1 --activate

COPY package.json pnpm-lock.yaml* ./
# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile || pnpm install --prod

# Copy built code from builder
COPY --from=builder /app/dist ./dist

# Use non-root user
USER node

# Run the app
CMD ["pnpm", "start"]

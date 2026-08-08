# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.30.1 --activate

# Copy package files
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile || pnpm install

# Build args
ARG VITE_PORTAL_API_KEY
ENV VITE_PORTAL_API_KEY=$VITE_PORTAL_API_KEY

# Copy source and build
COPY . .
RUN pnpm run build

# Stage 2: Serve
FROM docker.io/library/nginx:alpine

# Copy built assets to nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

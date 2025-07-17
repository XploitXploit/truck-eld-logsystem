# Development stage
FROM node:22-alpine as development

WORKDIR /app

# Copy package files first to leverage Docker caching
COPY package.json package-lock.json* ./

# Install dependencies (don't install globally in development)
RUN npm ci && \
    npm cache clean --force

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S reactuser -u 1001 && \
    chown -R reactuser:nodejs /app

# Switch to non-root user
USER reactuser

# Expose port for development server
EXPOSE 3000

# Use npm run dev for development (uses local vite)
CMD ["npm", "run", "dev"]

# Build stage
FROM node:22-alpine as build

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:22-alpine as production

WORKDIR /app

# Install serve globally for production
RUN npm install -g serve

# Copy built files from build stage
COPY --from=build /app/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S reactuser -u 1001 && \
    chown -R reactuser:nodejs /app

# Switch to non-root user
USER reactuser

# Expose production port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Use serve for production
CMD ["serve", "-s", "dist", "-l", "3000"]
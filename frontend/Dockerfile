# Development stage
FROM node:22-alpine as development
WORKDIR /app
# Copy package files first to leverage Docker caching
COPY package.json package-lock.json* ./
# Install dependencies explicitly including Vite
RUN npm ci && \
    npm install vite@7.0.4 -g && \
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
# Add the missing CMD instruction for development stage
CMD ["vite", "--host", "0.0.0.0", "--port", "3000"]

# Build stage
FROM node:22-alpine as build
WORKDIR /app
# Copy package files
COPY package.json package-lock.json* ./
# Install dependencies including Vite globally
RUN npm ci && \
    npm install vite@7.0.4 -g
# Copy source code
COPY . .
# Build the application
RUN npm run build

# Production stage
FROM node:22-alpine as production
WORKDIR /app
# Copy package files
COPY package.json package-lock.json* ./
# Install Vite globally to ensure it's accessible
RUN npm ci && \
    npm install vite@7.0.4 -g
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
# Use global Vite for preview server
CMD ["vite", "preview", "--host", "0.0.0.0", "--port", "3000"]
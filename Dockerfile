# Use Node.js LTS
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies for bcrypt compilation
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001 -G nodejs

# Change ownership
RUN chown -R nodeuser:nodejs /app

# Switch to non-root user
USER nodeuser

# Expose port (Railway uses PORT env variable)
EXPOSE ${PORT:-5111}

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-5111}/health || exit 1

# Start the application
CMD ["node", "index.js"]

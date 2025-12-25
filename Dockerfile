# Use Node.js LTS with security updates
FROM node:18.18.2-slim

# Security: Create non-root user first
RUN groupadd -r learncodeai && useradd -r -g learncodeai -d /app -s /sbin/nologin learncodeai

WORKDIR /app

# Security: Update packages
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy package files first for better caching
COPY --chown=learncodeai:learncodeai package*.json ./

# Install dependencies with security audit
RUN npm ci --only=production --audit --audit-level=moderate && \
    npm cache clean --force

# Copy application code
COPY --chown=learncodeai:learncodeai src/ ./src/
COPY --chown=learncodeai:learncodeai scripts/ ./scripts/

# Security: Set proper permissions
RUN chmod -R 555 ./src ./scripts

# Create necessary directories with proper permissions
RUN mkdir -p ./temp ./logs ./uploads && \
    chown -R learncodeai:learncodeai ./temp ./logs ./uploads && \
    chmod 755 ./temp ./logs ./uploads

# Security: Switch to non-root user
USER learncodeai

EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:4000/health || exit 1

# Run the application
CMD ["node", "src/server.js"]

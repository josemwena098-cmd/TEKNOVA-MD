FROM node:20-bullseye

# Install system dependencies (FFmpeg required for media handling)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy repository files into the image
COPY . /app

# Install Node dependencies
RUN npm install --production

# Create sessions directory
RUN mkdir -p /app/sessions

# Expose port
EXPOSE 10000

# Set Node environment
ENV NODE_ENV=production

# Health check for Render
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:${PORT:-10000}/ || exit 1

# Start bot
CMD ["node", "index.js"]

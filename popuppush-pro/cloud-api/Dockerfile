# Pop-up Push Pro - Cloud API Dockerfile
# Simplified for Railway deployment

FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache postgresql-client

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json tsconfig.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY src/ ./src/
COPY database/ ./database/

# Build TypeScript
RUN npm run build

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start
CMD ["node", "dist/server.js"]

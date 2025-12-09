FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install dependencies
RUN npm install
RUN cd client && npm install
RUN cd server && npm install

# Copy source code
COPY client ./client
COPY server ./server

# Build frontend
RUN cd client && npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy server code and dependencies
COPY --from=builder /app/server ./server
COPY --from=builder /app/server/node_modules ./server/node_modules

# Copy built frontend
COPY --from=builder /app/client/dist ./client/dist

# Set environment to production
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Start server
CMD ["node", "server/index.js"]

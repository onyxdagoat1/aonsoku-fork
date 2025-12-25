FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src ./src

# Create upload directory
RUN mkdir -p /tmp/uploads

# Expose port
EXPOSE 3001

# Start service
CMD ["npm", "start"]

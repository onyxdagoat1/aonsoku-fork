FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Create database directory
RUN mkdir -p database

# Expose port
EXPOSE 3002

# Run migrations and start server
CMD ["sh", "-c", "npm run migrate && npm start"]
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source files
COPY server.js ./

EXPOSE 3002

CMD ["node", "server.js"]

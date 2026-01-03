FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source files
COPY . .

# Remove loader files (env handled by docker)
RUN rm -f .env .env.loader.cjs .env.loader.js 2>/dev/null || true

EXPOSE 3005

CMD ["node", "server.js"]

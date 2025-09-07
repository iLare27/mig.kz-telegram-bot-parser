FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript code
RUN npm run build

# Remove TypeScript source files (only keep build output)
RUN rm -rf src/

# Create user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S bot -u 1001

# Change ownership of files
RUN chown -R bot:nodejs /app
USER bot

# Expose port for webhook (if needed)
EXPOSE 3000

# Start the bot
CMD ["npm", "start"]
